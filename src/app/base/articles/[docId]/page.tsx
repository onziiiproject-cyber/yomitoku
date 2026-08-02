import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GuestHeader from "../../_components/GuestHeader";
import ArticleSwiper from "../../_components/ArticleSwiper";
import ArticleAudioBriefingCard from "../../_components/ArticleAudioBriefingCard";
import { redactStructuredContentForGuest, type StructuredContent } from "@/lib/anthropic";

const SITE_URL = "https://yomitoku-base.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ docId: string }>;
}): Promise<Metadata> {
  const { docId } = await params;
  const doc = await prisma.siteDocument.findUnique({
    where: { id: docId },
    select: { title: true, summary: true, publishedAt: true },
  });

  if (!doc || !doc.publishedAt || !doc.summary) {
    return { title: "記事が見つかりません | ヨミトク編集部" };
  }

  const title = `${doc.title} | ヨミトク編集部`;
  const description = doc.summary.slice(0, 120);
  const url = `${SITE_URL}/base/articles/${docId}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: doc.title, description, url, siteName: "ヨミトク編集部", locale: "ja_JP", type: "article" },
    twitter: { card: "summary_large_image", title: doc.title, description },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const [session, { docId }] = await Promise.all([getSession(), params]);

  const [doc, favoriteRecord, readRecord, readCount, likeRecord, likeCount, comments] = await Promise.all([
    prisma.siteDocument.findUnique({ where: { id: docId }, include: { audioBriefing: true } }),
    session
      ? prisma.favorite.findUnique({
          where: { companyId_siteDocumentId: { companyId: session.companyId, siteDocumentId: docId } },
        })
      : Promise.resolve(null),
    session
      ? prisma.articleRead.findUnique({
          where: { companyId_siteDocumentId: { companyId: session.companyId, siteDocumentId: docId } },
        })
      : Promise.resolve(null),
    prisma.articleRead.count({ where: { siteDocumentId: docId } }),
    session
      ? prisma.articleLike.findUnique({
          where: { companyId_siteDocumentId: { companyId: session.companyId, siteDocumentId: docId } },
        })
      : Promise.resolve(null),
    prisma.articleLike.count({ where: { siteDocumentId: docId } }),
    prisma.articleComment.findMany({
      where: { siteDocumentId: docId },
      orderBy: [{ isEditorComment: "desc" }, { createdAt: "desc" }],
      include: { commentLikes: { select: { companyId: true } } },
    }),
  ]);

  if (!doc || !doc.publishedAt) notFound();

  const initialComments = comments.map((c) => ({
    id: c.id,
    body: c.body,
    authorName: c.authorName,
    createdAt: c.createdAt.toISOString(),
    likeCount: c.commentLikes.length,
    likedByMe: session ? c.commentLikes.some((l) => l.companyId === session.companyId) : false,
    isEditorComment: c.isEditorComment,
    authorIconKey: c.authorIconKey,
    authorIconUrl: c.authorIconUrl,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: doc.title,
    description: doc.summary ?? undefined,
    datePublished: doc.publishedAt.toISOString(),
    dateModified: (doc.processedAt ?? doc.publishedAt).toISOString(),
    mainEntityOfPage: `${SITE_URL}/base/articles/${doc.id}`,
    publisher: { "@type": "Organization", name: "ヨミトク編集部" },
  };

  const jsonLdScript = (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );

  const swiper = (
    <ArticleSwiper
      id={doc.id}
      title={doc.title}
      summary={doc.summary}
      structuredContent={doc.structuredContent
        ? (session
            ? (doc.structuredContent as unknown as StructuredContent)
            : redactStructuredContentForGuest(doc.structuredContent as unknown as StructuredContent))
        : null}
      tags={doc.tags as string[]}
      source={doc.source}
      publishedAt={doc.publishedAt.toISOString()}
      createdAt={doc.createdAt.toISOString()}
      importance={doc.importance}
      decisionStatus={doc.decisionStatus}
      shingiVariant={doc.shingiVariant}
      url={doc.url}
      initialRead={!!readRecord}
      initialReadCount={readCount}
      initialLiked={!!likeRecord}
      initialLikeCount={likeCount}
      initialFavorited={!!favoriteRecord}
      initialComments={initialComments}
      isLoggedIn={!!session}
    />
  );

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7FAF9", fontFamily: "sans-serif" }}>
        {jsonLdScript}
        <GuestHeader />
        <main style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px 80px" }}>
          {swiper}
        </main>
      </div>
    );
  }

  const audioBriefing =
    doc.audioBriefing && doc.audioBriefing.status === "PUBLISHED" && doc.audioBriefing.audioUrl
      ? (
          <ArticleAudioBriefingCard
            title={doc.audioBriefing.title}
            description={doc.audioBriefing.description}
            audioUrl={doc.audioBriefing.audioUrl}
            heroImageUrl={doc.audioBriefing.heroImageUrl}
          />
        )
      : null;

  return (
    <>
      {jsonLdScript}
      {swiper}
      {audioBriefing}
    </>
  );
}
