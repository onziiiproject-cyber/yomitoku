import { prisma } from "@/lib/prisma";

export interface FeedComment {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  isEditorComment: boolean;
  authorIconKey: string | null;
  authorIconUrl: string | null;
}

export interface FeedExtras {
  readIds: Set<string>;
  likedIds: Set<string>;
  favoritedIds: Set<string>;
  readCounts: Map<string, number>;
  likeCounts: Map<string, number>;
  commentsByDoc: Map<string, FeedComment[]>;
}

const EMPTY: FeedExtras = {
  readIds: new Set(),
  likedIds: new Set(),
  favoritedIds: new Set(),
  readCounts: new Map(),
  likeCounts: new Map(),
  commentsByDoc: new Map(),
};

export async function loadFeedExtras(docIds: string[], companyId: string | null): Promise<FeedExtras> {
  if (docIds.length === 0) return EMPTY;

  const [readGroup, likeGroup, myReads, myLikes, myFavorites, comments] = await Promise.all([
    prisma.articleRead.groupBy({ by: ["siteDocumentId"], where: { siteDocumentId: { in: docIds } }, _count: { _all: true } }),
    prisma.articleLike.groupBy({ by: ["siteDocumentId"], where: { siteDocumentId: { in: docIds } }, _count: { _all: true } }),
    companyId
      ? prisma.articleRead.findMany({ where: { siteDocumentId: { in: docIds }, companyId }, select: { siteDocumentId: true } })
      : Promise.resolve([]),
    companyId
      ? prisma.articleLike.findMany({ where: { siteDocumentId: { in: docIds }, companyId }, select: { siteDocumentId: true } })
      : Promise.resolve([]),
    companyId
      ? prisma.favorite.findMany({ where: { siteDocumentId: { in: docIds }, companyId }, select: { siteDocumentId: true } })
      : Promise.resolve([]),
    prisma.articleComment.findMany({
      where: { siteDocumentId: { in: docIds } },
      orderBy: [{ isEditorComment: "desc" }, { createdAt: "desc" }],
      include: { commentLikes: { select: { companyId: true } } },
    }),
  ]);

  const commentsByDoc = new Map<string, FeedComment[]>();
  for (const c of comments) {
    const dto: FeedComment = {
      id: c.id,
      body: c.body,
      authorName: c.authorName,
      createdAt: c.createdAt.toISOString(),
      likeCount: c.commentLikes.length,
      likedByMe: companyId ? c.commentLikes.some((l) => l.companyId === companyId) : false,
      isEditorComment: c.isEditorComment,
      authorIconKey: c.authorIconKey,
      authorIconUrl: c.authorIconUrl,
    };
    const list = commentsByDoc.get(c.siteDocumentId) ?? [];
    list.push(dto);
    commentsByDoc.set(c.siteDocumentId, list);
  }

  return {
    readIds: new Set(myReads.map((r) => r.siteDocumentId)),
    likedIds: new Set(myLikes.map((l) => l.siteDocumentId)),
    favoritedIds: new Set(myFavorites.map((f) => f.siteDocumentId)),
    readCounts: new Map(readGroup.map((g) => [g.siteDocumentId, g._count._all])),
    likeCounts: new Map(likeGroup.map((g) => [g.siteDocumentId, g._count._all])),
    commentsByDoc,
  };
}
