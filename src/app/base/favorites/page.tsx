import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ArticleList from "../_components/ArticleList";

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session) redirect("/base/login");

  const favs = await prisma.favorite.findMany({
    where: { companyId: session.companyId },
    include: {
      siteDocument: {
        select: { id: true, title: true, summary: true, tags: true, source: true, publishedAt: true, importance: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const docs = favs.map((f) => f.siteDocument);
  const favoritedIds = docs.map((d) => d.id);

  return (
    <div style={{ paddingTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <a href="/base" style={{ fontSize: 13, color: "#1B7A6D", textDecoration: "none" }}>← 一覧に戻る</a>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1B5E52", margin: 0 }}>お気に入り</h1>
        <span style={{ fontSize: 13, color: "#888", marginLeft: "auto" }}>{docs.length}件</span>
      </div>

      {docs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "1.5px solid #E8F0EE" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔖</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#1B5E52", marginBottom: 8 }}>
            まだ保存した記事がありません
          </p>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
            記事一覧から気になる記事を保存しましょう
          </p>
          <a
            href="/base"
            style={{
              display: "inline-block",
              background: "#1B5E52",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            記事を探す
          </a>
        </div>
      ) : (
        <ArticleList docs={docs} favoritedIds={favoritedIds} isLoggedIn={true} />
      )}
    </div>
  );
}
