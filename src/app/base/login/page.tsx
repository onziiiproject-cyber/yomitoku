"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const font = '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const resetSuccess = searchParams?.get("reset") === "1";
  const lineError = searchParams?.get("line_error") ?? null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTwoCol] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, rememberMe }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "ログインに失敗しました");
      setLoading(false);
      return;
    }
    router.push(data.needsProfileSelect ? "/base/whoami" : "/base");
  }

  const features = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D686E" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      title: "最新情報を受け取る",
      desc: "介護保険の最新ニュースを\nLINEでお知らせ",
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D686E" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      ),
      title: "探して見つかる",
      desc: "必要な情報を\nすぐに見つけられる",
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D686E" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
      ),
      title: "保存して整理",
      desc: "気になる情報を保存して\nあとで確認できる",
    },
  ];

  const inputBase: React.CSSProperties = {
    width: "100%",
    height: "64px",
    border: "1.5px solid #E5E5E5",
    borderRadius: "12px",
    fontSize: "16px",
    color: "#333",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: font,
    paddingRight: "18px",
    background: "white",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#F8FCFC", fontFamily: font }}>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "32px 48px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="login-main-grid" style={{
            display: "grid",
            gridTemplateColumns: "1.15fr minmax(380px, 1fr)",
            gap: "48px",
            alignItems: "center",
          }}>

            {/* ── Left ── */}
            <div className="login-left-panel">

              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "36px" }}>
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>

                  {/* Logo block */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
                    <Image
                      src="/icons/icon-gori-editor.jpg"
                      alt=""
                      width={200}
                      height={200}
                      priority
                      style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "22px", fontWeight: 800, color: "#1F2E2A", letterSpacing: "0.01em", lineHeight: 1.2, whiteSpace: "nowrap" }}>
                        ヨミトク編集部
                      </div>
                      <p style={{
                        color: "#5F8F91",
                        fontSize: "13px",
                        fontWeight: 500,
                        marginTop: "3px",
                        letterSpacing: "0.05em",
                        lineHeight: 1.5,
                        whiteSpace: "nowrap",
                      }}>
                        制度を、読むから、わかるへ。
                      </p>
                    </div>
                  </div>

                  {/* Hero copy */}
                  <h1 style={{
                    fontWeight: 800,
                    lineHeight: 1.25,
                    marginBottom: "24px",
                    letterSpacing: "-0.02em",
                  }}>
                    <span style={{ display: "block", fontSize: "clamp(38px, 3.2vw, 52px)", color: "#222222", whiteSpace: "nowrap" }}>読むのは、</span>
                    <span style={{ display: "block", fontSize: "clamp(38px, 3.2vw, 52px)", color: "#0D686E", whiteSpace: "nowrap" }}>編集部。</span>
                    <span style={{ display: "block", fontSize: "clamp(38px, 3.2vw, 52px)", color: "#222222", whiteSpace: "nowrap" }}>考えるのは、</span>
                    <span style={{ display: "block", fontSize: "clamp(38px, 3.2vw, 52px)", color: "#0D686E", whiteSpace: "nowrap" }}>あなた。</span>
                  </h1>
                </div>

                {/* Mascot */}
                <Image
                  src="/LP_sozai/assets/mascot/gori-writing-notebook.png"
                  alt=""
                  width={194}
                  height={206}
                  style={{ width: "320px", height: "auto", flexShrink: 0 }}
                />
              </div>

              {/* Sub copy */}
              <p style={{
                fontSize: "16px",
                fontWeight: 500,
                lineHeight: 1.8,
                letterSpacing: "0.01em",
                color: "#2A5A5D",
                marginBottom: "36px",
              }}>
                バックナンバーも、分科会も、ガイドラインも、<br />
                必要な情報は、ヨミトク編集部にあります。
              </p>

              {/* Feature cards */}
              <div style={{ background: "white", borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
                  {features.map((f, i) => (
                    <div
                      key={f.title}
                      style={{
                        padding: "26px 20px",
                        borderLeft: i > 0 ? "1px solid rgba(13, 104, 110, 0.12)" : "none",
                      }}
                    >
                      <div style={{ marginBottom: "8px" }}>{f.icon}</div>
                      <div style={{ color: "#0D686E", fontWeight: 600, fontSize: "16px", marginBottom: "8px", lineHeight: 1.45 }}>
                        {f.title}
                      </div>
                      <div style={{ color: "#5B7F80", fontSize: "13px", lineHeight: 1.75, whiteSpace: "pre-line", fontWeight: 400 }}>
                        {f.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: Login card ── */}
            <div className="login-right-panel" style={{
              background: "white",
              borderRadius: "20px",
              padding: "44px 42px 36px",
              boxShadow: "0 20px 60px rgba(13,104,110,0.10)",
            }}>
              <h2 style={{
                fontSize: "42px",
                fontWeight: 800,
                textAlign: "center",
                color: "#222222",
                lineHeight: 1.25,
                letterSpacing: "-0.03em",
                margin: 0,
              }}>
                ログイン
              </h2>
              <p style={{
                fontSize: "15px",
                fontWeight: 400,
                color: "#999999",
                textAlign: "center",
                lineHeight: 1.6,
                letterSpacing: "0.01em",
                marginTop: "12px",
                marginBottom: "36px",
              }}>
                ヨミトク編集室にログインします
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>

                {/* Email */}
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "16px", fontWeight: 600, color: "#222222", marginBottom: "10px", lineHeight: 1.5 }}>
                    メールアドレス
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#A8B0B0", display: "flex", pointerEvents: "none" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="例）yomitoku@example.com"
                      className="login-input"
                      style={{ ...inputBase, paddingLeft: "54px" }}
                      onFocus={e => { e.target.style.borderColor = "#0D686E"; }}
                      onBlur={e => { e.target.style.borderColor = "#E5E5E5"; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "16px", fontWeight: 600, color: "#222222", marginBottom: "10px", lineHeight: 1.5 }}>
                    パスワード
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#A8B0B0", display: "flex", pointerEvents: "none" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="パスワードを入力してください"
                      className="login-input"
                      style={{ ...inputBase, paddingLeft: "54px", paddingRight: "56px" }}
                      onFocus={e => { e.target.style.borderColor = "#0D686E"; }}
                      onBlur={e => { e.target.style.borderColor = "#E5E5E5"; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: "18px", top: "50%", transform: "translateY(-50%)", color: "#A8B0B0", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                    >
                      {showPassword ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 400, color: "#555", cursor: "pointer", lineHeight: 1.5, whiteSpace: "nowrap" }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "#0D686E", flexShrink: 0 }}
                    />
                    ログインしたままにする
                  </label>
                  <a href="/base/forgot-password" style={{ fontSize: "14px", fontWeight: 600, color: "#0D686E", textDecoration: "none", whiteSpace: "nowrap" }}>
                    パスワードをお忘れの方
                  </a>
                </div>

                {lineError && (
                  <div style={{ background: "#FFF0F0", border: "1px solid #FFCCCC", borderRadius: "12px", padding: "12px 16px", fontSize: "13px", color: "#CC4444", marginTop: "16px" }}>
                    {lineError}
                  </div>
                )}

                {resetSuccess && (
                  <div style={{ background: "#E6F4F2", border: "1px solid #0D686E", borderRadius: "12px", padding: "12px 16px", fontSize: "13px", color: "#0A4A50", marginTop: "16px" }}>
                    パスワードを更新しました。新しいパスワードでログインしてください。
                  </div>
                )}

                {error && (
                  <div style={{ background: "#FFF0F0", border: "1px solid #FFCCCC", borderRadius: "12px", padding: "12px 16px", fontSize: "13px", color: "#CC4444", marginTop: "16px" }}>
                    {error}
                  </div>
                )}

                {/* Login button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: "64px",
                    backgroundColor: loading ? "#d1d5db" : "#0D686E",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "20px",
                    letterSpacing: "0.04em",
                    border: "none",
                    borderRadius: "12px",
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "24px",
                    fontFamily: font,
                  }}
                >
                  {loading ? "ログイン中..." : "ログイン"}
                </button>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "#E8ECEC" }} />
                  <span style={{ color: "#B0B0B0", fontSize: "14px", fontWeight: 400 }}>または</span>
                  <div style={{ flex: 1, height: "1px", background: "#E8ECEC" }} />
                </div>

                {/* LINE login */}
                <a
                  href="/api/auth/line-login"
                  style={{
                    width: "100%",
                    height: "62px",
                    background: "white",
                    border: "1.5px solid #06C755",
                    borderRadius: "12px",
                    fontSize: "18px",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    color: "#222222",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    fontFamily: font,
                    textDecoration: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#06C755">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                  LINEでログイン
                </a>

                <div style={{ marginTop: "24px", borderTop: "1px solid #F0F0F0", paddingTop: "24px", textAlign: "center" }}>
                  <p style={{ fontSize: "13px", color: "#A0A0A0", marginBottom: "12px" }}>アカウントをお持ちでない方</p>
                  <a href="/register" style={{
                    display: "block",
                    width: "100%",
                    height: "52px",
                    lineHeight: "52px",
                    background: "#F0F9F8",
                    border: "1.5px solid #0D686E",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#0D686E",
                    textDecoration: "none",
                    textAlign: "center",
                  }}>
                    新規登録はこちら
                  </a>
                </div>
              </form>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: "14px 48px", borderTop: "1px solid #C8E8E1", marginTop: "12px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
          {[
            { label: "利用規約", href: "/legal/terms" },
            { label: "プライバシーポリシー", href: "/legal/privacy" },
            { label: "特定商取引法に基づく表記", href: "/legal/commercial" },
          ].map((l, i) => (
            <span key={l.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {i > 0 && <span style={{ color: "#D8DEDE" }}>｜</span>}
              <a href={l.href} style={{ fontSize: "13px", color: "#8C9898", textDecoration: "none", lineHeight: 1.6 }}>{l.label}</a>
            </span>
          ))}
          <span style={{ color: "#D8DEDE", margin: "0 4px" }}>｜</span>
          <span style={{ fontSize: "12px", color: "#9AA4A4" }}>© 2026 ONZiii Act Inc.</span>
        </div>
      </footer>

    </div>
  );
}
