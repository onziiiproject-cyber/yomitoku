import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import FeedArticleCard from "./_components/FeedArticleCard";
import FeedTabs from "./_components/FeedTabs";
import MobileSearchBar from "./_components/MobileSearchBar";
import { loadFeedExtras } from "@/lib/feedData";
import type { StructuredContent } from "@/lib/anthropic";

// ─── カテゴリ判定ロジック ────────────────────────────────────────────────────
// サイドバーのリンクは 介護保険最新情報／分科会かんたん解説／タグ検索 のみだが、
// タグクリック経由で qa・guideline・subsidy・breaking にも到達しうるため判定は維持する。
const CATEGORY_LABELS: Record<string, string> = {
  mhlw_latest: "介護保険最新情報",
  shingi: "分科会かんたん解説",
  qa: "Q&A（よくある質問）",
  guideline: "ガイドライン・通知",
  subsidy: "補助金・助成金情報",
  breaking: "速報・重要情報",
};

const PERIOD_DAYS: Record<string, number> = { week: 7, month: 30, "3m": 90 };
const PERIOD_LABELS: Record<string, string> = { week: "今週", month: "今月", "3m": "過去3ヶ月" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildWhere(cat: string, q: string, tag: string, period: string): any {
  const where: Record<string, unknown> = { summary: { not: null }, publishedAt: { not: null } };
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
  if (tag) {
    where.tags = { has: tag };
  }
  if (PERIOD_DAYS[period]) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - PERIOD_DAYS[period]);
    where.publishedAt = { not: null, gte: cutoff };
  }
  return where;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function BasePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; tag?: string; period?: string; page?: string; feed?: string }>;
}) {
  const [session, { q = "", cat = "", tag = "", period = "", page = "1", feed = "mine" }] = await Promise.all([
    getSession(),
    searchParams,
  ]);

  const isFiltered = !!(q || cat || tag || period);
  const feedMode: "mine" | "all" = feed === "all" ? "all" : "mine";
  const pageNum = Math.max(1, parseInt(page));
  const take = 20;
  const skip = (pageNum - 1) * take;
  const where = buildWhere(cat, q, tag, period);

  // ホーム画面(未検索時)のみ「あなたにオススメ」タブに対応。
  // WEB・LINEどちらからでも編集できる個人のタグ（UserTag）を使う。
  let hasNoTagPreference = false;
  if (!isFiltered && feedMode === "mine" && session?.userId) {
    const myTags = await prisma.userTag.findMany({
      where: { userId: session.userId },
      include: { tag: true },
    });
    const myTagLabels = myTags.map((t) => t.tag.label);
    if (myTagLabels.length > 0) {
      where.tags = { hasSome: myTagLabels };
    } else {
      hasNoTagPreference = true;
    }
  }

  const [docs, total] = await Promise.all([
    prisma.siteDocument.findMany({
      where,
      // 発表日付順（新しいものが上）
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take,
      skip,
      select: {
        id: true, title: true, summary: true, structuredContent: true, tags: true,
        source: true, publishedAt: true, importance: true, url: true, createdAt: true,
      },
    }),
    prisma.siteDocument.count({ where }),
  ]);

  const extras = await loadFeedExtras(docs.map((d) => d.id), session?.companyId ?? null);
  const totalPages = Math.ceil(total / take);
  const labelParts = [
    CATEGORY_LABELS[cat],
    tag ? `#${tag}` : "",
    q ? `「${q}」` : "",
    PERIOD_LABELS[period] ?? "",
  ].filter(Boolean);
  const label = labelParts.join(" ・ ");

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>

      {/* Guest login CTA */}
      {!session && (
        <div style={{ background: "#FFF8F0", border: "1.5px solid #F5A623", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#7B4F00", margin: 0, marginBottom: 2 }}>ログインして記事全体を読もう</p>
            <p style={{ fontSize: 12, color: "#A07040", margin: 0 }}>会員登録することでLINEでの通知＋全文が読めるようになります</p>
          </div>
          <a href="/base/login" style={{ background: "#0D686E", color: "#fff", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
            ログイン
          </a>
        </div>
      )}

      {/* スマホ用検索バー（ヘッダーの検索フォームはスマホで非表示のため） */}
      <MobileSearchBar defaultValue={q} />

      {/* あなたにオススメ / 全ての投稿一覧 タブ（ホーム画面のみ） */}
      {!isFiltered && <FeedTabs active={feedMode} />}

      {/* タグ未設定時の案内 */}
      {!isFiltered && feedMode === "mine" && hasNoTagPreference && (
        <div style={{ background: "#F0F9F8", border: "1.5px solid #D0E8E4", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#1B5E52" }}>
          興味のあるタグがまだ設定されていません。
          <Link href="/base/profile" style={{ color: "#0D686E", fontWeight: 700, textDecoration: "underline", marginLeft: 4 }}>
            プロフィールでタグを設定する →
          </Link>
        </div>
      )}

      {/* Breadcrumb / filter header */}
      {isFiltered && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Link href="/base" style={{ fontSize: 13, color: "#0D686E", textDecoration: "none" }}>ホーム</Link>
            <span style={{ color: "#aaa", fontSize: 13 }}>›</span>
            <span style={{ fontSize: 13, color: "#555" }}>{label || "検索結果"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>{label || "検索結果"}</h2>
            <span style={{ fontSize: 13, color: "#888" }}>{total.toLocaleString()}件</span>
          </div>
        </div>
      )}

      {/* Feed */}
      {docs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 15 }}>該当する記事が見つかりませんでした</p>
        </div>
      ) : (
        <div>
          {docs.map((doc, i) => (
            <FeedArticleCard
              key={doc.id}
              showScrollHint={i === 0}
              id={doc.id}
              title={doc.title}
              summary={doc.summary}
              structuredContent={doc.structuredContent ? (doc.structuredContent as unknown as StructuredContent) : null}
              tags={doc.tags as string[]}
              source={doc.source}
              publishedAt={doc.publishedAt!.toISOString()}
              createdAt={doc.createdAt.toISOString()}
              importance={doc.importance}
              url={doc.url}
              initialRead={extras.readIds.has(doc.id)}
              initialReadCount={extras.readCounts.get(doc.id) ?? 0}
              initialLiked={extras.likedIds.has(doc.id)}
              initialLikeCount={extras.likeCounts.get(doc.id) ?? 0}
              initialFavorited={extras.favoritedIds.has(doc.id)}
              initialComments={extras.commentsByDoc.get(doc.id) ?? []}
              isLoggedIn={!!session}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
          {pageNum > 1 && <a href={`/base?cat=${cat}&q=${q}&tag=${tag}&period=${period}&page=${pageNum - 1}`} style={pageLinkStyle}>← 前へ</a>}
          <span style={{ padding: "8px 16px", fontSize: 13, color: "#888" }}>{pageNum} / {totalPages}</span>
          {pageNum < totalPages && <a href={`/base?cat=${cat}&q=${q}&tag=${tag}&period=${period}&page=${pageNum + 1}`} style={pageLinkStyle}>次へ →</a>}
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
