import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { StructuredContent } from "@/lib/anthropic";

function formatDate(d: Date | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

const SOURCE_COLOR: Record<string, { label: string; color: string; bg: string }> = {
  mhlw_latest: { label: "最新情報", color: "#0D686E", bg: "#E8F5F1" },
  shingi:      { label: "分科会", color: "#D97706", bg: "#FEF3C7" },
};

export default async function RightSidebar() {
  const [breakingDocs, latestBatch] = await Promise.all([
    prisma.siteDocument.findMany({
      where: { importance: "high", summary: { not: null }, publishedAt: { not: null } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 4,
      select: { id: true, title: true, source: true, publishedAt: true, createdAt: true, structuredContent: true },
    }),
    prisma.messageBatch.findFirst({
      where: { kind: "WEEKLY_DIGEST" },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, content: true, createdAt: true },
    }),
  ]);

  return (
    <aside style={{
      width: 420,
      flexShrink: 0,
      padding: "20px 16px",
      position: "sticky",
      top: 64,
      height: "calc(100vh - 64px)",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      {/* 最新の速報 */}
      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #E2EDEB" }}>
        <div style={{ padding: "12px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F0F7F5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, background: "#EF4444", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 0 3px rgba(239,68,68,0.15)" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>新着情報</span>
          </div>
          <a href="/base/new" style={{ fontSize: 11, color: "#0D686E", textDecoration: "none", fontWeight: 600 }}>
            すべて見る →
          </a>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {breakingDocs.length === 0 ? (
            <p style={{ fontSize: 12, color: "#aaa", padding: "16px", margin: 0 }}>速報はありません</p>
          ) : breakingDocs.map((doc, i) => {
            const src = SOURCE_COLOR[doc.source] ?? { label: doc.source, color: "#555", bg: "#F3F4F6" };
            const sc = doc.structuredContent as unknown as StructuredContent | null;
            const displayTitle = sc?.hookTitle || doc.title;
            return (
              <Link
                key={doc.id}
                href={`/base/articles/${doc.id}`}
                style={{
                  display: "block",
                  padding: "10px 16px",
                  textDecoration: "none",
                  borderBottom: i < breakingDocs.length - 1 ? "1px solid #F5F9F8" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: src.color, background: src.bg, padding: "1px 6px", borderRadius: 3 }}>
                    {src.label}
                  </span>
                  <span style={{ fontSize: 11, color: "#aaa" }}>{formatDate(doc.publishedAt ?? doc.createdAt)}</span>
                </div>
                <p style={{ fontSize: 12, color: "#1a1a1a", fontWeight: 600, margin: 0, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {displayTitle}
                </p>
              </Link>
            );
          })}
        </div>
        {breakingDocs.length > 0 && (
          <div style={{ padding: "8px 16px 12px" }}>
            <a href="/base/new" style={{ display: "block", textAlign: "center", fontSize: 12, color: "#0D686E", fontWeight: 600, textDecoration: "none", padding: "6px", border: "1px solid #D0E8E4", borderRadius: 6 }}>
              もっと見る
            </a>
          </div>
        )}
      </div>

      {/* 今週のダイジェスト */}
      {latestBatch && (
        <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #E2EDEB" }}>
          <div style={{ padding: "12px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F0F7F5" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>今週のダイジェスト</span>
            <Link href={`/digest/${latestBatch.id}`} style={{ fontSize: 11, color: "#0C447C", textDecoration: "none", fontWeight: 600 }}>
              すべて見る →
            </Link>
          </div>
          <div style={{ padding: "12px 16px" }}>
            <div style={{
              background: "#E6F1FB",
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <div style={{ width: 36, height: 36, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C447C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 11, color: "#0C447C", fontWeight: 700, margin: 0, marginBottom: 2 }}>{latestBatch.title}</p>
                <p style={{ fontSize: 10, color: "#7BA3C7", margin: 0 }}>{formatDate(latestBatch.createdAt)}</p>
              </div>
            </div>
            {latestBatch.content && (
              <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6, margin: "0 0 10px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {latestBatch.content}
              </p>
            )}
            <Link
              href={`/digest/${latestBatch.id}`}
              style={{
                display: "block",
                textAlign: "center",
                background: "#0C447C",
                color: "#fff",
                padding: "8px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              ダイジェストを読む →
            </Link>
          </div>
        </div>
      )}

      {/* 広告バナー */}
      <div style={{
        background: "#F7FAF9",
        borderRadius: 12,
        border: "1.5px dashed #D0E8E4",
        padding: "24px 16px",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 11, color: "#9BB5B0", margin: 0 }}>広告枠</p>
      </div>
    </aside>
  );
}
