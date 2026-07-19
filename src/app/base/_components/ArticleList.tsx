import Link from "next/link";
import FavoriteButton from "./FavoriteButton";
import type { StructuredContent } from "@/lib/anthropic";

interface Doc {
  id: string;
  title: string;
  summary: string | null;
  tags: string[];
  source: string;
  publishedAt: Date | null;
  importance: string;
  createdAt: Date;
  structuredContent?: unknown;
}

const SOURCE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  mhlw_latest: { label: "介護保険最新情報", color: "#1B7A6D", bg: "#E8F5F1" },
  shingi: { label: "分科会かんたん解説", color: "#7B4F00", bg: "#FFF3E0" },
};

function formatDate(d: Date | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" });
}

export default function ArticleList({
  docs,
  favoritedIds = [],
  isLoggedIn = false,
}: {
  docs: Doc[];
  favoritedIds?: string[];
  isLoggedIn?: boolean;
}) {
  if (docs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
        <p style={{ fontSize: 15 }}>該当する記事が見つかりませんでした</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {docs.map((doc) => {
        const src = SOURCE_LABEL[doc.source] ?? { label: doc.source, color: "#555", bg: "#F3F4F6" };
        const date = formatDate(doc.publishedAt ?? doc.createdAt);
        const isNew = new Date().getTime() - new Date(doc.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
        const isFav = favoritedIds.includes(doc.id);
        const sc = doc.structuredContent as unknown as StructuredContent | null;
        const displayTitle = sc?.hookTitle || doc.title;

        return (
          <div key={doc.id} style={{ position: "relative" }}>
            <Link
              href={`/base/articles/${doc.id}`}
              style={{ textDecoration: "none", display: "block" }}
            >
              <div style={{
                background: "#fff",
                borderRadius: 12,
                padding: "16px 18px",
                paddingRight: 56,
                border: doc.importance === "high" ? "1.5px solid #F5A623" : "1.5px solid #E8F0EE",
                cursor: "pointer",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  {isNew && (
                    <span style={{ background: "#F5A623", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
                      新着
                    </span>
                  )}
                  <span style={{ background: src.bg, color: src.color, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4 }}>
                    {src.label}
                  </span>
                  <span style={{ fontSize: 12, color: "#aaa", marginLeft: "auto" }}>{date}</span>
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px", lineHeight: 1.4 }}>
                  {displayTitle}
                </h3>

                {doc.summary && (
                  <p style={{ fontSize: 13, color: "#666", margin: "0 0 10px", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {doc.summary}
                  </p>
                )}

                {doc.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {doc.tags.slice(0, 4).map((tag) => (
                      <span key={tag} style={{ fontSize: 11, color: "#1B7A6D", background: "#E8F5F1", padding: "2px 8px", borderRadius: 10 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>

            {/* Favorite button overlaid top-right */}
            <div style={{ position: "absolute", top: 14, right: 14 }}>
              <FavoriteButton
                docId={doc.id}
                initialFavorited={isFav}
                isLoggedIn={isLoggedIn}
                size="sm"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
