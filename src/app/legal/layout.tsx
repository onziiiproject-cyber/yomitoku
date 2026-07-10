import type { Metadata } from "next";
import styles from "./legal.module.css";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <a href="/" className={styles.back}>← トップに戻る</a>
        {children}
      </div>
    </div>
  );
}
