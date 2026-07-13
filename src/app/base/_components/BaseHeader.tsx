"use client";
import { useRouter, usePathname } from "next/navigation";

export default function BaseHeader({ companyName }: { companyName: string }) {
  const router = useRouter();
  const pathname = usePathname();

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
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", gap: 16 }}>
        {/* Logo */}
        <a href="/base" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, background: "#1B5E52", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Y</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1B5E52", lineHeight: 1 }}>ヨミトク BASE</div>
            <div style={{ fontSize: 10, color: "#6B9E96", lineHeight: 1, marginTop: 2 }}>介護保険情報の知識基地</div>
          </div>
        </a>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
          <a
            href="/base/favorites"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
              fontWeight: 600,
              color: pathname === "/base/favorites" ? "#1B5E52" : "#6B9E96",
              textDecoration: "none",
              padding: "5px 10px",
              borderRadius: 8,
              background: pathname === "/base/favorites" ? "#E8F5F1" : "transparent",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={pathname === "/base/favorites" ? "#1B5E52" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
            お気に入り
          </a>
        </nav>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <a href="/base/settings" style={{ fontSize: 12, color: "#6B9E96", textDecoration: "none", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
