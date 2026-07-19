import type { Metadata } from "next";
import Image from "next/image";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import styles from "./thanks.module.css";

export const metadata: Metadata = {
  title: "登録完了 | ヨミトク編集部",
};

const LINE_ADD_URL = "https://line.me/R/ti/p/@324eesis";

async function resolveInviteCode(sessionId?: string): Promise<string | null> {
  if (!sessionId) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const companyId = session.metadata?.companyId;
    if (!companyId) return null;

    // Stripeのwebhook（招待コード発行）がこの画面の表示より少し遅れる場合があるため、短く再試行する
    for (let attempt = 0; attempt < 3; attempt++) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { inviteCode: true },
      });
      if (company?.inviteCode) return company.inviteCode;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    return null;
  } catch {
    return null;
  }
}

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const inviteCode = await resolveInviteCode(session_id);

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* ロゴ */}
        <div className={styles.logoWrap} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Image
            src="/icons/icon-gori-editor.jpg"
            alt=""
            width={200}
            height={200}
            style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
          />
          <span style={{ fontSize: 15, fontWeight: 800, color: "#1F2E2A" }}>ヨミトク編集部</span>
        </div>

        {/* 完了アイコン */}
        <div className={styles.checkCircle}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M8 18L15 25L28 11" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 className={styles.title}>お支払いが完了しました</h1>
        <p className={styles.subtitle}>ご登録ありがとうございます</p>

        {/* 事業所コード */}
        {inviteCode ? (
          <div className={styles.inviteCodeBox}>
            <p className={styles.inviteCodeLabel}>事業所コード</p>
            <p className={styles.inviteCodeValue}>{inviteCode}</p>
            <p className={styles.inviteCodeNote}>LINE登録時に必要になるのでお控えください</p>
          </div>
        ) : (
          <div className={styles.inviteCodePending}>
            事業所コードの発行に少し時間がかかっています。登録完了メールにも記載していますのでご確認ください。
          </div>
        )}

        {/* ステップ */}
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepBadgeDone}>STEP 1</div>
            <div className={styles.stepContent}>
              <p className={styles.stepLabel}>ユーザー登録・お支払い</p>
              <p className={styles.stepNote}>完了しました</p>
            </div>
          </div>

          <div className={styles.stepDivider} />

          <div className={`${styles.step} ${styles.stepActive}`}>
            <div className={styles.stepBadgeActive}>STEP 2</div>
            <div className={styles.stepContent}>
              <p className={styles.stepLabel}>LINEを友だち追加する</p>
              <p className={styles.stepNote}>介護保険の最新情報をお届けします</p>
            </div>
          </div>
        </div>

        {/* LINE CTAボタン */}
        <a href={LINE_ADD_URL} target="_blank" rel="noopener noreferrer" className={styles.lineBtn}>
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none" style={{ flexShrink: 0 }}>
            <path d="M20 4C11.163 4 4 10.268 4 18c0 5.28 3.163 9.902 7.94 12.568.353.19.59.544.59.934v2.498s-.05.272-.1.436c-.147.504.184 1.016.693.877C18.3 33.786 24.58 29.07 27.67 25.5 29.17 23.65 30 21.41 30 19c0-8.282-4.477-15-10-15z" fill="white"/>
          </svg>
          LINEで友だち追加する
        </a>

        {/* 共有案内 */}
        <div className={styles.shareNote}>
          <p className={styles.shareNoteTitle}>法人内3名まで共有できます</p>
          <p className={styles.shareNoteDesc}>
            上のボタンから追加した後、他のメンバーにも同じURLと上記の事業所コードを共有してください。<br />
            LINEのチャットに事業所コードを送信すると登録されます。
          </p>
        </div>

        {/* 補足 */}
        <div className={styles.note}>
          <p>※ 登録完了のご案内をメールでお送りしました。</p>
          <p>※ 届かない場合は迷惑メールフォルダをご確認ください。</p>
        </div>

      </div>
    </div>
  );
}
