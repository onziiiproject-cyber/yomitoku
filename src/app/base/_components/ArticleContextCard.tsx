export interface ArticleContext {
  title: string;
  hookTitle?: string;
  sourceLabel: string;
  sourceColor: string;
  sourceBg: string;
  publishedAt: string;
  importanceStars?: number;
  urgencyStars?: number;
}

function starText(stars?: number) {
  if (!stars) return null;
  return "★".repeat(stars) + "☆".repeat(5 - stars);
}

export default function ArticleContextCard({ article }: { article: ArticleContext }) {
  const displayTitle = article.hookTitle || article.title;
  const date = new Date(article.publishedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" });

  return (
    <div style={{
      background: article.sourceBg,
      borderRadius: 12,
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <span style={{
        fontSize: 11, fontWeight: 700, color: article.sourceColor,
        background: "rgba(255,255,255,0.7)", padding: "3px 9px", borderRadius: 4, width: "fit-content",
      }}>
        {article.sourceLabel}
      </span>
      <p style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a", margin: 0, lineHeight: 1.5 }}>
        {displayTitle}
      </p>
      {displayTitle !== article.title && (
        <p style={{ fontSize: 11, color: "#888", margin: 0, lineHeight: 1.5 }}>{article.title}</p>
      )}
      <span style={{ fontSize: 11, color: "#999" }}>{date}</span>
      {(article.importanceStars || article.urgencyStars) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
          {article.importanceStars ? (
            <span style={{ fontSize: 11, color: "#888" }}>重要度 {starText(article.importanceStars)}</span>
          ) : null}
          {article.urgencyStars ? (
            <span style={{ fontSize: 11, color: "#888" }}>緊急度 {starText(article.urgencyStars)}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
