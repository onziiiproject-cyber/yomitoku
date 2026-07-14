import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import RegisterForm from "./RegisterForm";
import styles from "./register.module.css";
import Image from "next/image";

export const metadata: Metadata = {
  title: "ユーザー登録 | YOMITOKU",
};

export default async function RegisterPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { sortOrder: "asc" },
    select: { key: true, label: true },
  });

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.pageHeader}>
          <Image
            src="/icons/logo-base-horizontal-trimmed.png"
            alt="ヨミトク"
            width={200}
            height={56}
            style={{ height: 36, width: "auto", marginBottom: 20 }}
          />
          <h1 className={styles.pageTitle}>ユーザー登録</h1>
          <p className={styles.pageDesc}>
            情報を入力してお支払いに進んでください。<br />
            登録完了後にLINE登録の案内をお送りします。
          </p>
          <div className={styles.accountNote}>
            <span>1アカウントで法人内3名まで共有できます</span>
          </div>
        </header>
        <RegisterForm tags={tags} />
      </div>
    </div>
  );
}
