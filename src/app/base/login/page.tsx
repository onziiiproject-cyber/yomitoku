"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "ログインに失敗しました");
      setLoading(false);
      return;
    }
    router.push("/base");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7FAF9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "#1B5E52", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>Y</span>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1B5E52", lineHeight: 1 }}>ヨミトク BASE</div>
              <div style={{ fontSize: 11, color: "#6B9E96", marginTop: 2 }}>介護保険情報の知識基地</div>
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: "32px 28px", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 24, textAlign: "center" }}>ログイン</h1>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6 }}>メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="info@example.com"
                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #D1E8E4", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box", color: "#1a1a1a" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6 }}>パスワード</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #D1E8E4", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box", color: "#1a1a1a" }}
              />
            </div>

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ background: loading ? "#9CA3AF" : "#1B5E52", color: "#fff", border: "none", borderRadius: 8, padding: "13px", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: 8 }}
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#888" }}>
            まだ登録していない方は{" "}
            <a href="/register" style={{ color: "#1B7A6D", textDecoration: "underline" }}>こちら</a>
          </p>
        </div>
      </div>
    </div>
  );
}
