import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushWeeklyDigestCards, type WeeklyCardDoc } from "@/lib/line-message";
import type { StructuredContent } from "@/lib/anthropic";

export const maxDuration = 120;

// テスト送信は必ず指定したlineUserId 1件だけに送る。
// 過去にunfollowedAt:null && company.status:ACTIVEの全件に送ってしまう実装だった時期があり、
// 「テスト」のつもりで本番の全顧客にメッセージが飛ぶ事故を防ぐため、宛先の指定を必須にしている。
export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const lineUserId = typeof body.lineUserId === "string" ? body.lineUserId.trim() : "";
  if (!lineUserId) {
    return NextResponse.json(
      { error: "lineUserId is required（このエンドポイントは特定1件のみへの送信専用です）" },
      { status: 400 }
    );
  }

  const recipient = await prisma.lineRecipient.findUnique({ where: { lineUserId } });
  if (!recipient) {
    return NextResponse.json({ error: `LineRecipient not found for lineUserId=${lineUserId}` }, { status: 404 });
  }

  // DBから直近ドキュメントを取得
  const docs = await prisma.siteDocument.findMany({
    where: { summary: { not: null } },
    orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

  if (docs.length === 0) {
    return NextResponse.json({ error: "No documents in DB yet" }, { status: 400 });
  }

  const cardDocs: WeeklyCardDoc[] = docs.map((d) => {
    const sc = d.structuredContent as unknown as StructuredContent | null;
    return {
      id: d.id,
      title: d.title,
      hookTitle: sc?.hookTitle ?? null,
      source: d.source,
      tags: (d.tags as string[]) ?? [],
      importanceStars: sc?.importanceStars ?? null,
      urgencyStars: sc?.urgencyStars ?? null,
      isNew: new Date().getTime() - new Date(d.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000,
      decisionStatus: d.decisionStatus,
    };
  });

  try {
    await pushWeeklyDigestCards(
      lineUserId,
      "テスト",
      cardDocs.length,
      "【テスト送信】今週の介護保険最新情報をお届けします。これは週刊ヨミトクのFlex Message（カード形式）のテストです。",
      cardDocs,
      "test-" + Date.now()
    );
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sentTo: lineUserId });
}
