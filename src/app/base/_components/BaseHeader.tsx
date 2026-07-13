"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BaseHeader({ companyName }: { companyName: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/base?q=${encodeURIComponent(q.trim())}` : "/base");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/base/login");
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
        {/* Logo */}
        <a href="/base" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0, width: 200 }}>
          <div style={{ width: 34, height: 34, background: "#0D686E", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 17, fontFamily: "sans-serif" }}>Y</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0D686E", lineHeight: 1 }}>ヨミトク BASE</div>
            <div style={{ fontSize: 10, color: "#7AADA6", lineHeight: 1, marginTop: 3 }}>介護保険情報の知識基地</div>
          </div>
        </a>

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

        {/* Right icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0, marginLeft: "auto" }}>
          <a href="/base/favorites" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textDecoration: "none", color: "#7AADA6" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
            <span style={{ fontSize: 10, fontFamily: "sans-serif" }}>お気に入り</span>
          </a>

          <div style={{ width: 1, height: 28, background: "#E2EDEB" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#E8F5F1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D686E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <a href="/base/settings" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1a1a1a", textDecoration: "none", lineHeight: 1.3, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {companyName}
              </a>
              <button onClick={logout} style={{ display: "block", fontSize: 11, color: "#9BB5B0", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1.4, textAlign: "left" }}>
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
