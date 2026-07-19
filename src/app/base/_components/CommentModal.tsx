"use client";
import { useEffect, useRef } from "react";
import ArticleContextCard, { type ArticleContext } from "./ArticleContextCard";

interface Comment {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
}

function Avatar({ name }: { name: string }) {
  return (
    <div style={{
      width: 38, height: 38, borderRadius: "50%",
      background: "linear-gradient(135deg, #0D686E, #1B9C8E)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, fontWeight: 800, fontSize: 15, color: "#fff",
    }}>
      {name?.[0] ?? "?"}
    </div>
  );
}

function relativeTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  return new Date(d).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

export default function CommentModal({
  open,
  onClose,
  article,
  comments,
  isLoggedIn,
  body,
  onBodyChange,
  onSubmit,
  posting,
  error,
  onCommentLike,
}: {
  open: boolean;
  onClose: () => void;
  article: ArticleContext;
  comments: Comment[];
  isLoggedIn: boolean;
  body: string;
  onBodyChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  posting: boolean;
  error: string;
  onCommentLike: (commentId: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open || !isLoggedIn) return;
    const t = setTimeout(() => textareaRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open, isLoggedIn]);

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
        {/* 左: どの記事へのコメントか分かるカード */}
        <div style={{ flex: "1 1 240px", maxWidth: 280, padding: 16, borderRight: "1px solid #E8F0EE", overflowY: "auto" }}>
          <ArticleContextCard article={article} />
        </div>

        {/* 右: コメント本体 */}
        <div style={{ flex: "2 1 320px", display: "flex", flexDirection: "column", minWidth: 0, maxHeight: "84vh" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #E8F0EE", flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>
              コメント{comments.length > 0 ? `（${comments.length}）` : ""}
            </span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#888", display: "flex" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
            {comments.length === 0 ? (
              <p style={{ fontSize: 13, color: "#bbb", textAlign: "center", padding: "24px 0" }}>
                最初のコメントを書いてみましょう
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ display: "flex", gap: 12 }}>
                    <Avatar name={c.authorName} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{c.authorName}</span>
                        <span style={{ fontSize: 11, color: "#aaa" }}>{relativeTime(c.createdAt)}</span>
                      </div>
                      <p style={{ fontSize: 14, color: "#333", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: 8 }}>{c.body}</p>
                      <button
                        onClick={() => onCommentLike(c.id)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          background: "transparent", border: "none", padding: "2px 0",
                          fontSize: 12, color: c.likedByMe ? "#E53E3E" : "#aaa",
                          cursor: "pointer", fontWeight: c.likedByMe ? 700 : 400,
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill={c.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        {c.likeCount > 0 ? `${c.likeCount}` : "いいね"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isLoggedIn && (
            <form onSubmit={onSubmit} style={{ borderTop: "1px solid #E8F0EE", padding: 12, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => onBodyChange(e.target.value)}
                placeholder="コメントを追加..."
                maxLength={500}
                rows={2}
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
                  disabled={posting || !body.trim()}
                  style={{
                    background: posting || !body.trim() ? "#ccc" : "#0D686E", color: "#fff", border: "none",
                    borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 700,
                    cursor: posting || !body.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {posting ? "送信中..." : "投稿する"}
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
