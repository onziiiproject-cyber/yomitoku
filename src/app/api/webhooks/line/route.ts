import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { messagingApi } from "@line/bot-sdk";

export const dynamic = "force-dynamic";

function verifySignature(body: string, sig: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const expected = hmac.digest("base64");
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

// 全角英数字→半角、小文字→大文字、空白除去。日本語キーボードでの全角変換や
// 大文字小文字の揺れで事業所コードが一致しない、という事象を防ぐ。
function normalizeInviteCode(input: string): string {
  return input
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .toUpperCase()
    .replace(/\s+/g, "");
}

function getClient() {
  return new messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  });
}

type LineEvent = {
  type: string;
  replyToken?: string;
  source?: { userId?: string };
  message?: { type: string; text?: string };
};

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("x-line-signature") ?? "";

  if (!verifySignature(body, sig, process.env.LINE_CHANNEL_SECRET!)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(body);
  const events: LineEvent[] = payload.events ?? [];
  const client = getClient();

  for (const ev of events) {
    try {
      await handleEvent(ev, client);
    } catch (e) {
      // 1件の返信失敗（例: アクセストークン切れ・返信トークン期限切れ）で
      // 後続イベントの処理やLINEへの200応答が止まらないようにする
      console.error("[webhooks/line] event handling failed:", ev.type, e);
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleEvent(ev: LineEvent, client: messagingApi.MessagingApiClient) {
  const userId = ev.source?.userId;

  if (ev.type === "follow" && userId) {
    await prisma.webhookEvent.upsert({
      where: { source_externalEventId: { source: "LINE", externalEventId: `follow-${userId}` } },
      create: {
        source: "LINE",
        externalEventId: `follow-${userId}`,
        type: "follow",
        payload: JSON.stringify({ userId }),
        processedAt: new Date(),
      },
      update: { processedAt: new Date() },
    });

    if (ev.replyToken) {
      await client.replyMessage({
        replyToken: ev.replyToken,
        messages: [{
          type: "text",
          text: "ヨミトク編集部へようこそ！🎉\n\nLINE通知を受け取るには、あなたの「事業所コード」をこのチャットに送ってください。\n\n事業所コードは登録時のメールに記載しています。設定ページでも確認できます。",
        }],
      });
    }
    return;
  }

  if (ev.type === "unfollow" && userId) {
    await prisma.lineRecipient.updateMany({
      where: { lineUserId: userId },
      data: { unfollowedAt: new Date() },
    });
    return;
  }

  // Handle text messages: facility invite code or info
  if (ev.type === "message" && ev.message?.type === "text" && ev.replyToken && userId) {
    const text = ev.message.text?.trim() ?? "";
    const normalizedCode = normalizeInviteCode(text);
    const existingRecipient = await prisma.lineRecipient.findUnique({ where: { lineUserId: userId } });

    // Check if the message looks like a facility invite code (8 uppercase alphanumeric chars)
    // 全角入力・小文字はnormalizeInviteCodeで吸収する
    const codeMatch = normalizedCode.match(/^[A-Z2-9]{8}$/);
    if (codeMatch && !existingRecipient) {
      const company = await prisma.company.findFirst({
        where: { inviteCode: normalizedCode, status: "ACTIVE" },
        include: { lineRecipients: { where: { unfollowedAt: null } } },
      });

      if (!company) {
        await client.replyMessage({
          replyToken: ev.replyToken,
          messages: [{ type: "text", text: `「${text}」は有効な事業所コードではありません。\n登録済みの事業所コードを確認してください。` }],
        });
      } else if (company.lineRecipients.length >= company.maxRecipients) {
        await client.replyMessage({
          replyToken: ev.replyToken,
          messages: [{ type: "text", text: `${company.name}のLINE登録人数が上限（${company.maxRecipients}名）に達しています。\n管理者にお問い合わせください。` }],
        });
      } else {
        // Get display name from LINE
        let displayName = "メンバー";
        try {
          const profile = await client.getProfile(userId);
          displayName = profile.displayName;
        } catch { /* ignore */ }

        const newRecipient = await prisma.lineRecipient.create({
          data: { lineUserId: userId, companyId: company.id, displayName },
        });

        // 個人（User）を新規作成。BASEでの表示名・タグの好みはこの単位で管理する
        const newUser = await prisma.user.create({
          data: { companyId: company.id, name: displayName, lineRecipientId: newRecipient.id },
        });

        // 法人タグを個人の初期タグとしてコピー
        const companyTags = await prisma.companyTag.findMany({ where: { companyId: company.id } });
        if (companyTags.length > 0) {
          await prisma.userTag.createMany({
            data: companyTags.map((ct) => ({ userId: newUser.id, tagId: ct.tagId })),
            skipDuplicates: true,
          });
        }

        const memberOfName = company.facilityName ?? company.name;
        await client.replyMessage({
          replyToken: ev.replyToken,
          messages: [{
            type: "text",
            text: `✅ 登録完了！\n\n${memberOfName}のメンバーとして登録されました🎉\n\n続いて、ヨミトク編集室で使うニックネームを教えてください。\n（例：たなか、田中さん）\n\nログイン情報として必ず必要となるため返信をお願いします🙇‍♂️`,
          }],
        });
      }
      return;
    }

    // ニックネームがまだ未設定の場合は次のメッセージをニックネームとして保存
    if (existingRecipient && !existingRecipient.nickname) {
      if (text.length > 0 && text.length <= 20) {
        await prisma.lineRecipient.update({
          where: { lineUserId: userId },
          data: { nickname: text },
        });
        await prisma.user.updateMany({
          where: { lineRecipientId: existingRecipient.id },
          data: { name: text },
        });
        await client.replyMessage({
          replyToken: ev.replyToken,
          messages: [{
            type: "text",
            text: `✅ ニックネーム登録完了！\n\n${text}さん、よろしくお願いします✨\n\nこのLINEアカウントでは、毎週水曜日に週刊ヨミトク🦍という形であなたのタグ設定に合わせて1週間の新着情報をまとめてお送りしていきます。\nタグ設定はリッチメニューからいつでも変更できます。\n\nまた、すべての情報や過去の記事はヨミトク編集室（WEBページ）から検索・閲覧🔍できます。このLINEアカウントでログインが可能🉑です。\n編集室へはリッチメニューから飛ぶことができます🫡`,
          }],
        });
      } else {
        await client.replyMessage({
          replyToken: ev.replyToken,
          messages: [{
            type: "text",
            text: `ヨミトク編集室で使うニックネームを教えてください。\n（20文字以内でお願いします）`,
          }],
        });
      }
      return;
    }

    // 登録済み・ニックネーム設定済みユーザーからのメッセージは無視
    if (existingRecipient) {
      return;
    }

    // 未登録ユーザーが送ってきたメッセージは基本的に事業所コードの送信を試みたものと考え、
    // 定型文をただ繰り返すのではなく「なぜ通らなかったか」が分かるようにする
    await client.replyMessage({
      replyToken: ev.replyToken,
      messages: [{
        type: "text",
        text: `「${text}」は事業所コードの形式ではないようです。\n\n事業所コードは英数字8桁です（例：AB3DEFGH）。\n登録時のメールまたは設定ページに記載のコードを、そのままコピー＆ペーストして送ってみてください。`,
      }],
    });
  }
}
