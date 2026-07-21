"use client";
import { useState, useRef, useEffect } from "react";

interface QAMessage {
  role: "user" | "assistant";
  text: string;
}

// 展開モーダルに切り替えるまで、カード内には直近何件表示するか
const INLINE_VISIBLE_MESSAGES = 2;

function Bubble({ msg }: { msg: QAMessage }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: isUser ? "flex-end" : "flex-start", gap: 8 }}>
      {!isUser && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/mascot/gori-base-face.png" alt="" width={28} height={28} style={{ width: 28, height: 28, flexShrink: 0, objectFit: "cover", borderRadius: "50%", background: "#fff" }} />
      )}
      <div style={{
        maxWidth: "78%",
        background: isUser ? "#0D686E" : "#F3F4F6",
        color: isUser ? "#fff" : "#1a1a1a",
        borderRadius: 14,
        borderBottomRightRadius: isUser ? 4 : 14,
        borderBottomLeftRadius: isUser ? 14 : 4,
        padding: "9px 13px",
        fontSize: 13.5,
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
      }}>
        {msg.text}
      </div>
    </div>
  );
}

function ChatInput({
  value, onChange, onSend, loading,
}: { value: string; onChange: (v: string) => void; onSend: () => void; loading: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="この記事について気になることを聞いてみよう"
        rows={1}
        maxLength={200}
        style={{
          flex: 1, resize: "none", border: "1.5px solid #E5E7EB", borderRadius: 12,
          padding: "9px 12px", fontSize: 13.5, lineHeight: 1.5, fontFamily: "inherit",
          maxHeight: 80, outline: "none",
        }}
      />
      <button
        onClick={onSend}
        disabled={loading || !value.trim()}
        style={{
          background: loading || !value.trim() ? "#C8DDD9" : "#0D686E", color: "#fff", border: "none",
          borderRadius: "50%", width: 36, height: 36, flexShrink: 0, cursor: loading || !value.trim() ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
      </button>
    </div>
  );
}

export default function AskGoriCard({
  docId, color, guestLocked,
}: { docId: string; color: string; guestLocked: boolean }) {
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const modalListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    modalListRef.current?.scrollTo({ top: modalListRef.current.scrollHeight });
  }, [messages, modalOpen]);

  async function send() {
    const question = input.trim();
    if (!question || loading) return;
    setError(null);
    setInput("");
    const nextMessages: QAMessage[] = [...messages, { role: "user", text: question }];
    setMessages(nextMessages);
    setLoading(true);
    // 2往復目以降は自動でモーダル表示に切り替える（カード内の狭い高さでは読みにくいため）
    if (messages.length >= INLINE_VISIBLE_MESSAGES) setModalOpen(true);

    try {
      const res = await fetch("/api/base/articles/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, question, history: messages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "回答の生成に失敗しました");
      setMessages([...nextMessages, { role: "assistant", text: data.answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "回答の生成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  const visibleMessages = messages.slice(-INLINE_VISIBLE_MESSAGES);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mascot/gori-base-face.png" alt="" width={38} height={38} style={{ flexShrink: 0, objectFit: "cover", borderRadius: "50%", background: "#fff" }} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", margin: "0 0 2px" }}>ゴリ編集長に質問する</p>
            <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>この記事の内容についてだけ答えます</p>
          </div>
        </div>

        <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
          <div ref={listRef} style={{ height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 2, ...(guestLocked ? { filter: "blur(6px)", userSelect: "none" as const, pointerEvents: "none" as const } : {}) }}>
            {visibleMessages.length === 0 && (
              <p style={{ fontSize: 12.5, color: "#aaa", lineHeight: 1.7, margin: 0 }}>
                「〇〇ってどういう意味？」「対象になる事業所は？」など、この記事の内容についてゴリ編集長に聞いてみましょう。
              </p>
            )}
            {visibleMessages.map((m, i) => <Bubble key={i} msg={m} />)}
            {loading && !modalOpen && (
              <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>ゴリ編集長が考え中...</p>
            )}
          </div>
          {guestLocked && (
            <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "rgba(255,255,255,0.4)" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <a href="/base/login" style={{ background: color, color: "#fff", borderRadius: 20, padding: "10px 24px", fontSize: 13, fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.2)" }}>
                ログインして質問する
              </a>
            </div>
          )}
        </div>

        {error && <p style={{ fontSize: 11.5, color: "#D14343", margin: "8px 0 0" }}>{error}</p>}

        {!guestLocked && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {messages.length > 0 && (
              <button onClick={() => setModalOpen(true)} style={{ alignSelf: "flex-end", background: "none", border: "none", color, fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                会話を大きく表示 ↗
              </button>
            )}
            <ChatInput value={input} onChange={setInput} onSend={send} loading={loading} />
          </div>
        )}
      </div>

      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#fff", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid #F0F0F0", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mascot/gori-base-face.png" alt="" width={34} height={34} style={{ flexShrink: 0, objectFit: "cover", borderRadius: "50%", background: "#fff" }} />
            <p style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", margin: 0, flex: 1 }}>ゴリ編集長に質問する</p>
            <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#888" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div ref={modalListRef} style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m, i) => <Bubble key={i} msg={m} />)}
            {loading && <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>ゴリ編集長が考え中...</p>}
          </div>
          {error && <p style={{ fontSize: 11.5, color: "#D14343", margin: "0 20px 8px" }}>{error}</p>}
          <div style={{ padding: "12px 20px 20px", borderTop: "1px solid #F0F0F0", flexShrink: 0 }}>
            <ChatInput value={input} onChange={setInput} onSend={send} loading={loading} />
          </div>
        </div>
      )}
    </>
  );
}
