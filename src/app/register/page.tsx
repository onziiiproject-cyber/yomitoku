import type { Metadata } from "next";
import RegisterForm from "./RegisterForm";
import styles from "./register.module.css";

export const metadata: Metadata = {
  title: "事業所登録 | YOMITOKU",
};

export default function RegisterPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.pageHeader}>
          <div className={styles.logo}>
            <span className={styles.logoYomi}>ヨミ</span>
            <span className={styles.logoToku}>トク</span>
          </div>
          <h1 className={styles.pageTitle}>事業所登録</h1>
          <p className={styles.pageDesc}>
            情報を入力してお支払いに進んでください。
            <br />
            登録完了後、翌朝からLINEに配信が届きます。
          </p>
        </header>
        <RegisterForm />
      </div>
    </div>
  );
}
