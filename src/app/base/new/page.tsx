import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import ArticleList from "../_components/ArticleList";

export default async function NewArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [session, { page = "1" }] = await Promise.all([getSession(), searchParams]);
  const pageNum = Math.max(1, parseInt(page));
  const take = 20;
  const skip = (pageNum - 1) * take;

  const where = { importance: "high", summary: { not: null }, publishedAt: { not: null } };

  const [docs, total, favorites] = await Promise.all([
    prisma.siteDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true, title: true, summary: true, tags: true, source: true,
        publishedAt: true, importance: true, createdAt: true, structuredContent: true,
      },
    }),
    prisma.siteDocument.count({ where }),
    session
      ? prisma.favorite.findMany({ where: { companyId: session.companyId }, select: { siteDocumentId: true } })
      : Promise.resolve([]),
  ]);

  const favoritedIds = favorites.map((f) => f.siteDocumentId);
  const totalPages = Math.ceil(total / take);

  return (
    <div style={{ paddingTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <a href="/base" style={{ fontSize: 13, color: "#1B7A6D", textDecoration: "none" }}>← 一覧に戻る</a>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1B5E52", margin: 0 }}>新着情報</h1>
        <span style={{ fontSize: 13, color: "#888", marginLeft: "auto" }}>{total.toLocaleString()}件</span>
      </div>

      <ArticleList docs={docs} favoritedIds={favoritedIds} isLoggedIn={!!session} />

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {pageNum > 1 && (
            <a href={`/base/new?page=${pageNum - 1}`} style={pageLinkStyle}>← 前へ</a>
          )}
          <span style={{ padding: "8px 16px", fontSize: 13, color: "#888" }}>{pageNum} / {totalPages}</span>
          {pageNum < totalPages && (
            <a href={`/base/new?page=${pageNum + 1}`} style={pageLinkStyle}>次へ →</a>
          )}
        </div>
      )}
    </div>
  );
}

const pageLinkStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#fff",
  border: "1.5px solid #D1E8E4",
  borderRadius: 8,
  fontSize: 13,
  color: "#0D686E",
  textDecoration: "none",
  fontWeight: 600,
};
