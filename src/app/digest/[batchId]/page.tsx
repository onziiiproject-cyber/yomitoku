import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { StructuredContent } from "@/lib/anthropic";
import BaseHeader from "../../base/_components/BaseHeader";
import GuestHeader from "../../base/_components/GuestHeader";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "週刊ヨミトク | ヨミトク編集部" };

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

const SOURCE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  mhlw_latest: { label: "介護保険最新情報", color: "#0D686E", bg: "#E8F5F1" },
  shingi: { label: "分科会かんたん解説", color: "#B45309", bg: "#FEF3C7" },
};

function starText(stars: number | null | undefined): string {
  if (!stars) return "";
  return "★".repeat(stars) + "☆".repeat(5 - stars);
}

export default async function DigestPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const [session, { batchId }] = await Promise.all([getSession(), params]);

  const batch = await prisma.messageBatch.findUnique({
    where: { id: batchId },
    include: {
      documents: {
        include: { siteDocument: true },
      },
    },
  });

  if (!batch) return notFound();

  const docs = batch.documents.map((bd) => bd.siteDocument);
  const batchDate = formatDate(batch.createdAt);

  return (
    <div className={styles.page}>
      {session ? <BaseHeader companyName={session.companyName} /> : <GuestHeader />}

      {/* Cover */}
      <div className={styles.cover}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/covers/digest-bg.png" alt="" className={styles.coverBgImg} />
        <div className={styles.coverText}>
          <div className={styles.coverIcon}>📋</div>
          <p className={styles.coverLabel}>介護保険最新情報</p>
          <h1 className={styles.coverTitle}>{batch.title}</h1>
          <p className={styles.coverDate}>{batchDate}</p>
          <div className={styles.coverBadge}>
            今回は {docs.length} 件のトピックスをまとめました
          </div>
          <p className={styles.disclaimer}>
            ※ 厚生労働省「介護保険最新情報」をもとにしたAI自動要約です。正式な内容は原文でご確認ください。
          </p>
        </div>
      </div>

      {/* Digest summary */}
      {batch.content && (
        <div className={styles.summary}>
          <p>{batch.content}</p>
        </div>
      )}

      {/* Card thumbnails */}
      {docs.length > 0 && (
        <div className={styles.cardGrid}>
          {docs.map((doc) => {
            const sc = doc.structuredContent as unknown as StructuredContent | null;
            const src = SOURCE_BADGE[doc.source] ?? { label: doc.source, color: "#555", bg: "#F3F4F6" };
            const displayTitle = sc?.hookTitle || doc.title;
            const isNew = new Date().getTime() - new Date(doc.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;

            return (
              <Link key={doc.id} href={`/base/articles/${doc.id}`} className={styles.thumbCard}>
                <div className={styles.thumbBadgeRow}>
                  {isNew && <span className={styles.thumbBadgeNew}>新着</span>}
                  <span className={styles.thumbBadgeSource} style={{ color: src.color, background: src.bg }}>
                    {src.label}
                  </span>
                </div>
                <h3 className={styles.thumbTitle}>{displayTitle}</h3>
                {(sc?.importanceStars || sc?.urgencyStars) && (
                  <div className={styles.thumbStars}>
                    {sc?.importanceStars && <span>重要度 {starText(sc.importanceStars)}</span>}
                    {sc?.urgencyStars && <span>緊急度 {starText(sc.urgencyStars)}</span>}
                  </div>
                )}
                {doc.tags.length > 0 && (
                  <div className={styles.thumbTags}>
                    {doc.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className={styles.thumbMascotBadge} style={{ border: `2px solid ${src.color}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/mascot/gori-base-face.png" alt="" className={styles.thumbMascot} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <footer className={styles.footer}>
        <p>ヨミトク編集部 | 介護保険最新情報</p>
        <p className={styles.footerNote}>
          情報は{batchDate}時点のものです。最新情報は原文でご確認ください。
        </p>
      </footer>
    </div>
  );
}
