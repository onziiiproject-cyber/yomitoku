import { prisma } from "@/lib/prisma";
import { messagingApi } from "@line/bot-sdk";

function getClient() {
  return new messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  });
}

export async function verifyLineToken(token: string): Promise<{ userId: string; displayName: string } | null> {
  const res = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const profile = await res.json();
  return { userId: profile.userId, displayName: profile.displayName ?? "メンバー" };
}

// 全角英数字→半角、小文字→大文字、空白除去。日本語キーボードでの全角変換や
// 大文字小文字の揺れで事業所コードが一致しない、という事象を防ぐ。
export function normalizeInviteCode(input: string): string {
  return input
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .toUpperCase()
    .replace(/\s+/g, "");
}

export const INVITE_CODE_PATTERN = /^[A-Z2-9]{8}$/;

export type RegisterResult =
  | { ok: true; companyName: string; memberOfName: string }
  | { ok: false; reason: "invalid" | "full" | "already_registered" };

// lineUserIdはunique制約があるため、ブロック解除後の再登録は
// 既存行を復活させる（unfollowedAtをクリアし、新しい事業所に付け替える）
export async function registerRecipientByCode(
  userId: string,
  normalizedCode: string,
  displayName: string
): Promise<RegisterResult> {
  // 既にアクティブ登録済みの場合は上書きしない（ニックネーム・所属が消えるのを防ぐ）
  const existing = await prisma.lineRecipient.findUnique({ where: { lineUserId: userId } });
  if (existing && !existing.unfollowedAt) return { ok: false, reason: "already_registered" };

  const company = await prisma.company.findFirst({
    where: { inviteCode: normalizedCode, status: "ACTIVE" },
    include: { lineRecipients: { where: { unfollowedAt: null } } },
  });

  if (!company) return { ok: false, reason: "invalid" };
  if (company.lineRecipients.length >= company.maxRecipients) return { ok: false, reason: "full" };

  const recipient = await prisma.lineRecipient.upsert({
    where: { lineUserId: userId },
    create: { lineUserId: userId, companyId: company.id, displayName },
    update: { companyId: company.id, displayName, unfollowedAt: null, nickname: null },
  });

  const existingUser = await prisma.user.findUnique({ where: { lineRecipientId: recipient.id } });
  const user = existingUser
    ? await prisma.user.update({ where: { id: existingUser.id }, data: { companyId: company.id, name: displayName } })
    : await prisma.user.create({ data: { companyId: company.id, name: displayName, lineRecipientId: recipient.id } });

  // 法人タグを個人の初期タグとしてコピー
  const companyTags = await prisma.companyTag.findMany({ where: { companyId: company.id } });
  if (companyTags.length > 0) {
    await prisma.userTag.createMany({
      data: companyTags.map((ct) => ({ userId: user.id, tagId: ct.tagId })),
      skipDuplicates: true,
    });
  }

  return { ok: true, companyName: company.name, memberOfName: company.facilityName ?? company.name };
}

export type SetNicknameResult = { ok: true } | { ok: false, reason: "not_found" | "invalid" };

export async function setNicknameAndActivate(userId: string, nickname: string): Promise<SetNicknameResult> {
  if (nickname.length === 0 || nickname.length > 20) return { ok: false, reason: "invalid" };

  const recipient = await prisma.lineRecipient.findUnique({ where: { lineUserId: userId } });
  if (!recipient || recipient.unfollowedAt) return { ok: false, reason: "not_found" };

  await prisma.lineRecipient.update({ where: { lineUserId: userId }, data: { nickname } });
  await prisma.user.updateMany({ where: { lineRecipientId: recipient.id }, data: { name: nickname } });

  // 登録完了後は「メンバー用」リッチメニューに切り替える。IDが未設定の環境では何もしない
  const memberMenuId = process.env.LINE_RICHMENU_MEMBER_ID;
  if (memberMenuId) {
    try {
      await getClient().linkRichMenuIdToUser(userId, memberMenuId);
    } catch (e) {
      console.error("[line-registration] richmenu link failed:", e);
    }
  }

  return { ok: true };
}
