"use client";
import ArticleContextCard, { type ArticleContext } from "./ArticleContextCard";

const CATEGORIES = [
  "日付・数値の誤り",
  "内容が原文と違う",
  "誤字脱字",
  "わかりにくい",
  "その他",
];

export default function ReportModal({
  open,
  onClose,
  article,
  category,
  onCategoryChange,
  body,
  onBodyChange,
  onSubmit,
  posting,
  error,
  sent,
}: {
  open: boolean;
  onClose: () => void;
  article: ArticleContext;
  category: string;
  onCategoryChange: (v: string) => void;
  body: string;
  onBodyChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  posting: boolean;
  error: string;
  sent: boolean;
}) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 760, maxHeight: "84vh",
          display: "flex", flexWrap: "wrap", overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* 左: どの記事への報告か分かるカード */}
        <div style={{ flex: "1 1 240px", maxWidth: 280, padding: 16, borderRight: "1px solid #E8F0EE", overflowY: "auto" }}>
          <ArticleContextCard article={article} />
        </div>

        {/* 右: 報告フォーム */}
        <div style={{ flex: "2 1 320px", display: "flex", flexDirection: "column", minWidth: 0, maxHeight: "84vh" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #E8F0EE", flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>気になる点を報告</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#888", display: "flex" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "32px 12px" }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: "#1B5E52", margin: "0 0 8px" }}>ご報告ありがとうございます！</p>
                <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.7 }}>
                  内容を確認し、必要に応じて記事を修正します。<br />
                  正確な情報をお届けするために、今後もお気づきの点があればぜひ教えてください。
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, margin: "0 0 16px" }}>
                  正確な情報をお届けするため、内容に気になる点があれば教えてください。いただいた報告は必ず確認します。
                </p>

                <p style={{ fontSize: 12, fontWeight: 700, color: "#888", margin: "0 0 8px" }}>どんな点が気になりましたか？</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onCategoryChange(c)}
                      style={{
                        fontSize: 12.5, fontWeight: 600, padding: "7px 14px", borderRadius: 20,
                        border: category === c ? "1.5px solid #0D686E" : "1.5px solid #D0E8E4",
                        background: category === c ? "#E8F5F1" : "#fff",
                        color: category === c ? "#0D686E" : "#555",
                        cursor: "pointer",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {!sent && (
            <form onSubmit={onSubmit} style={{ borderTop: "1px solid #E8F0EE", padding: 12, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
              <textarea
                value={body}
                onChange={(e) => onBodyChange(e.target.value)}
                placeholder="詳しく教えてください（任意）"
                maxLength={500}
                rows={3}
                style={{
                  width: "100%", borderRadius: 10, border: "1.5px solid #D0E8E4",
                  padding: "10px 12px", fontSize: 14, color: "#1a1a1a",
                  resize: "none", fontFamily: "inherit", boxSizing: "border-box",
                  outline: "none", background: "#F7FAF9",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#aaa" }}>{body.length} / 500</span>
                <button
                  type="submit"
                  disabled={posting || !category}
                  style={{
                    background: posting || !category ? "#ccc" : "#0D686E", color: "#fff", border: "none",
                    borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 700,
                    cursor: posting || !category ? "not-allowed" : "pointer",
                  }}
                >
                  {posting ? "送信中..." : "送信する"}
                </button>
              </div>
              {error && <p style={{ fontSize: 12, color: "#DC2626", margin: 0 }}>{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
