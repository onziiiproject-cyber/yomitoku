import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { generateCoverCardImage, generateSummaryCardImage } from "@/lib/social-image";
import { postArticleToSocial } from "@/lib/meta";
import type { StructuredContent } from "@/lib/anthropic";

export const maxDuration = 60;

// 特定記事1件のFacebook/Instagram投稿を手動でテストする。
// 本番のrunProcessPendingにはまだ組み込んでいない（動作確認用）。
export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { docId } = await req.json();
  if (!docId) return NextResponse.json({ error: "docId required" }, { status: 400 });

  const doc = await prisma.siteDocument.findUnique({ where: { id: docId } });
  if (!doc || !doc.summary) return NextResponse.json({ error: "Document not found or unprocessed" }, { status: 404 });

  const structured = doc.structuredContent as unknown as StructuredContent | null;
  const points = structured?.points ?? [];
  const title = structured?.hookTitle || doc.title;

  const [coverBuffer, summaryBuffer] = await Promise.all([
    generateCoverCardImage({
      title,
      subtitle: doc.title,
      source: doc.source,
      tags: doc.tags,
      publishedAt: doc.publishedAt ?? new Date(),
      decisionStatus: doc.decisionStatus,
    }),
    generateSummaryCardImage({ source: doc.source, points }),
  ]);

  const [coverBlob, summaryBlob] = await Promise.all([
    put(`social/article-${doc.id}-cover-${Date.now()}.png`, coverBuffer, {
      access: "public",
      contentType: "image/png",
    }),
    put(`social/article-${doc.id}-summary-${Date.now()}.png`, summaryBuffer, {
      access: "public",
      contentType: "image/png",
    }),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yomitoku-base.com";
  const articleUrl = `${baseUrl}/base/articles/${doc.id}`;

  const result = await postArticleToSocial({
    imageUrls: [coverBlob.url, summaryBlob.url],
    summary: doc.summary,
    articleUrl,
  });

  return NextResponse.json({
    ok: true,
    coverImageUrl: coverBlob.url,
    summaryImageUrl: summaryBlob.url,
    ...result,
  });
}
