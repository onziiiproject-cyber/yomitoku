"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Step = "loading" | "code" | "nickname" | "done" | "error";

export default function LiffRegisterPage() {
  const [step, setStep] = useState<Step>("loading");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [memberOfName, setMemberOfName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_REGISTER_ID! });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const token = liff.getAccessToken();
        if (!token) throw new Error("トークン取得失敗");

        if (!cancelled) {
          setAccessToken(token);
          setStep("code");
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(String(e));
          setStep("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmitCode() {
    if (!accessToken || code.trim().length === 0) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/liff/register/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: accessToken, code: code.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setErrorMsg(codeErrorMessage(data?.error));
        return;
      }
      setMemberOfName(data.memberOfName);
      setStep("nickname");
    } catch {
      setErrorMsg("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitNickname() {
    if (!accessToken || nickname.trim().length === 0) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/liff/register/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: accessToken, nickname: nickname.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setErrorMsg("ニックネームは20文字以内で入力してください。");
        return;
      }
      setStep("done");
    } catch {
      setErrorMsg("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  function codeErrorMessage(error: string | undefined) {
    switch (error) {
      case "invalid_format":
        return "事業所コードは英数字8桁です（例：AB3DEFGH）。";
      case "invalid":
        return "有効な事業所コードではありません。登録時のメールまたは設定ページをご確認ください。";
      case "full":
        return "この事業所のLINE登録人数が上限に達しています。管理者にお問い合わせください。";
      case "already_registered":
        return "すでに登録済みです。";
      default:
        return "エラーが発生しました。もう一度お試しください。";
    }
  }

  if (step === "loading") {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>読み込み中...</p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>エラーが発生しました</p>
        <p className={styles.errorDetail}>{errorMsg}</p>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.iconBadge}>🔐</div>
          <h1 className={styles.title}>事業所認証</h1>
          <p className={styles.subtitle}>認証コードを入力してください</p>
        </div>

        <div className={styles.body}>
          <p className={styles.explain}>
            登録時に発行された<strong>事業所コード（英数字8桁）</strong>を入力し、事業所の認証を行います。
          </p>
          <input
            className={styles.codeInput}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="AB3DEFGH"
            maxLength={12}
            autoCapitalize="characters"
            autoComplete="off"
          />
          {errorMsg && <p className={styles.errorInline}>{errorMsg}</p>}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.submitBtn}
            onClick={handleSubmitCode}
            disabled={submitting || code.trim().length === 0}
          >
            {submitting ? "確認中..." : "認証コードを入力する"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "nickname") {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={`${styles.iconBadge} ${styles.iconBadgeOrange}`}>👤</div>
          <h1 className={styles.title}>ニックネーム設定</h1>
          <p className={styles.subtitle}>{memberOfName}のメンバーとして登録されました🎉</p>
        </div>

        <div className={styles.body}>
          <p className={styles.explain}>
            ヨミトク編集室で表示される<strong>ニックネーム</strong>を設定します。あとから変更もできます。
          </p>
          <input
            className={styles.codeInput}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="ヨミトク太郎"
            maxLength={20}
            autoComplete="off"
          />
          {errorMsg && <p className={styles.errorInline}>{errorMsg}</p>}
        </div>

        <div className={styles.footer}>
          <button
            className={`${styles.submitBtn} ${styles.submitBtnOrange}`}
            onClick={handleSubmitNickname}
            disabled={submitting || nickname.trim().length === 0}
          >
            {submitting ? "登録中..." : "ニックネームを設定する"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.center}>
      <div className={styles.doneIcon}>✅</div>
      <h2 className={styles.doneTitle}>登録完了！</h2>
      <p className={styles.doneText}>
        トークルームに戻って、週刊ヨミトクの配信をお楽しみください。
      </p>
    </div>
  );
}
