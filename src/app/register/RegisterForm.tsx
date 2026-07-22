"use client";

import { useState, useActionState } from "react";
import { startRegistration } from "./actions";
import styles from "./register.module.css";

const ROLES = ["代表者・経営者", "事務長・施設長・管理者", "その他"];

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

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

type Tag = { key: string; label: string };

export default function RegisterForm({ tags, referralCode, isAmbassador = false }: { tags: Tag[]; referralCode: string | null; isAmbassador?: boolean }) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [state, action, pending] = useActionState(startRegistration, null);

  const passwordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  const toggleTag = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <form action={action} className={styles.form}>
      {referralCode && <input type="hidden" name="ref" value={referralCode} />}

      {/* 法人名 */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="companyName">
          法人名 <span className={styles.required}>必須</span>
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          className={styles.input}
          placeholder="例：医療法人社団さくら"
          required
          maxLength={100}
        />
      </div>

      {/* 事業所名 */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="facilityName">
          事業所名 <span className={styles.required}>必須</span>
        </label>
        <input
          id="facilityName"
          name="facilityName"
          type="text"
          className={styles.input}
          placeholder="例：さくら訪問介護ステーション"
          required
          maxLength={100}
        />
        <p className={styles.hint}>事業所コードは事業所ごとに発行されます。複数の事業所がある場合は事業所ごとにご登録ください</p>
      </div>

      {/* 担当者名 */}
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
        />
      </div>

      {/* 役職 */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="contactRole">
          役職 <span className={styles.required}>必須</span>
        </label>
        <select
          id="contactRole"
          name="contactRole"
          className={styles.input}
          required
          defaultValue=""
        >
          <option value="" disabled>選択してください</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* メールアドレス */}
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
        <p className={styles.hint}>登録完了後のLINE案内・領収書の送付先になります</p>
      </div>

      {/* パスワード */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          パスワード <span className={styles.required}>必須</span>
        </label>
        <div className={styles.passwordWrap}>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            className={styles.input}
            placeholder="8文字以上"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* パスワード確認 */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="passwordConfirm">
          パスワード（確認） <span className={styles.required}>必須</span>
        </label>
        <div className={styles.passwordWrap}>
          <input
            id="passwordConfirm"
            type={showPasswordConfirm ? "text" : "password"}
            className={`${styles.input} ${passwordMismatch ? styles.inputError : ""}`}
            placeholder="もう一度入力してください"
            required
            minLength={8}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
          <button type="button" className={styles.eyeBtn} onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} tabIndex={-1}>
            {showPasswordConfirm ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
        {passwordMismatch && <p className={styles.fieldError}>パスワードが一致しません</p>}
      </div>

      {/* 電話番号 */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="phone">
          電話番号 <span style={{ fontSize: 11, color: "#aaa", marginLeft: 6 }}>任意</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className={styles.input}
          placeholder="例：0566-91-0257"
          maxLength={20}
        />
      </div>

      {/* 都道府県 */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="prefecture">
          都道府県 <span style={{ fontSize: 11, color: "#aaa", marginLeft: 6 }}>任意</span>
        </label>
        <select
          id="prefecture"
          name="prefecture"
          className={styles.input}
          defaultValue=""
        >
          <option value="">選択しない</option>
          {PREFECTURES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* タグ選択 */}
      <div className={styles.field}>
        <label className={styles.label}>
          受け取りたい情報 <span className={styles.required}>必須（複数選択可）</span>
        </label>
        <p className={styles.hint}>選択した分野に関連する情報をLINEでお届けします</p>
        <div style={{ marginTop: 4 }}>
          {TAG_CATEGORIES.map((cat) => {
            const catTags = tags.filter((t) => cat.keys.includes(t.key));
            if (catTags.length === 0) return null;
            return (
              <div key={cat.label} className={styles.tagCategorySection}>
                <p className={styles.tagCategoryLabel}>{cat.label}</p>
                <div className={styles.tagGrid}>
                  {catTags.map((tag) => (
                    <label key={tag.key} className={styles.tagLabel}>
                      <input
                        type="checkbox"
                        name="tagKeys"
                        value={tag.key}
                        checked={selectedKeys.includes(tag.key)}
                        onChange={() => toggleTag(tag.key)}
                        className={styles.tagCheckbox}
                      />
                      <span className={`${styles.tagChip} ${selectedKeys.includes(tag.key) ? styles.tagChipActive : ""}`}>
                        {tag.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 同意 */}
      <div className={styles.field}>
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ marginTop: 3, flexShrink: 0, accentColor: "#0D686E" }}
          />
          <span style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>
            <a href="/legal/terms" target="_blank" style={{ color: "#0D686E", textDecoration: "underline" }}>利用規約</a>・
            <a href="/legal/privacy" target="_blank" style={{ color: "#0D686E", textDecoration: "underline" }}>プライバシーポリシー</a>・
            <a href="/legal/commercial" target="_blank" style={{ color: "#0D686E", textDecoration: "underline" }}>特定商取引法に基づく表記</a>
            に同意します
          </span>
        </label>
      </div>

      {/* 支払いプラン */}
      {!isAmbassador && (
        <div className={styles.field}>
          <label className={styles.label}>
            お支払いプラン <span className={styles.required}>必須</span>
          </label>
          <input type="hidden" name="plan" value={plan} />
          <div className={styles.tagGrid} style={{ gridTemplateColumns: "1fr 1fr" }}>
            <label className={styles.tagLabel}>
              <input
                type="radio"
                checked={plan === "monthly"}
                onChange={() => setPlan("monthly")}
                className={styles.tagCheckbox}
              />
              <span className={`${styles.tagChip} ${plan === "monthly" ? styles.tagChipActive : ""}`}>
                月払い<br />¥300 / 月
              </span>
            </label>
            <label className={styles.tagLabel}>
              <input
                type="radio"
                checked={plan === "annual"}
                onChange={() => setPlan("annual")}
                className={styles.tagCheckbox}
              />
              <span className={`${styles.tagChip} ${plan === "annual" ? styles.tagChipActive : ""}`}>
                年払い<br />¥3,600 / 年
              </span>
            </label>
          </div>
        </div>
      )}

      {state?.error && (
        <p className={styles.errorMsg}>{state.error}</p>
      )}

      {isAmbassador ? (
        <div className={styles.summary}>
          <p><strong>アンバサダー登録</strong></p>
          <p className={styles.summaryNote}>お支払い情報の入力は不要です</p>
        </div>
      ) : (
        <div className={styles.summary}>
          <p>
            {plan === "monthly"
              ? <>月額 <strong>¥300（税抜）</strong></>
              : <>年額 <strong>¥3,600（税抜）</strong></>}
          </p>
          <p className={styles.summaryNote}>クレジットカードで安全に決済（Stripe）</p>
        </div>
      )}

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={pending || selectedKeys.length === 0 || !agreed || passwordMismatch || password.length < 8}
      >
        {pending ? "処理中..." : isAmbassador ? "登録する →" : "お支払いに進む →"}
      </button>

    </form>
  );
}
