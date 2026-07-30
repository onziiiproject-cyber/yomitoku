import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import RegisterForm from "./RegisterForm";
import styles from "./register.module.css";
import Image from "next/image";

export const metadata: Metadata = {
  title: "ユーザー登録 | ヨミトク編集部",
  description: "介護保険最新情報をLINEで受け取るユーザー登録ページです。月額300円から、最大3アカウントまで利用できます。",
  alternates: { canonical: "https://yomitoku-base.com/register" },
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
    ? await prisma.referralCode.findUnique({ where: { code: ref }, select: { code: true, expiresAt: true, isAmbassador: true, disabledAt: true } })
    : null;
  const referral = referralRaw && !referralRaw.disabledAt && (!referralRaw.expiresAt || referralRaw.expiresAt > new Date())
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
            情報を入力してお申し込みください。<br />登録完了後にLINE登録の案内をお送りします。
          </p>
          <div className={styles.accountNote}>
            <span>1アカウントで法人内3名まで共有できます</span>
          </div>
        </header>
        <RegisterForm tags={tags} referralCode={referral?.code ?? null} isAmbassador={referral?.isAmbassador ?? false} />
      </div>
    </div>
  );
}
