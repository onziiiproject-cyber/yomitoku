import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import RegisterForm from "./RegisterForm";
import styles from "./register.module.css";
import Image from "next/image";

export const metadata: Metadata = {
  title: "ユーザー登録 | ヨミトク編集部",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const [tags, { ref }] = await Promise.all([
    prisma.tag.findMany({
      orderBy: { sortOrder: "asc" },
      select: { key: true, label: true },
    }),
    searchParams,
  ]);

  const referralRaw = ref
    ? await prisma.referralCode.findUnique({ where: { code: ref }, select: { code: true, expiresAt: true } })
    : null;
  const referral = referralRaw && (!referralRaw.expiresAt || referralRaw.expiresAt > new Date())
    ? referralRaw
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.pageHeader}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <Image
              src="/icons/icon-gori-editor.jpg"
              alt=""
              width={200}
              height={200}
              style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
            />
            <span style={{ fontSize: 17, fontWeight: 800, color: "#1F2E2A" }}>ヨミトク編集部</span>
          </div>
          <h1 className={styles.pageTitle}>ユーザー登録</h1>
          <p className={styles.pageDesc}>
            情報を入力してお支払いに進んでください。<br />
            登録完了後にLINE登録の案内をお送りします。
          </p>
          <div className={styles.accountNote}>
            <span>1アカウントで法人内3名まで共有できます</span>
          </div>
          {referral && (
            <div style={{ marginTop: 12, background: "#FFF8F0", border: "1.5px solid #F5A623", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#7B4F00", fontWeight: 700 }}>
              🎁 紹介登録のため、初月無料でご利用いただけます
            </div>
          )}
        </header>
        <RegisterForm tags={tags} referralCode={referral?.code ?? null} />
      </div>
    </div>
  );
}
