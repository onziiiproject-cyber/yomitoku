"use client";
import { useState, useRef } from "react";

interface Comment {
  id: string;
  body: string;
  companyName: string;
  createdAt: string;
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

export default function LikeCommentSection({
  docId,
  initialRead, initialReadCount,
  initialLiked, initialLikeCount,
  initialFavorited,
  initialComments,
  isLoggedIn,
}: {
  docId: string;
  initialRead: boolean; initialReadCount: number;
  initialLiked: boolean; initialLikeCount: number;
  initialFavorited: boolean;
  initialComments: Comment[];
  isLoggedIn: boolean;
}) {
  const [read, setRead] = useState(initialRead);
  const [readCount, setReadCount] = useState(initialReadCount);
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function requireLogin() { window.location.href = "/base/login"; }

  async function toggle(endpoint: string, docId: string) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId }),
    });
    return res.json();
  }

  async function handleRead() {
    if (!isLoggedIn) { requireLogin(); return; }
    const data = await toggle("/api/base/reads", docId);
    setRead(data.read); setReadCount(data.count);
  }

  async function handleLike() {
    if (!isLoggedIn) { requireLogin(); return; }
    const data = await toggle("/api/base/likes", docId);
    setLiked(data.liked); setLikeCount(data.count);
  }

  async function handleFavorite() {
    if (!isLoggedIn) { requireLogin(); return; }
    const data = await toggle("/api/base/favorites", docId);
    setFavorited(data.favorited);
  }

  function handleCommentBtn() {
    if (!isLoggedIn) { requireLogin(); return; }
    setShowCommentInput((v) => !v);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true); setError("");
    const res = await fetch("/api/base/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId, body }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "エラーが発生しました"); }
    else { setComments((prev) => [data, ...prev]); setBody(""); setShowCommentInput(false); }
    setPosting(false);
  }

  const actionBtn = (
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    count: number | null,
    active: boolean,
    activeColor: string,
  ) => (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: active ? `${activeColor}18` : "transparent",
        border: `1.5px solid ${active ? activeColor : "#E2EDEB"}`,
        borderRadius: 20, padding: "7px 14px",
        fontSize: 13, fontWeight: active ? 700 : 500,
        color: active ? activeColor : "#666",
        cursor: "pointer", transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      <span>{label}</span>
      {count !== null && count > 0 && (
        <span style={{
          background: active ? activeColor : "#E5E7EB",
          color: active ? "#fff" : "#666",
          borderRadius: 10, padding: "0 6px", fontSize: 11, fontWeight: 700,
        }}>{count}</span>
      )}
    </button>
  );

  return (
    <div style={{ marginTop: 28 }}>
      {/* Action bar */}
      <div style={{
        display: "flex", gap: 8, flexWrap: "wrap",
        paddingBottom: 16, borderBottom: "1px solid #E8F0EE",
        marginBottom: 20,
      }}>
        {actionBtn(handleRead,
          <svg width="15" height="15" viewBox="0 0 24 24" fill={read ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
          "読んだ！", readCount, read, "#0D686E"
        )}
        {actionBtn(handleLike,
          <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
          "いいね", likeCount, liked, "#E53E3E"
        )}
        {actionBtn(handleCommentBtn,
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
          "コメント", comments.length, showCommentInput, "#6366F1"
        )}
        {actionBtn(handleFavorite,
          <svg width="15" height="15" viewBox="0 0 24 24" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
          "保存", null, favorited, "#D97706"
        )}
      </div>

      {/* Comment input */}
      {showCommentInput && isLoggedIn && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="コメントを追加..."
            maxLength={500}
            rows={3}
            style={{
              width: "100%", borderRadius: 12,
              border: "1.5px solid #0D686E",
              padding: "12px 14px", fontSize: 14, color: "#1a1a1a",
              resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
              outline: "none", background: "#F7FAF9",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: "#aaa" }}>{body.length} / 500</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setShowCommentInput(false)}
                style={{ background: "transparent", border: "1.5px solid #D1D5DB", borderRadius: 8, padding: "7px 14px", fontSize: 13, color: "#666", cursor: "pointer" }}>
                キャンセル
              </button>
              <button type="submit" disabled={posting || !body.trim()}
                style={{ background: posting || !body.trim() ? "#ccc" : "#0D686E", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 700, cursor: posting || !body.trim() ? "not-allowed" : "pointer" }}>
                {posting ? "送信中..." : "投稿する"}
              </button>
            </div>
          </div>
          {error && <p style={{ fontSize: 13, color: "#DC2626", marginTop: 6 }}>{error}</p>}
        </form>
      )}

      {/* Comments feed */}
      {comments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {comments.map((c) => (
            <div key={c.id} style={{ display: "flex", gap: 12 }}>
              <Avatar name={c.companyName} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{c.companyName}</span>
                  <span style={{ fontSize: 11, color: "#aaa" }}>{relativeTime(c.createdAt)}</span>
                </div>
                <p style={{ fontSize: 14, color: "#333", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {comments.length === 0 && !showCommentInput && (
        <p style={{ fontSize: 13, color: "#bbb", textAlign: "center", padding: "12px 0" }}>
          最初のコメントを書いてみましょう
        </p>
      )}
    </div>
  );
}
