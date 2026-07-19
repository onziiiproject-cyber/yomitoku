import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateStructuredContent } from "@/lib/anthropic";
import { processShingiSession } from "@/lib/digest";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-secret") !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const total = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM "SiteDocument"`;
  const withHookTitle = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM "SiteDocument" WHERE "structuredContent"->>'hookTitle' IS NOT NULL`;
  const needsRegen = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM "SiteDocument"
    WHERE ("structuredContent" IS NULL OR "structuredContent"->>'hookTitle' IS NULL)
      AND "summary" IS NOT NULL
  `;
  const withDate = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM "SiteDocument" WHERE "publishedAt" IS NOT NULL`;
  const recent = await prisma.$queryRaw<{ id: string; title: string; published_at: Date | null }[]>`
    SELECT id, LEFT(title,50) as title, "publishedAt" as published_at
    FROM "SiteDocument"
    WHERE "publishedAt" IS NOT NULL
    ORDER BY "publishedAt" DESC
    LIMIT 10
  `;
  return NextResponse.json({
    total: Number(total[0].count),
    withHookTitle: Number(withHookTitle[0].count),
    needsRegen: Number(needsRegen[0].count),
    withDate: Number(withDate[0].count),
    recentArticles: recent,
  });
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-admin-secret") !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { limit = 5 } = await req.json().catch(() => ({}));

  // hookTitle未対応（未生成 or 旧仕様）の記事を取得
  const docs = await prisma.$queryRaw<
    { id: string; url: string; title: string; source: string; rawText: string; publishedAt: Date | null }[]
  >`
    SELECT id, url, title, source, "rawText", "publishedAt"
    FROM "SiteDocument"
    WHERE ("structuredContent" IS NULL OR "structuredContent"->>'hookTitle' IS NULL)
      AND "summary" IS NOT NULL
    ORDER BY "publishedAt" DESC NULLS LAST
    LIMIT ${limit}
  `;

  const remaining = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM "SiteDocument"
    WHERE ("structuredContent" IS NULL OR "structuredContent"->>'hookTitle' IS NULL)
      AND "summary" IS NOT NULL
  `;
  const totalRemaining = Number(remaining[0]?.count ?? 0);

  if (docs.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, remaining: 0, message: "全記事、新仕様に移行済みです" });
  }

  const results: string[] = [];
  for (const doc of docs) {
    try {
      if (doc.source === "shingi") {
        const { count, errors } = await processShingiSession(doc);
        results.push(
          `✅ [分科会] ${doc.title.slice(0, 20)} → ${count}トピックに分割${errors.length ? `（一部失敗: ${errors.length}件）` : ""}`
        );
      } else {
        const structured = await generateStructuredContent(doc.title, doc.rawText);
        await prisma.siteDocument.update({
          where: { id: doc.id },
          data: { structuredContent: structured as object },
        });
        results.push(`✅ ${doc.title.slice(0, 30)}`);
      }
    } catch (e) {
      results.push(`❌ ${doc.title.slice(0, 30)}: ${e}`);
    }
  }

  return NextResponse.json({ ok: true, processed: docs.length, remaining: totalRemaining - docs.length, results });
}
