"use client";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const COLLAPSED = 72;
const EXPANDED = 232;

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

const ICON_HOME = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const ICON_TAG = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const ICON_DOC = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const ICON_SHINGI = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
  </svg>
);
const ICON_BOOKMARK = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
  </svg>
);
const ICON_HISTORY = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const ICON_USER = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const ICON_SETTINGS = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

export default function LeftSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCat = searchParams.get("cat") ?? "";
  const isHome = pathname === "/base" && !searchParams.get("q") && !currentCat;
  const [hovered, setHovered] = useState(false);

  const items: NavItem[] = [
    { key: "home", label: "ホーム", href: "/base", icon: ICON_HOME },
    { key: "tags", label: "タグから探す", href: "/base/tags", icon: ICON_TAG },
    { key: "mhlw", label: "介護保険最新情報", href: "/base?cat=mhlw_latest", icon: ICON_DOC },
    { key: "shingi", label: "分科会かんたん解説", href: "/base?cat=shingi", icon: ICON_SHINGI },
    { key: "favorites", label: "保存した記事", href: "/base/favorites", icon: ICON_BOOKMARK },
    { key: "recent", label: "最近見た記事", href: "#", icon: ICON_HISTORY, badge: "準備中", disabled: true },
    { key: "profile", label: "プロフィール", href: "/base/profile", icon: ICON_USER },
    { key: "settings", label: "設定", href: "/base/settings", icon: ICON_SETTINGS },
  ];

  function isActive(item: NavItem) {
    if (item.key === "home") return isHome;
    if (item.key === "mhlw") return currentCat === "mhlw_latest";
    if (item.key === "shingi") return currentCat === "shingi";
    if (item.key === "tags") return pathname === "/base/tags";
    if (item.key === "favorites") return pathname === "/base/favorites";
    if (item.key === "profile") return pathname === "/base/profile";
    if (item.key === "settings") return pathname === "/base/settings";
    return false;
  }

  return (
    <aside
      style={{ width: COLLAPSED, flexShrink: 0, position: "sticky", top: 64, height: "calc(100vh - 64px)", zIndex: 200 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <nav
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: hovered ? EXPANDED : COLLAPSED,
          height: "100%",
          background: "#fff",
          borderRight: "1px solid #E2EDEB",
          boxShadow: hovered ? "6px 0 28px rgba(0,0,0,0.12)" : "none",
          transition: "width 0.18s ease, box-shadow 0.18s ease",
          overflow: "hidden",
          zIndex: 150,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          padding: "16px 0",
        }}
      >
        {items.map((item) => {
          const active = isActive(item);
          const content = (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "11px 0 11px 24px",
                color: item.disabled ? "#C0D4D0" : active ? "#0D686E" : "#444",
                fontWeight: active ? 700 : 500,
              }}
            >
              <span style={{ display: "flex", flexShrink: 0 }}>{item.icon}</span>
              <span
                style={{
                  marginLeft: 16,
                  fontSize: 14,
                  whiteSpace: "nowrap",
                  opacity: hovered ? 1 : 0,
                  transition: "opacity 0.12s ease",
                  lineHeight: 1.3,
                }}
              >
                {item.label}
              </span>
              {item.badge && (
                <span
                  style={{
                    marginLeft: 10,
                    fontSize: 9,
                    background: "#F0F4F3",
                    color: "#9BB5B0",
                    padding: "1px 6px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                    opacity: hovered ? 1 : 0,
                    transition: "opacity 0.12s ease",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
          );

          if (item.disabled) {
            return <div key={item.key}>{content}</div>;
          }

          return (
            <a
              key={item.key}
              href={item.href}
              style={{
                textDecoration: "none",
                background: active ? "#E8F5F1" : "transparent",
              }}
            >
              {content}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
