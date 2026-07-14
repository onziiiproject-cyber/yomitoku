"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.href = "/admin";
    } else {
      const data = await res.json();
      setError(data.error ?? "ログインに失敗しました");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F5F7F6", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Hiragino Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 360, background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(13,104,110,0.08)", padding: "40px 36px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0D686E", marginBottom: 8 }}>管理画面</h1>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 28 }}>YOMITOKU 管理者専用</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 6 }}>管理者パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              style={{ width: "100%", height: 48, border: "1.5px solid #E5E5E5", borderRadius: 10, fontSize: 15, padding: "0 14px", boxSizing: "border-box", outline: "none" }}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: "#e05252", margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ height: 48, background: loading ? "#ccc" : "#0D686E", color: "#fff", border: "none", borderRadius: 100, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
