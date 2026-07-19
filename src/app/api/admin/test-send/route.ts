import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushWeeklyDigestCards, type WeeklyCardDoc } from "@/lib/line-message";
import type { StructuredContent } from "@/lib/anthropic";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    };
  });

  // LINE送信
  const recipients = await prisma.lineRecipient.findMany({
    where: { unfollowedAt: null, company: { status: "ACTIVE" } },
  });

  const testBatchId = "test-" + Date.now();
  const results: string[] = [];

  for (const r of recipients) {
    try {
      await pushWeeklyDigestCards(
        r.lineUserId,
        "テスト",
        cardDocs.length,
        "【テスト送信】今週の介護保険最新情報をお届けします。これは週刊ヨミトクのFlex Message（カード形式）のテストです。",
        cardDocs,
        testBatchId
      );
      results.push(`✅ ${r.lineUserId}`);
    } catch (e) {
      results.push(`❌ ${r.lineUserId}: ${e}`);
    }
  }

  return NextResponse.json({ ok: true, sent: results.length, results });
}
