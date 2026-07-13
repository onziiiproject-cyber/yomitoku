"use client";
import { usePathname, useSearchParams } from "next/navigation";

const CATEGORIES = [
  {
    key: "mhlw_latest", label: "介護保険最新情報",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    color: "#0D686E", badge: "NEW",
  },
  {
    key: "shingi", label: "分科会解説",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
    color: "#D97706",
  },
  {
    key: "qa", label: "Q&A（よくある質問）",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    color: "#2563EB",
  },
  {
    key: "guideline", label: "ガイドライン・通知",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
    color: "#7C3AED",
  },
  {
    key: "subsidy", label: "補助金・助成金情報",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    color: "#DC2626",
  },
  {
    key: "breaking", label: "速報・重要情報",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    color: "#EA580C",
  },
];

export default function LeftSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCat = searchParams.get("cat") ?? "";
  const isHome = pathname === "/base" && !searchParams.get("q") && !currentCat;

  function navLink(href: string, label: string, icon: React.ReactNode, color: string, isActive: boolean, badge?: string) {
    return (
      <a
        key={href}
        href={href}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 12px",
          borderRadius: 8,
          textDecoration: "none",
          background: isActive ? "#E8F5F1" : "transparent",
          color: isActive ? "#0D686E" : "#444",
          fontWeight: isActive ? 700 : 500,
          fontSize: 13,
          transition: "background 0.1s",
        }}
      >
        <span style={{ color: isActive ? "#0D686E" : color, display: "flex", flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, lineHeight: 1.3 }}>{label}</span>
        {badge && (
          <span style={{ background: "#EF4444", color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 3, flexShrink: 0 }}>
            {badge}
          </span>
        )}
      </a>
    );
  }

  return (
    <aside style={{
      width: 210,
      flexShrink: 0,
      background: "#fff",
      borderRight: "1px solid #E2EDEB",
      padding: "16px 10px 24px",
      position: "sticky",
      top: 64,
      height: "calc(100vh - 64px)",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      {/* ホーム */}
      {navLink(
        "/base", "ホーム",
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>,
        "#0D686E",
        isHome
      )}

      {/* 情報を探す */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9BB5B0", letterSpacing: "0.1em", padding: "12px 12px 4px", textTransform: "uppercase" }}>
        情報を探す
      </div>

      {CATEGORIES.map(c =>
        navLink(
          `/base?cat=${c.key}`,
          c.label,
          c.icon,
          c.color,
          currentCat === c.key,
          c.badge
        )
      )}

      {/* 便利な機能 */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9BB5B0", letterSpacing: "0.1em", padding: "12px 12px 4px", textTransform: "uppercase" }}>
        便利な機能
      </div>

      {navLink(
        "/base/favorites", "お気に入り",
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
        </svg>,
        "#F59E0B",
        pathname === "/base/favorites"
      )}

      {navLink(
        "/base?cat=all", "タグから探す",
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>,
        "#6366F1",
        false
      )}

      {/* Stubs */}
      <div style={{ padding: "9px 12px", display: "flex", alignItems: "center", gap: 10, color: "#C0D4D0", fontSize: 13 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>最近見た記事</span>
        <span style={{ fontSize: 10, background: "#F0F4F3", color: "#9BB5B0", padding: "1px 6px", borderRadius: 4, marginLeft: "auto" }}>準備中</span>
      </div>

      <div style={{ padding: "9px 12px", display: "flex", alignItems: "center", gap: 10, color: "#C0D4D0", fontSize: 13 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <span>あとで読む</span>
        <span style={{ fontSize: 10, background: "#F0F4F3", color: "#9BB5B0", padding: "1px 6px", borderRadius: 4, marginLeft: "auto" }}>準備中</span>
      </div>

      {/* AI Chat stub */}
      <div style={{ marginTop: "auto", paddingTop: 16 }}>
        <div style={{
          background: "linear-gradient(135deg, #0D686E 0%, #1B9C8E 100%)",
          borderRadius: 12,
          padding: "14px 14px",
          color: "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 28, height: 28, background: "rgba(255,255,255,0.2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700 }}>AIに質問してみる</span>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.5 }}>
            介護保険に関する疑問をAIがわかりやすく回答
          </p>
          <div style={{ marginTop: 10, background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "5px 10px", fontSize: 11, textAlign: "center", color: "rgba(255,255,255,0.9)" }}>
            β版 準備中
          </div>
        </div>
      </div>
    </aside>
  );
}
