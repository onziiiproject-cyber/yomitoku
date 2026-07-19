"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import HeaderLogo from "./HeaderLogo";

export default function GuestHeader() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/base?q=${encodeURIComponent(q.trim())}` : "/base");
  }

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "#fff",
      borderBottom: "1px solid #E2EDEB",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      height: 64,
    }}>
      <div style={{ height: "100%", display: "flex", alignItems: "center", gap: 16, padding: "0 20px" }}>
        <HeaderLogo />

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ flex: 1, position: "relative", maxWidth: 680 }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9BB5B0", display: "flex", pointerEvents: "none" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="何をお探しですか？　例：処遇改善　加算　運営指導　デイサービス"
            style={{
              width: "100%",
              height: 42,
              paddingLeft: 38,
              paddingRight: 72,
              border: "1.5px solid #D0E8E4",
              borderRadius: 10,
              fontSize: 13.5,
              color: "#1a1a1a",
              outline: "none",
              boxSizing: "border-box",
              background: "#F7FAF9",
              fontFamily: "sans-serif",
            }}
            onFocus={e => { e.target.style.borderColor = "#0D686E"; e.target.style.background = "#fff"; }}
            onBlur={e => { e.target.style.borderColor = "#D0E8E4"; e.target.style.background = "#F7FAF9"; }}
          />
          <button type="submit" style={{
            position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)",
            background: "#0D686E", color: "#fff", border: "none",
            borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            検索
          </button>
        </form>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0, marginLeft: "auto" }}>
          <a
            href="/base/login"
            style={{
              background: "#1B5E52",
              color: "#fff",
              padding: "9px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ログイン
          </a>
        </div>
      </div>
    </header>
  );
}
