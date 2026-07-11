import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushWeeklyDigest, type DigestDoc } from "@/lib/line-message";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get latest docs from DB
  const docs = await prisma.siteDocument.findMany({
    where: { summary: { not: null } },
    orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
    take: 5,
  });

  if (docs.length === 0) {
    return NextResponse.json({ error: "No documents in DB yet" }, { status: 400 });
  }

  const digestDocs: DigestDoc[] = docs.map((d) => ({
    title: d.title,
    summary: d.summary ?? "",
    url: d.url,
    importance: d.importance,
    tags: d.tags,
  }));

  // Get all active recipients
  const recipients = await prisma.lineRecipient.findMany({
    where: { unfollowedAt: null, company: { status: "ACTIVE" } },
  });

  // Use existing batch or create a test one
  const testBatchId = "test-" + Date.now();

  const results: string[] = [];
  for (const r of recipients) {
    try {
      await pushWeeklyDigest(
        r.lineUserId,
        "【テスト送信】今週の介護保険最新情報をお届けします。これはヨミトクのFlex Messageテストです。",
        digestDocs,
        "テスト",
        testBatchId
      );
      results.push(`✅ ${r.lineUserId}`);
    } catch (e) {
      results.push(`❌ ${r.lineUserId}: ${e}`);
    }
  }

  return NextResponse.json({ ok: true, sent: results.length, results });
}
