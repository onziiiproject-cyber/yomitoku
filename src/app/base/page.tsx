import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import ArticleList from "./_components/ArticleList";
import GuestHeader from "./_components/GuestHeader";
import Image from "next/image";

// ─── Category definitions ───────────────────────────────────────────────────
const CATEGORIES = [
  { key: "mhlw_latest", label: "介護保険最新情報", desc: "厚生労働省から発信される各種通知・事務連絡など",    color: "#0D686E", bg: "#E8F5F1",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { key: "shingi", label: "分科会解説",      desc: "介護給付費分科会の資料とポイント解説",              color: "#D97706", bg: "#FEF3C7",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
  { key: "qa", label: "Q&A（よくある質問）", desc: "介護事業者から寄せられる質問と回答を掲載",          color: "#2563EB", bg: "#EFF6FF",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { key: "guideline", label: "ガイドライン・通知", desc: "各種ガイドラインや各種通知・事務連絡など",        color: "#7C3AED", bg: "#F5F3FF",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  { key: "subsidy", label: "補助金・助成金情報", desc: "国・自治体の補助金や助成金の最新情報",             color: "#DC2626", bg: "#FEF2F2",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { key: "breaking", label: "速報・重要情報", desc: "重要な改定・制度変更の速報情報",                   color: "#EA580C", bg: "#FFF7ED",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
];

const POPULAR_TAGS = ["処遇改善加算", "BCP", "運営指導", "訪問介護", "通所介護", "居宅介護支援", "人員基準", "ICT・DX", "補助金・助成金", "加算・減算"];

// ─── Category filter helper ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildWhere(cat: string, q: string): any {
  const where: Record<string, unknown> = { summary: { not: null } };
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
  } else if (cat === "breaking") {
    where.importance = "high";
  }
  return where;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function BasePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>;
}) {
  const [session, { q = "", cat = "", page = "1" }] = await Promise.all([
    getSession(),
    searchParams,
  ]);

  const isSearch = !!(q || cat);
  const pageNum = Math.max(1, parseInt(page));
  const take = 20;
  const skip = (pageNum - 1) * take;

  // ── Data fetching ────────────────────────────────────────────────────────
  const where = buildWhere(cat, q);

  const [docs, total, featuredDocs, favoritedIds] = await Promise.all([
    isSearch
      ? prisma.siteDocument.findMany({
          where,
          orderBy: [{ importance: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
          take,
          skip,
          select: { id: true, title: true, summary: true, tags: true, source: true, publishedAt: true, importance: true, createdAt: true },
        })
      : Promise.resolve([]),
    isSearch ? prisma.siteDocument.count({ where }) : Promise.resolve(0),
    !isSearch
      ? prisma.siteDocument.findMany({
          where: { importance: "high", summary: { not: null } },
          orderBy: [{ createdAt: "desc" }],
          take: 4,
          select: { id: true, title: true, summary: true, tags: true, source: true, publishedAt: true, importance: true, createdAt: true },
        })
      : Promise.resolve([]),
    session
      ? prisma.favorite.findMany({ where: { companyId: session.companyId }, select: { siteDocumentId: true } }).then((fs) => fs.map((f) => f.siteDocumentId))
      : Promise.resolve([]),
  ]);

  const totalPages = Math.ceil(total / take);
  const currentCat = CATEGORIES.find(c => c.key === cat);

  // ─── Guest wrapper ─────────────────────────────────────────────────────────
  const wrapGuest = (content: React.ReactNode) => !session ? (
    <div style={{ minHeight: "100vh", background: "#F5F7F6", fontFamily: "sans-serif" }}>
      <GuestHeader />
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px 80px" }}>{content}</main>
    </div>
  ) : content;

  // ─── SEARCH / CATEGORY VIEW ────────────────────────────────────────────────
  if (isSearch) {
    const label = currentCat?.label ?? (q ? `「${q}」` : "すべて");
    return wrapGuest(
      <div>
        {/* Breadcrumb / header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <Link href="/base" style={{ fontSize: 13, color: "#0D686E", textDecoration: "none" }}>ホーム</Link>
          <span style={{ color: "#aaa", fontSize: 13 }}>›</span>
          {currentCat && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: currentCat.color, background: currentCat.bg, padding: "2px 8px", borderRadius: 4 }}>
                {currentCat.label}
              </span>
            </div>
          )}
          {q && <span style={{ fontSize: 13, color: "#555" }}>「{q}」の検索結果</span>}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>{label}</h2>
          <span style={{ fontSize: 13, color: "#888" }}>{total.toLocaleString()}件</span>
        </div>

        <ArticleList docs={docs} favoritedIds={favoritedIds} isLoggedIn={!!session} />

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
            {pageNum > 1 && <a href={`/base?cat=${cat}&q=${q}&page=${pageNum - 1}`} style={pageLinkStyle}>← 前へ</a>}
            <span style={{ padding: "8px 16px", fontSize: 13, color: "#888" }}>{pageNum} / {totalPages}</span>
            {pageNum < totalPages && <a href={`/base?cat=${cat}&q=${q}&page=${pageNum + 1}`} style={pageLinkStyle}>次へ →</a>}
          </div>
        )}
      </div>
    );
  }

  // ─── HOME VIEW ─────────────────────────────────────────────────────────────
  return wrapGuest(
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Guest login CTA */}
      {!session && (
        <div style={{ background: "#FFF8F0", border: "1.5px solid #F5A623", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#7B4F00", margin: 0, marginBottom: 2 }}>ログインして記事全体を読もう</p>
            <p style={{ fontSize: 12, color: "#A07040", margin: 0 }}>会員登録することでLINEでの通知＋全文が読めるようになります</p>
          </div>
          <a href="/base/login" style={{ background: "#0D686E", color: "#fff", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
            ログイン
          </a>
        </div>
      )}

      {/* Hero banner */}
      <div style={{
        background: "linear-gradient(135deg, #0A5459 0%, #0D686E 50%, #1B9C8E 100%)",
        borderRadius: 16,
        padding: "28px 32px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        overflow: "hidden",
        position: "relative",
        minHeight: 160,
      }}>
        <div style={{ flex: 1, zIndex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 6px", lineHeight: 1.35 }}>
            必要な情報を、必要な時に。
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: "0 0 18px", lineHeight: 1.6 }}>
            通知・Q&A・分科会・ガイドラインなど、<br />介護保険に関する情報をまとめて検索できます。
          </p>
          <form method="GET" action="/base" style={{ display: "flex", gap: 8, maxWidth: 480 }}>
            <input
              name="q"
              placeholder="何をお探しですか？　例：処遇改善　加算　運営指導"
              style={{ flex: 1, padding: "11px 16px", borderRadius: 10, border: "2px solid rgba(255,255,255,0.6)", fontSize: 14, outline: "none", color: "#1a1a1a", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
            />
            <button type="submit" style={{ background: "#F5A623", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
              検索
            </button>
          </form>
          {/* Popular keywords */}
          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>人気：</span>
            {POPULAR_TAGS.slice(0, 6).map(tag => (
              <a key={tag} href={`/base?q=${encodeURIComponent(tag)}`} style={{
                fontSize: 11, color: "#fff", background: "rgba(255,255,255,0.18)", padding: "3px 10px",
                borderRadius: 12, textDecoration: "none", border: "1px solid rgba(255,255,255,0.25)",
              }}>
                {tag}
              </a>
            ))}
          </div>
        </div>
        {/* Illustration */}
        <div style={{ flexShrink: 0, width: 180, position: "relative", zIndex: 1 }}>
          <Image
            src="/design/assets/hero-characters/character-laptop-working.png"
            alt=""
            width={180}
            height={140}
            style={{ width: "100%", height: "auto", objectFit: "contain" }}
          />
        </div>
      </div>

      {/* Featured articles (importance=high) */}
      {featuredDocs.length > 0 && (
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 4, height: 18, background: "#EA580C", borderRadius: 2, display: "block" }} />
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>今週の注目情報</h2>
            </div>
            <Link href="/base?cat=breaking" style={{ fontSize: 12, color: "#0D686E", textDecoration: "none", fontWeight: 600 }}>
              すべて見る →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {featuredDocs.map((doc) => {
              const srcLabel = doc.source === "shingi" ? "分科会" : "最新情報";
              const srcColor = doc.source === "shingi" ? "#D97706" : "#0D686E";
              const srcBg   = doc.source === "shingi" ? "#FEF3C7" : "#E8F5F1";
              return (
                <Link key={doc.id} href={`/base/articles/${doc.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: "14px",
                    border: "1.5px solid #F0E8D0",
                    height: "100%",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ background: "#F5A623", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 3 }}>速報</span>
                      <span style={{ fontSize: 10, color: srcColor, background: srcBg, padding: "2px 6px", borderRadius: 3, fontWeight: 600 }}>{srcLabel}</span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", margin: 0, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {doc.title}
                    </p>
                    {doc.summary && (
                      <p style={{ fontSize: 11, color: "#777", margin: 0, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {doc.summary}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Category cards */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 4, height: 18, background: "#0D686E", borderRadius: 2, display: "block" }} />
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>情報をカテゴリから探す</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {CATEGORIES.map(c => (
            <a key={c.key} href={`/base?cat=${c.key}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: "#fff",
                borderRadius: 10,
                padding: "16px 14px",
                border: `1.5px solid ${c.bg}`,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "box-shadow 0.15s",
              }}>
                <div style={{ width: 44, height: 44, background: c.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: c.color }}>
                  {c.icon}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}>{c.label}</div>
                <div style={{ fontSize: 11, color: "#888", lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Tag cloud */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ width: 4, height: 18, background: "#6366F1", borderRadius: 2, display: "block" }} />
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>タグから探す</h2>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {POPULAR_TAGS.map(tag => (
            <a key={tag} href={`/base?q=${encodeURIComponent(tag)}`} style={{
              fontSize: 13,
              color: "#374151",
              background: "#fff",
              border: "1.5px solid #D5E8E5",
              borderRadius: 20,
              padding: "6px 14px",
              textDecoration: "none",
              fontWeight: 500,
            }}>
              # {tag}
            </a>
          ))}
        </div>
      </section>

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
