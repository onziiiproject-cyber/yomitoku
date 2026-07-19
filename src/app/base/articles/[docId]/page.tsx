import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import GuestHeader from "../../_components/GuestHeader";
import ArticleSwiper from "../../_components/ArticleSwiper";
import type { StructuredContent } from "@/lib/anthropic";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const [session, { docId }] = await Promise.all([getSession(), params]);

  const [doc, favoriteRecord, readRecord, readCount, likeRecord, likeCount, comments] = await Promise.all([
    prisma.siteDocument.findUnique({ where: { id: docId } }),
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
      orderBy: { createdAt: "desc" },
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
  }));

  const swiper = (
    <ArticleSwiper
      id={doc.id}
      title={doc.title}
      summary={doc.summary}
      structuredContent={doc.structuredContent ? (doc.structuredContent as unknown as StructuredContent) : null}
      tags={doc.tags as string[]}
      source={doc.source}
      publishedAt={doc.publishedAt.toISOString()}
      createdAt={doc.createdAt.toISOString()}
      importance={doc.importance}
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
        <GuestHeader />
        <main style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px 80px" }}>
          {swiper}
        </main>
      </div>
    );
  }

  return swiper;
}
