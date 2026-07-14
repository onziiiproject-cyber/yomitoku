"use client";
import { usePathname, useSearchParams } from "next/navigation";

function isAuthPage(pathname: string) {
  return (
    pathname.startsWith("/base/login") ||
    pathname.startsWith("/base/forgot-password") ||
    pathname.startsWith("/base/reset-password")
  );
}

const NAV_ITEMS = [
  {
    key: "home",
    label: "ホーム",
    href: "/base",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#0D686E" : "none"}
        stroke={active ? "#0D686E" : "#888"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    key: "search",
    label: "検索",
    href: "/base?q=",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={active ? "#0D686E" : "#888"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    key: "mhlw",
    label: "最新情報",
    href: "/base?cat=mhlw_latest",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={active ? "#0D686E" : "#888"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    key: "favorites",
    label: "保存済み",
    href: "/base/favorites",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#0D686E" : "none"}
        stroke={active ? "#0D686E" : "#888"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
      </svg>
    ),
  },
  {
    key: "settings",
    label: "設定",
    href: "/base/settings",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={active ? "#0D686E" : "#888"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

export default function LayoutShell({
  children,
  leftSidebar,
  rightSidebar,
}: {
  children: React.ReactNode;
  leftSidebar: React.ReactNode;
  rightSidebar: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cat = searchParams.get("cat") ?? "";

  if (isAuthPage(pathname)) {
    return (
      <main style={{ flex: 1, minWidth: 0, padding: "24px 20px" }}>
        {children}
      </main>
    );
  }

  return (
    <>
      <div style={{ display: "flex" }}>
        {/* 左サイドバー: スマホで非表示 */}
        <div className="base-sidebar-left">
          {leftSidebar}
        </div>

        <main className="base-main-content" style={{ flex: 1, minWidth: 0, padding: "24px 20px", overflowX: "hidden" }}>
          {children}
        </main>

        {/* 右サイドバー: スマホで非表示 */}
        <div className="base-sidebar-right">
          {rightSidebar}
        </div>
      </div>

      {/* ボトムナビ: スマホのみ */}
      <nav className="base-bottom-nav">
        {NAV_ITEMS.map(item => {
          const isHome = item.key === "home" && pathname === "/base" && !searchParams.get("q") && !cat;
          const isCat = item.href.includes("cat=") && cat === item.href.split("cat=")[1];
          const isFav = item.key === "favorites" && pathname === "/base/favorites";
          const isSettings = item.key === "settings" && pathname === "/base/settings";
          const isSearch = item.key === "search" && !!searchParams.get("q");
          const active = isHome || isCat || isFav || isSettings || isSearch;

          return (
            <a
              key={item.key}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "6px 12px",
                textDecoration: "none",
                flex: 1,
              }}
            >
              {item.icon(active)}
              <span style={{ fontSize: 10, color: active ? "#0D686E" : "#888", fontWeight: active ? 700 : 400 }}>
                {item.label}
              </span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
