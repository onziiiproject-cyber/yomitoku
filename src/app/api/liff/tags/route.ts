import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// LINE access token で LineRecipient を取得
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
    include: {
      recipientTags: { include: { tag: true } },
      company: { include: { tags: { include: { tag: true } } } },
    },
  });
}

// GET: 現在のタグ一覧（個人設定 or 法人デフォルト）
export async function GET(req: NextRequest) {
  const recipient = await getRecipientFromToken(req);
  if (!recipient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const selectedKeys = recipient.recipientTags.map((rt) => rt.tag.key);

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

  // 指定されたキーに対応するタグを取得
  const tags = await prisma.tag.findMany({ where: { key: { in: tagKeys } } });

  // 既存の個人タグを全削除してから再作成
  await prisma.lineRecipientTag.deleteMany({ where: { lineRecipientId: recipient.id } });
  if (tags.length > 0) {
    await prisma.lineRecipientTag.createMany({
      data: tags.map((t) => ({ lineRecipientId: recipient.id, tagId: t.id })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ ok: true, savedCount: tags.length });
}
