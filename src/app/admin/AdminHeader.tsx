"use client";

export default function AdminHeader() {
  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <header style={{ background: "#0D686E", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: "0.05em" }}>YOMITOKU 管理画面</span>
      <button
        onClick={handleLogout}
        style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, color: "#fff", fontSize: 13, padding: "6px 14px", cursor: "pointer" }}
      >
        ログアウト
      </button>
    </header>
  );
}
