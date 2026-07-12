import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ArticleList from "./_components/ArticleList";

const CATEGORIES = [
  { key: "all", label: "すべて" },
  { key: "mhlw_latest", label: "介護保険最新情報" },
  { key: "shingi", label: "分科会" },
  { key: "qa", label: "Q&A" },
  { key: "guideline", label: "ガイドライン" },
  { key: "subsidy", label: "補助金・助成金" },
];

export default async function BasePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/base/login");

  const { q = "", cat = "all", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page));
  const take = 20;
  const skip = (pageNum - 1) * take;

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { summary: { not: null } };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ];
  }

  if (cat === "mhlw_latest" || cat === "shingi") {
    where.source = cat;
  } else if (cat === "qa") {
    where.tags = { hasSome: ["Q&A"] };
  } else if (cat === "guideline") {
    where.tags = { hasSome: ["ガイドライン"] };
  } else if (cat === "subsidy") {
    where.tags = { hasSome: ["補助金・助成金"] };
  }

  const [docs, total] = await Promise.all([
    prisma.siteDocument.findMany({
      where,
      orderBy: [{ importance: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take,
      skip,
      select: { id: true, title: true, summary: true, tags: true, source: true, publishedAt: true, importance: true, createdAt: true },
    }),
    prisma.siteDocument.count({ where }),
  ]);

  const totalPages = Math.ceil(total / take);

  return (
    <div style={{ paddingTop: 24 }}>
      {/* Hero search */}
      <div style={{
        background: "linear-gradient(135deg, #1B5E52 0%, #2D8B7A 100%)",
        borderRadius: 16,
        padding: "28px 24px",
        marginBottom: 24,
        color: "#fff",
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
          介護保険の最新情報を、すぐ見つける
        </h1>
        <p style={{ fontSize: 13, color: "#a8d5c8", marginBottom: 20 }}>
          通知・Q&A・分科会・ガイドラインなど、必要な情報をまとめて検索
        </p>
        <form method="GET" action="/base" style={{ display: "flex", gap: 8 }}>
          <input
            name="q"
            defaultValue={q}
            placeholder="例：処遇改善　加算　運営指導"
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              fontSize: 15,
              outline: "none",
              color: "#1a1a1a",
            }}
          />
          <button
            type="submit"
            style={{
              background: "#F5A623",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 20px",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            検索
          </button>
        </form>
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
        {CATEGORIES.map((c) => (
          <a
            key={c.key}
            href={`/base?cat=${c.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            style={{
              flexShrink: 0,
              padding: "7px 16px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: cat === c.key ? 700 : 500,
              background: cat === c.key ? "#1B5E52" : "#fff",
              color: cat === c.key ? "#fff" : "#444",
              border: cat === c.key ? "none" : "1.5px solid #D1E8E4",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {c.label}
          </a>
        ))}
      </div>

      {/* Results count */}
      <div style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
        {q && <span>「{q}」の検索結果 · </span>}
        <span>{total}件</span>
      </div>

      {/* Article list */}
      <ArticleList docs={docs} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
          {pageNum > 1 && (
            <a href={`/base?cat=${cat}&q=${q}&page=${pageNum - 1}`} style={pageLinkStyle}>← 前へ</a>
          )}
          <span style={{ padding: "8px 16px", fontSize: 13, color: "#888" }}>{pageNum} / {totalPages}</span>
          {pageNum < totalPages && (
            <a href={`/base?cat=${cat}&q=${q}&page=${pageNum + 1}`} style={pageLinkStyle}>次へ →</a>
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
  color: "#1B5E52",
  textDecoration: "none",
  fontWeight: 600,
};
