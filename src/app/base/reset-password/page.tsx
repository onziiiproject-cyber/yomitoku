"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { resetPassword } from "./actions";

const font = '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif';
const P = { teal: "#0D686E", border: "#E5E5E5", bg: "#F8FCFC" };

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, action, pending] = useActionState(resetPassword, null);

  const mismatch = confirm.length > 0 && pw !== confirm;

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>
        <p style={{ color: "#e05252" }}>無効なリンクです。</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: P.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: font }}>
      <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(13,104,110,0.08)", padding: "44px 40px" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image src="/icons/logo-base-horizontal-trimmed.png" alt="ヨミトク" width={160} height={45} style={{ height: 28, width: "auto" }} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1F2E2A", marginBottom: 10 }}>新しいパスワードを設定</h1>
        <p style={{ fontSize: 14, color: "#888", lineHeight: 1.8, marginBottom: 28 }}>8文字以上のパスワードを入力してください。</p>

        <form action={action} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <input type="hidden" name="token" value={token} />

          {/* パスワード */}
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#222", marginBottom: 8 }}>新しいパスワード</label>
            <div style={{ position: "relative" }}>
              <input
                name="password"
                type={showPw ? "text" : "password"}
                required
                minLength={8}
                placeholder="8文字以上"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                style={{ width: "100%", height: 52, border: `1.5px solid ${P.border}`, borderRadius: 10, fontSize: 15, padding: "0 48px 0 14px", fontFamily: font, boxSizing: "border-box", outline: "none" }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 0, display: "flex" }}>
                <EyeIcon open={showPw} />
              </button>
            </div>
          </div>

          {/* 確認 */}
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#222", marginBottom: 8 }}>パスワード（確認）</label>
            <div style={{ position: "relative" }}>
              <input
                name="passwordConfirm"
                type={showConfirm ? "text" : "password"}
                required
                minLength={8}
                placeholder="もう一度入力してください"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={{ width: "100%", height: 52, border: `1.5px solid ${mismatch ? "#e05252" : P.border}`, borderRadius: 10, fontSize: 15, padding: "0 48px 0 14px", fontFamily: font, boxSizing: "border-box", outline: "none" }}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 0, display: "flex" }}>
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {mismatch && <p style={{ fontSize: 12, color: "#e05252", marginTop: 4 }}>パスワードが一致しません</p>}
          </div>

          {state?.error && (
            <p style={{ fontSize: 13, color: "#e05252", margin: 0 }}>{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending || mismatch || pw.length < 8}
            style={{ width: "100%", height: 52, background: (pending || mismatch || pw.length < 8) ? "#ccc" : P.teal, color: "#fff", border: "none", borderRadius: 100, fontSize: 16, fontWeight: 700, cursor: (pending || mismatch || pw.length < 8) ? "not-allowed" : "pointer", fontFamily: font }}
          >
            {pending ? "更新中..." : "パスワードを更新する"}
          </button>
        </form>
      </div>
    </div>
  );
}
