"use client";

import { useEffect, useState, useActionState } from "react";
import { startRegistration } from "./actions";
import styles from "./register.module.css";

const CATEGORIES = [
  { key: "visiting",    label: "訪問系サービス" },
  { key: "daycare",     label: "通所・小規模多機能系" },
  { key: "facility",    label: "施設・入所系" },
  { key: "caremanager", label: "居宅介護支援・ケアマネ" },
  { key: "equipment",   label: "福祉用具・住宅改修" },
  { key: "community",   label: "地域密着型サービス全般" },
  { key: "revision",    label: "報酬改定・制度改正" },
  { key: "procedure",   label: "様式・手続き" },
  { key: "safety",      label: "安全・事故防止" },
  { key: "training",    label: "セミナー・研修案内" },
];

type LiffProfile = {
  userId: string;
  displayName: string;
};

export default function RegisterForm() {
  const [liffReady, setLiffReady] = useState(false);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [state, action, pending] = useActionState(startRegistration, null);

  useEffect(() => {
    (async () => {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        const p = await liff.getProfile();
        setProfile({ userId: p.userId, displayName: p.displayName });
        setLiffReady(true);
      } catch (e) {
        console.error(e);
        setLiffError("LINEの認証に失敗しました。LINEアプリから開き直してください。");
      }
    })();
  }, []);

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  if (liffError) {
    return (
      <div className={styles.error}>
        <p>{liffError}</p>
      </div>
    );
  }

  if (!liffReady) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>LINE認証中...</p>
      </div>
    );
  }

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="lineUserId" value={profile?.userId ?? ""} />
      <input type="hidden" name="lineDisplayName" value={profile?.displayName ?? ""} />

      <div className={styles.field}>
        <label className={styles.label} htmlFor="companyName">
          事業所名 <span className={styles.required}>必須</span>
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          className={styles.input}
          placeholder="例：さくら訪問介護事業所"
          required
          maxLength={100}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="contactName">
          担当者名 <span className={styles.required}>必須</span>
        </label>
        <input
          id="contactName"
          name="contactName"
          type="text"
          className={styles.input}
          placeholder="例：山田 太郎"
          required
          maxLength={50}
          defaultValue={profile?.displayName ?? ""}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          メールアドレス <span className={styles.required}>必須</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className={styles.input}
          placeholder="例：info@example.com"
          required
        />
        <p className={styles.hint}>領収書・重要なお知らせの送付先になります</p>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          受信するカテゴリ <span className={styles.required}>必須（複数選択可）</span>
        </label>
        <div className={styles.tagGrid}>
          {CATEGORIES.map((cat) => (
            <label key={cat.key} className={styles.tagLabel}>
              <input
                type="checkbox"
                name="tagKeys"
                value={cat.key}
                checked={selectedKeys.includes(cat.key)}
                onChange={() => toggleKey(cat.key)}
                className={styles.tagCheckbox}
              />
              <span className={`${styles.tagChip} ${selectedKeys.includes(cat.key) ? styles.tagChipActive : ""}`}>
                {cat.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {state?.error && (
        <p className={styles.errorMsg}>{state.error}</p>
      )}

      <div className={styles.summary}>
        <p>月額 <strong>¥300（税抜）</strong></p>
        <p className={styles.summaryNote}>クレジットカードで安全に決済（Stripe）</p>
      </div>

      <button type="submit" className={styles.submitBtn} disabled={pending || selectedKeys.length === 0}>
        {pending ? "処理中..." : "お支払いに進む →"}
      </button>

      <p className={styles.terms}>
        登録することで<a href="/legal/terms" target="_blank">利用規約</a>および
        <a href="/legal/privacy" target="_blank">プライバシーポリシー</a>に同意したものとみなします。
      </p>
    </form>
  );
}
