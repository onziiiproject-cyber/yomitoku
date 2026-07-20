"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MobileSearchBar({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/base?q=${encodeURIComponent(q.trim())}` : "/base");
  }

  return (
    <form onSubmit={handleSearch} className="mobile-search-bar" style={{ position: "relative", marginBottom: 16 }}>
      <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9BB5B0", display: "flex", pointerEvents: "none" }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </span>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="何をお探しですか？"
        style={{
          width: "100%",
          height: 44,
          paddingLeft: 38,
          paddingRight: 72,
          border: "1.5px solid #D0E8E4",
          borderRadius: 10,
          fontSize: 14,
          color: "#1a1a1a",
          outline: "none",
          boxSizing: "border-box",
          background: "#F7FAF9",
          fontFamily: "sans-serif",
        }}
      />
      <button type="submit" style={{
        position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)",
        background: "#0D686E", color: "#fff", border: "none",
        borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
      }}>
        検索
      </button>
    </form>
  );
}
