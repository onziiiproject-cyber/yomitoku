import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPDFAIComment } from "@/lib/anthropic";
import { pushWeeklyDigest, type DigestDoc } from "@/lib/line-message";
import { generateDigestPDF, type PDFDigestDoc } from "@/lib/pdf-digest";
import { put } from "@vercel/blob";

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

  const digestDocs: DigestDoc[] = docs.map((d) => ({
    title: d.title,
    summary: d.summary ?? "",
    url: d.url,
    importance: d.importance,
    tags: d.tags as string[],
  }));

  // PDF生成 → Blob
  let pdfUrl: string | null = null;
  try {
    const pdfDocs: PDFDigestDoc[] = docs.map((d) => ({
      id: d.id,
      title: d.title,
      summary: d.summary ?? "",
      url: d.url,
      importance: d.importance,
      tags: (d.tags as string[]) ?? [],
      publishedAt: d.publishedAt,
      source: d.source ?? "",
    }));

    const aiComment = await buildPDFAIComment(
      pdfDocs.map((d) => ({ title: d.title, summary: d.summary, tags: d.tags, importance: d.importance }))
    );

    const now = new Date();
    const fmtJp = (d: Date) => `令和${d.getFullYear() - 2018}年${d.getMonth() + 1}月${d.getDate()}日`;
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const pdfBuffer = await generateDigestPDF(
      pdfDocs,
      "テスト号",
      { from: fmtJp(weekAgo), to: fmtJp(now) },
      aiComment
    );

    const blob = await put(
      `digest/test-${now.toISOString().slice(0, 10)}.pdf`,
      pdfBuffer,
      { access: "public", contentType: "application/pdf", addRandomSuffix: false, allowOverwrite: true }
    );
    pdfUrl = blob.url;
  } catch (e) {
    console.error("[test-send] PDF generation failed:", e);
  }

  // LINE送信
  const recipients = await prisma.lineRecipient.findMany({
    where: { unfollowedAt: null, company: { status: "ACTIVE" } },
  });

  const testBatchId = "test-" + Date.now();
  const results: string[] = [];

  for (const r of recipients) {
    try {
      await pushWeeklyDigest(
        r.lineUserId,
        "【テスト送信】今週の介護保険最新情報をお届けします。これはヨミトクのFlex Messageテストです。",
        digestDocs,
        "テスト",
        testBatchId,
        pdfUrl
      );
      results.push(`✅ ${r.lineUserId}`);
    } catch (e) {
      results.push(`❌ ${r.lineUserId}: ${e}`);
    }
  }

  return NextResponse.json({ ok: true, sent: results.length, pdfUrl, results });
}
