"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminHeader() {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      style={{
        color: "#fff",
        fontSize: 13,
        fontWeight: pathname === href ? 700 : 500,
        opacity: pathname === href ? 1 : 0.75,
        textDecoration: "none",
        borderBottom: pathname === href ? "2px solid #fff" : "2px solid transparent",
        paddingBottom: 2,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </Link>
  );

  return (
    <header className="admin-header">
      <style>{`
        .admin-header {
          background: #0D686E;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }
        .admin-header__left {
          display: flex;
          align-items: center;
          gap: 20px;
          min-width: 0;
        }
        .admin-header__nav {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
        }
        @media (min-width: 700px) {
          .admin-header { padding: 0 32px; height: 56px; flex-wrap: nowrap; }
          .admin-header__left { gap: 28px; }
          .admin-header__nav { gap: 20px; }
        }
      `}</style>
      <div className="admin-header__left">
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>YOMITOKU 管理画面</span>
        <nav className="admin-header__nav">
          {navLink("/admin", "登録企業一覧")}
          {navLink("/admin/reports", "報告一覧")}
          {navLink("/admin/referrals", "紹介実績")}
          {navLink("/admin/ads", "広告管理")}
        </nav>
      </div>
      <button
        onClick={handleLogout}
        style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, color: "#fff", fontSize: 13, padding: "6px 14px", cursor: "pointer", flexShrink: 0 }}
      >
        ログアウト
      </button>
    </header>
  );
}
