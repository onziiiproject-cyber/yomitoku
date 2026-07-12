import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

const SOURCE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  mhlw_latest: { label: "介護保険最新情報", color: "#1B7A6D", bg: "#E8F5F1" },
  shingi: { label: "分科会解説", color: "#7B4F00", bg: "#FFF3E0" },
};

function formatDate(d: Date | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/base/login");

  const { docId } = await params;
  const doc = await prisma.siteDocument.findUnique({ where: { id: docId } });
  if (!doc) notFound();

  const src = SOURCE_LABEL[doc.source] ?? { label: doc.source, color: "#555", bg: "#F3F4F6" };

  // Related articles: same tags, different doc
  const related = doc.tags.length > 0
    ? await prisma.siteDocument.findMany({
        where: {
          id: { not: doc.id },
          tags: { hasSome: doc.tags },
          summary: { not: null },
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 3,
        select: { id: true, title: true, source: true, tags: true, publishedAt: true },
      })
    : [];

  return (
    <div style={{ paddingTop: 20 }}>
      {/* Back */}
      <Link href="/base" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#1B7A6D", textDecoration: "none", marginBottom: 20 }}>
        ← 一覧に戻る
      </Link>

      {/* Article card */}
      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1.5px solid #E8F0EE" }}>
        {/* Source + date header */}
        <div style={{ background: doc.importance === "high" ? "#7B2D2D" : "#1B5E52", padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4 }}>
              {src.label}
            </span>
            {doc.importance === "high" && (
              <span style={{ background: "#F5A623", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
                速報
              </span>
            )}
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginLeft: "auto" }}>
              {formatDate(doc.publishedAt)}
            </span>
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: "#fff", lineHeight: 1.4, margin: 0 }}>
            {doc.title}
          </h1>
        </div>

        <div style={{ padding: "20px" }}>
          {/* Tags */}
          {doc.tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
              {doc.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/base?q=${encodeURIComponent(tag)}`}
                  style={{ fontSize: 12, color: "#1B7A6D", background: "#E8F5F1", padding: "4px 10px", borderRadius: 12, textDecoration: "none" }}
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* AI Summary */}
          {doc.summary && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <div style={{ width: 4, height: 18, background: "#1B5E52", borderRadius: 2 }} />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1B5E52", margin: 0 }}>AI要約</h2>
              </div>
              <div style={{ background: "#F7FAF9", borderRadius: 10, padding: "16px", fontSize: 14, color: "#333", lineHeight: 1.8 }}>
                {doc.summary}
              </div>
            </div>
          )}

          {/* Original source link */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <div style={{ width: 4, height: 18, background: "#888", borderRadius: 2 }} />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#444", margin: 0 }}>原文・資料</h2>
            </div>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#FFF8F0",
                border: "1.5px solid #F5A623",
                borderRadius: 10,
                padding: "14px 16px",
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: 24 }}>📄</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#7B4F00" }}>厚生労働省 原文</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{doc.url.replace(/^https?:\/\//, "").slice(0, 50)}…</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 18 }}>↗</span>
            </a>
          </div>

          {/* Related articles */}
          {related.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <div style={{ width: 4, height: 18, background: "#6B9E96", borderRadius: 2 }} />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#444", margin: 0 }}>関連記事</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {related.map((r) => {
                  const rs = SOURCE_LABEL[r.source] ?? { label: r.source, color: "#555", bg: "#F3F4F6" };
                  return (
                    <Link
                      key={r.id}
                      href={`/base/articles/${r.id}`}
                      style={{
                        display: "block",
                        background: "#F7FAF9",
                        borderRadius: 10,
                        padding: "12px 14px",
                        textDecoration: "none",
                        border: "1px solid #E8F0EE",
                      }}
                    >
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: rs.color, background: rs.bg, padding: "2px 7px", borderRadius: 4 }}>
                          {rs.label}
                        </span>
                        <span style={{ fontSize: 11, color: "#aaa" }}>{formatDate(r.publishedAt)}</span>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", margin: 0, lineHeight: 1.4 }}>
                        {r.title}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
