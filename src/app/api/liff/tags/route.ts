import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// LINE access token で LineRecipient（と紐づくUser）を取得
async function getRecipientFromToken(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const accessToken = auth.slice(7);
  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) return null;

  const { userId } = await profileRes.json();
  return prisma.lineRecipient.findUnique({
    where: { lineUserId: userId },
    include: { user: { include: { tags: { include: { tag: true } } } } },
  });
}

// 通常はWebhook登録時にUserも作られているはずだが、念のためのフォールバック
async function ensureUser(recipient: NonNullable<Awaited<ReturnType<typeof getRecipientFromToken>>>) {
  if (recipient.user) return recipient.user;
  return prisma.user.create({
    data: {
      companyId: recipient.companyId,
      name: recipient.nickname ?? recipient.displayName ?? "メンバー",
      lineRecipientId: recipient.id,
    },
    include: { tags: { include: { tag: true } } },
  });
}

// GET: 現在のタグ一覧（個人設定）
export async function GET(req: NextRequest) {
  const recipient = await getRecipientFromToken(req);
  if (!recipient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await ensureUser(recipient);
  const selectedKeys = user.tags.map((ut) => ut.tag.key);

  return NextResponse.json({ selectedKeys });
}

// PUT: タグを保存（全置換）
export async function PUT(req: NextRequest) {
  const recipient = await getRecipientFromToken(req);
  if (!recipient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tagKeys } = await req.json() as { tagKeys: string[] };
  if (!Array.isArray(tagKeys)) {
    return NextResponse.json({ error: "tagKeys must be an array" }, { status: 400 });
  }

  const user = await ensureUser(recipient);

  // 指定されたキーに対応するタグを取得
  const tags = await prisma.tag.findMany({ where: { key: { in: tagKeys } } });

  // 既存の個人タグを全削除してから再作成
  await prisma.userTag.deleteMany({ where: { userId: user.id } });
  if (tags.length > 0) {
    await prisma.userTag.createMany({
      data: tags.map((t) => ({ userId: user.id, tagId: t.id })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ ok: true, savedCount: tags.length });
}
