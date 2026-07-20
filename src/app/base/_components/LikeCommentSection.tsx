"use client";
import { useState } from "react";
import CommentModal from "./CommentModal";
import ReportModal from "./ReportModal";
import type { ArticleContext } from "./ArticleContextCard";

interface Comment {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  isEditorComment?: boolean;
  authorIconKey?: string | null;
  authorIconUrl?: string | null;
}

export default function LikeCommentSection({
  docId,
  article,
  initialRead, initialReadCount,
  initialLiked, initialLikeCount,
  initialFavorited,
  initialComments,
  isLoggedIn,
}: {
  docId: string;
  article: ArticleContext;
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
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState("");
  const [reportBody, setReportBody] = useState("");
  const [reportPosting, setReportPosting] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSent, setReportSent] = useState(false);

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
    setCommentModalOpen(true);
  }

  function handleReportBtn() {
    if (!isLoggedIn) { requireLogin(); return; }
    setReportModalOpen(true);
  }

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reportCategory) return;
    setReportPosting(true); setReportError("");
    const res = await fetch("/api/base/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId, category: reportCategory, body: reportBody }),
    });
    const data = await res.json();
    if (!res.ok) { setReportError(data.error ?? "エラーが発生しました"); }
    else { setReportSent(true); }
    setReportPosting(false);
  }

  function closeReportModal() {
    setReportModalOpen(false);
    // 少し待ってからリセット（閉じるアニメーション中に文言が変わらないように）
    setTimeout(() => {
      setReportSent(false);
      setReportCategory("");
      setReportBody("");
      setReportError("");
    }, 200);
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
    else {
      setComments((prev) => [{ id: data.id, body: data.body, authorName: data.authorName, authorIconKey: data.authorIconKey, authorIconUrl: data.authorIconUrl, createdAt: data.createdAt, likeCount: 0, likedByMe: false }, ...prev]);
      setBody("");
    }
    setPosting(false);
  }

  async function handleCommentLike(commentId: string) {
    if (!isLoggedIn) { requireLogin(); return; }
    const res = await fetch("/api/base/comment-likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    const data = await res.json();
    setComments((prev) => prev.map((c) =>
      c.id === commentId ? { ...c, likedByMe: data.liked, likeCount: data.count } : c
    ));
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
        display: "flex", alignItems: "center", gap: 5,
        background: "transparent",
        border: "none", padding: "4px 2px",
        fontSize: 13, fontWeight: active ? 700 : 500,
        color: active ? activeColor : "#666",
        cursor: "pointer", transition: "color 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      <span>{label}</span>
      {count !== null && (
        <span style={{
          color: active ? activeColor : "#999",
          fontSize: 12, fontWeight: 700,
        }}>{count}</span>
      )}
    </button>
  );

  return (
    <div>
      {/* Action bar */}
      <div style={{
        display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center",
        paddingBottom: 12, borderBottom: "1px solid #E8F0EE",
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
          "コメント", comments.length, commentModalOpen, "#6366F1"
        )}
        {actionBtn(handleFavorite,
          <svg width="15" height="15" viewBox="0 0 24 24" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
          "保存", null, favorited, "#D97706"
        )}
        {actionBtn(handleReportBtn,
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
          "報告", null, reportModalOpen, "#888888"
        )}
      </div>

      <CommentModal
        open={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        article={article}
        comments={comments}
        isLoggedIn={isLoggedIn}
        body={body}
        onBodyChange={setBody}
        onSubmit={handleSubmit}
        posting={posting}
        error={error}
        onCommentLike={handleCommentLike}
      />

      <ReportModal
        open={reportModalOpen}
        onClose={closeReportModal}
        article={article}
        category={reportCategory}
        onCategoryChange={setReportCategory}
        body={reportBody}
        onBodyChange={setReportBody}
        onSubmit={handleReportSubmit}
        posting={reportPosting}
        error={reportError}
        sent={reportSent}
      />
    </div>
  );
}
