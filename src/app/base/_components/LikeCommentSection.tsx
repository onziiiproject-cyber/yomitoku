"use client";
import { useState } from "react";

interface Comment {
  id: string;
  body: string;
  companyName: string;
  createdAt: string;
}

export default function LikeCommentSection({
  docId,
  initialLiked,
  initialLikeCount,
  initialComments,
  isLoggedIn,
}: {
  docId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  initialComments: Comment[];
  isLoggedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [likeLoading, setLikeLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  async function handleLike() {
    if (!isLoggedIn) { window.location.href = "/base/login"; return; }
    setLikeLoading(true);
    const res = await fetch("/api/base/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId }),
    });
    const data = await res.json();
    setLiked(data.liked);
    setLikeCount(data.count);
    setLikeLoading(false);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    setError("");
    const res = await fetch("/api/base/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId, body }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "エラーが発生しました");
    } else {
      setComments((prev) => [data, ...prev]);
      setBody("");
    }
    setPosting(false);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div style={{ marginTop: 24 }}>
      {/* Like button */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={handleLike}
          disabled={likeLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: liked ? "#E6F4F2" : "#fff",
            border: `1.5px solid ${liked ? "#0D686E" : "#D1D5DB"}`,
            borderRadius: 20,
            padding: "7px 16px",
            fontSize: 14,
            fontWeight: 700,
            color: liked ? "#0D686E" : "#555",
            cursor: likeLoading ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: 16 }}>{liked ? "👍" : "👍"}</span>
          <span>{liked ? "いいね済み" : "いいね"}</span>
          {likeCount > 0 && (
            <span style={{
              background: liked ? "#0D686E" : "#E5E7EB",
              color: liked ? "#fff" : "#555",
              borderRadius: 10,
              padding: "1px 7px",
              fontSize: 12,
            }}>
              {likeCount}
            </span>
          )}
        </button>
        {!isLoggedIn && (
          <span style={{ fontSize: 12, color: "#aaa" }}>ログインするといいね・コメントできます</span>
        )}
      </div>

      {/* Comments */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <div style={{ width: 4, height: 18, background: "#6B9E96", borderRadius: 2 }} />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#444", margin: 0 }}>
            コメント {comments.length > 0 && <span style={{ color: "#888", fontWeight: 400, fontSize: 13 }}>({comments.length})</span>}
          </h2>
        </div>

        {/* Comment form */}
        {isLoggedIn && (
          <form onSubmit={handleComment} style={{ marginBottom: 20 }}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="この記事へのコメントや感想を書いてください（500文字以内）"
              maxLength={500}
              rows={3}
              style={{
                width: "100%",
                borderRadius: 10,
                border: "1.5px solid #D1E8E4",
                padding: "12px 14px",
                fontSize: 14,
                color: "#1a1a1a",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: 12, color: "#aaa" }}>{body.length} / 500</span>
              <button
                type="submit"
                disabled={posting || !body.trim()}
                style={{
                  background: posting || !body.trim() ? "#ccc" : "#0D686E",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 20px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: posting || !body.trim() ? "not-allowed" : "pointer",
                }}
              >
                {posting ? "送信中..." : "コメントする"}
              </button>
            </div>
            {error && <p style={{ fontSize: 13, color: "#DC2626", marginTop: 6 }}>{error}</p>}
          </form>
        )}

        {/* Comment list */}
        {comments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#aaa", fontSize: 14 }}>
            まだコメントはありません
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {comments.map((c) => (
              <div
                key={c.id}
                style={{
                  background: "#F7FAF9",
                  borderRadius: 10,
                  padding: "12px 16px",
                  border: "1px solid #E8F0EE",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0D686E" }}>{c.companyName}</span>
                  <span style={{ fontSize: 11, color: "#aaa" }}>{formatDate(c.createdAt)}</span>
                </div>
                <p style={{ fontSize: 14, color: "#333", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{c.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
