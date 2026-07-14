"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

const TAG_CATEGORIES = [
  {
    label: "事業種別",
    keys: ["訪問介護","訪問看護","通所介護","通所リハビリ","居宅介護支援","福祉用具","訪問入浴","短期入所","小規模多機能","看護小規模多機能","認知症グループホーム","特養","老健","介護医療院","有料老人ホーム","サ高住","その他"],
  },
  {
    label: "制度",
    keys: ["制度改正","報酬改定","Q&A","通知"],
  },
  {
    label: "運営",
    keys: ["人員基準","加算・減算","運営指導","BCP","感染対策","安全対策"],
  },
  {
    label: "経営",
    keys: ["補助金・助成金","公募","ICT・DX","生産性向上","人材採用","処遇改善"],
  },
  {
    label: "学び",
    keys: ["セミナー","ガイドライン","事例紹介"],
  },
];

export default function LiffTagsPage() {
  const [status, setStatus] = useState<"loading" | "unauth" | "ready" | "error">("loading");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_TAGS_ID ?? process.env.NEXT_PUBLIC_LIFF_ID! });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const token = liff.getAccessToken();
        if (!token) throw new Error("トークン取得失敗");

        // verify
        const verifyRes = await fetch("/api/liff/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!verifyRes.ok) {
          if (!cancelled) setStatus("unauth");
          return;
        }

        // fetch current tags
        const tagsRes = await fetch("/api/liff/tags", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (tagsRes.ok) {
          const { selectedKeys } = await tagsRes.json();
          if (!cancelled) setSelected(new Set(selectedKeys));
        }

        if (!cancelled) {
          setAccessToken(token);
          setStatus("ready");
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(String(e));
          setStatus("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    if (!accessToken) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/liff/tags", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ tagKeys: [...selected] }),
      });
      if (res.ok) setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>読み込み中...</p>
      </div>
    );
  }

  if (status === "unauth") {
    return (
      <div className={styles.center}>
        <div className={styles.unauthIcon}>🔒</div>
        <h2 className={styles.unauthTitle}>会員限定ページ</h2>
        <p className={styles.unauthText}>ヨミトクに登録済みのLINEアカウントでのみ設定できます。</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>エラーが発生しました</p>
        <p className={styles.errorDetail}>{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>配信タグ設定</h1>
        <p className={styles.subtitle}>受け取りたい情報カテゴリを選んでください</p>
        <p className={styles.note}>この設定はあなた個人の設定です。他のメンバーとは独立して管理されます。</p>
      </div>

      <div className={styles.categories}>
        {TAG_CATEGORIES.map((cat) => (
          <div key={cat.label} className={styles.category}>
            <p className={styles.categoryLabel}>{cat.label}</p>
            <div className={styles.tagGrid}>
              {cat.keys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.tag} ${selected.has(key) ? styles.tagActive : ""}`}
                  onClick={() => toggle(key)}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.selectedCount}>
          {selected.size > 0 ? `${selected.size}個のタグを選択中` : "タグが未選択です（全情報が届きます）"}
        </p>
        <button
          className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ""}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "保存中..." : saved ? "✓ 保存しました" : "設定を保存する"}
        </button>
      </div>
    </div>
  );
}
