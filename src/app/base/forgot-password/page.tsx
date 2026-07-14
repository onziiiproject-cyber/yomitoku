"use client";

import { useActionState } from "react";
import Image from "next/image";
import { requestPasswordReset } from "./actions";

const font = '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif';
const P = { teal: "#0D686E", border: "#E5E5E5", bg: "#F8FCFC", muted: "#888" };

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);

  return (
    <div style={{ minHeight: "100vh", background: P.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: font }}>
      <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(13,104,110,0.08)", padding: "44px 40px" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image src="/icons/logo-base-horizontal-trimmed.png" alt="ヨミトク" width={160} height={45} style={{ height: 28, width: "auto" }} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1F2E2A", marginBottom: 10 }}>パスワードをお忘れの方</h1>

        {state?.success ? (
          <>
            <div style={{ background: "#E6F4F2", border: "1.5px solid #0D686E", borderRadius: 12, padding: "20px 24px", marginTop: 24 }}>
              <p style={{ fontSize: 15, color: "#0A4A50", fontWeight: 600, margin: "0 0 8px" }}>メールを送信しました</p>
              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.8, margin: 0 }}>
                ご登録のメールアドレスにリセット用リンクをお送りしました。<br />
                メールが届かない場合は迷惑メールフォルダをご確認ください。
              </p>
            </div>
            <a href="/base/login" style={{ display: "block", textAlign: "center", marginTop: 24, fontSize: 14, color: P.teal, fontWeight: 600, textDecoration: "none" }}>
              ← ログイン画面に戻る
            </a>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: P.muted, lineHeight: 1.8, marginBottom: 28 }}>
              ご登録のメールアドレスを入力してください。<br />
              パスワードリセット用のリンクをお送りします。
            </p>

            <form action={action} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#222", marginBottom: 8 }}>
                  メールアドレス
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="例）info@example.com"
                  style={{ width: "100%", height: 52, border: `1.5px solid ${P.border}`, borderRadius: 10, fontSize: 15, padding: "0 14px", fontFamily: font, boxSizing: "border-box", outline: "none" }}
                />
              </div>

              {state?.error && (
                <p style={{ fontSize: 13, color: "#e05252", margin: 0 }}>{state.error}</p>
              )}

              <button
                type="submit"
                disabled={pending}
                style={{ width: "100%", height: 52, background: pending ? "#ccc" : P.teal, color: "#fff", border: "none", borderRadius: 100, fontSize: 16, fontWeight: 700, cursor: pending ? "not-allowed" : "pointer", fontFamily: font }}
              >
                {pending ? "送信中..." : "リセットメールを送信する"}
              </button>
            </form>

            <a href="/base/login" style={{ display: "block", textAlign: "center", marginTop: 20, fontSize: 14, color: P.teal, fontWeight: 600, textDecoration: "none" }}>
              ← ログイン画面に戻る
            </a>
          </>
        )}
      </div>
    </div>
  );
}
