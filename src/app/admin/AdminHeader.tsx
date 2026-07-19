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
      }}
    >
      {label}
    </Link>
  );

  return (
    <header style={{ background: "#0D686E", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: "0.05em" }}>YOMITOKU 管理画面</span>
        <nav style={{ display: "flex", gap: 20 }}>
          {navLink("/admin", "登録企業一覧")}
          {navLink("/admin/reports", "報告一覧")}
        </nav>
      </div>
      <button
        onClick={handleLogout}
        style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, color: "#fff", fontSize: 13, padding: "6px 14px", cursor: "pointer" }}
      >
        ログアウト
      </button>
    </header>
  );
}
