import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPDFAIComment } from "@/lib/anthropic";
import { generateDigestPDF, PDFDigestDoc } from "@/lib/pdf-digest";

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 直近7日以内のドキュメントを取得（なければ最新20件）
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let docs = await prisma.siteDocument.findMany({
    where: { publishedAt: { gte: since } },
    orderBy: [{ importance: "asc" }, { publishedAt: "desc" }],
    take: 20,
  });

  if (docs.length === 0) {
    docs = await prisma.siteDocument.findMany({
      orderBy: [{ publishedAt: "desc" }],
      take: 12,
    });
  }

  if (docs.length === 0) {
    return NextResponse.json({ error: "No documents found" }, { status: 404 });
  }

  const pdfDocs: PDFDigestDoc[] = docs.map((d: typeof docs[number]) => ({
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
    pdfDocs.map(d => ({
      title: d.title,
      summary: d.summary,
      tags: d.tags,
      importance: d.importance,
    }))
  );

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmtJp = (d: Date) => {
    const reiwa = d.getFullYear() - 2018;
    return `令和${reiwa}年${d.getMonth() + 1}月${d.getDate()}日`;
  };
  const fmtFile = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

  const pdfBuffer = await generateDigestPDF(
    pdfDocs,
    `第${getWeekNumber(now)}週`,
    { from: fmtJp(weekAgo), to: fmtJp(now) },
    aiComment
  );

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="weekly-digest-${fmtFile(now)}.pdf"`,
    },
  });
}

function getWeekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}
