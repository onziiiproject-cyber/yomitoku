export default function GuestHeader() {
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
        <a href="/base" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, background: "#1B5E52", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Y</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1B5E52", lineHeight: 1 }}>ヨミトク BASE</div>
            <div style={{ fontSize: 10, color: "#6B9E96", lineHeight: 1, marginTop: 2 }}>介護保険情報の知識基地</div>
          </div>
        </a>
        <a
          href="/base/login"
          style={{
            background: "#1B5E52",
            color: "#fff",
            padding: "7px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          ログイン
        </a>
      </div>
    </header>
  );
}
