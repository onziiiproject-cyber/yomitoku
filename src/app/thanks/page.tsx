import type { Metadata } from "next";
import styles from "./thanks.module.css";

export const metadata: Metadata = {
  title: "登録完了 | YOMITOKU",
};

export default function ThanksPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>✅</div>
        <h1 className={styles.title}>登録が完了しました！</h1>
        <p className={styles.desc}>
          ご登録ありがとうございます。
          <br />
          翌朝から介護保険の最新情報が
          <br />
          LINEに届きます。
        </p>
        <div className={styles.note}>
          <p>※ 登録完了のご案内をメールでお送りしました。</p>
          <p>※ 届かない場合は迷惑メールフォルダをご確認ください。</p>
        </div>
      </div>
    </div>
  );
}
