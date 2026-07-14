"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function LiffRequestPage() {
  const [status, setStatus] = useState<"loading" | "unauth" | "ready" | "error">("loading");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_REQUEST_ID ?? process.env.NEXT_PUBLIC_LIFF_ID! });
        if (!liff.isLoggedIn()) { liff.login(); return; }

        const token = liff.getAccessToken();
        if (!token) throw new Error("トークン取得失敗");

        const verifyRes = await fetch("/api/liff/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!verifyRes.ok) { if (!cancelled) setStatus("unauth"); return; }

        if (!cancelled) { setAccessToken(token); setStatus("ready"); }
      } catch (e) {
        if (!cancelled) { setErrorMsg(String(e)); setStatus("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/liff/request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      if (res.ok) setDone(true);
      else setErrorMsg("送信に失敗しました。もう一度お試しください。");
    } catch {
      setErrorMsg("送信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") return (
    <div className={styles.center}>
      <div className={styles.spinner} />
      <p className={styles.loadingText}>読み込み中...</p>
    </div>
  );

  if (status === "unauth") return (
    <div className={styles.center}>
      <div className={styles.icon}>🔒</div>
      <h2 className={styles.unauthTitle}>会員限定ページ</h2>
      <p className={styles.unauthText}>ヨミトクに登録済みのLINEアカウントでのみご利用できます。</p>
    </div>
  );

  if (status === "error") return (
    <div className={styles.center}>
      <p className={styles.errorText}>エラーが発生しました</p>
      <p className={styles.errorDetail}>{errorMsg}</p>
    </div>
  );

  if (done) return (
    <div className={styles.center}>
      <div className={styles.icon}>✅</div>
      <h2 className={styles.doneTitle}>ありがとうございます！</h2>
      <p className={styles.doneText}>
        機能要望を受け付けました。<br />
        サービス改善の参考にさせていただきます。
      </p>
      <button className={styles.backBtn} onClick={() => { setDone(false); setTitle(""); setBody(""); }}>
        別の要望を送る
      </button>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>機能要望</h1>
        <p className={styles.subtitle}>改善点・欲しい機能をお知らせください</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>要望タイトル <span className={styles.required}>必須</span></label>
          <input
            className={styles.input}
            type="text"
            placeholder="例：PDFをダウンロードしたい"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
          <p className={styles.hint}>{title.length}/100文字</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>詳細内容 <span className={styles.required}>必須</span></label>
          <textarea
            className={styles.textarea}
            placeholder="どんな機能が欲しいか、どんな場面で使いたいかを教えてください"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            maxLength={1000}
          />
          <p className={styles.hint}>{body.length}/1000文字</p>
        </div>

        {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={submitting || !title.trim() || !body.trim()}
        >
          {submitting ? "送信中..." : "送信する"}
        </button>
      </form>
    </div>
  );
}
