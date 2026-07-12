"use client";
import { useRouter } from "next/navigation";

export default function BaseHeader({ companyName }: { companyName: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/base/login");
  }

  return (
    <header style={{
      background: "#fff",
      borderBottom: "1px solid #E8F0EE",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <a href="/base" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, background: "#1B5E52", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Y</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1B5E52", lineHeight: 1 }}>ヨミトク BASE</div>
            <div style={{ fontSize: 10, color: "#6B9E96", lineHeight: 1, marginTop: 2 }}>介護保険情報の知識基地</div>
          </div>
        </a>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/base/settings" style={{ fontSize: 12, color: "#6B9E96", textDecoration: "none" }}>
            {companyName}
          </a>
          <button
            onClick={logout}
            style={{ fontSize: 12, color: "#888", background: "none", border: "1px solid #D1E8E4", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
