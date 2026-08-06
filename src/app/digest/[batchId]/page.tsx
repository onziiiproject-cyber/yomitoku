import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { StructuredContent } from "@/lib/anthropic";
import BaseHeader from "../../base/_components/BaseHeader";
import GuestHeader from "../../base/_components/GuestHeader";
import ArticleAudioBriefingCard from "../../base/_components/ArticleAudioBriefingCard";
import PodcastEpisodeCard from "../../base/_components/PodcastEpisodeCard";
import styles from "./page.module.css";

const SITE_URL = "https://yomitoku-base.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ batchId: string }>;
}): Promise<Metadata> {
  const { batchId } = await params;
  const batch = await prisma.messageBatch.findUnique({ where: { id: batchId }, select: { title: true } });

  if (!batch) return { title: "週刊ヨミトク | ヨミトク編集部" };

  const title = `${batch.title} | ヨミトク編集部`;
  const url = `${SITE_URL}/digest/${batchId}`;

  return {
    title,
    alternates: { canonical: url },
    openGraph: { title: batch.title, url, siteName: "ヨミトク編集部", locale: "ja_JP", type: "website" },
  };
}

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

  const [prevBatch, nextBatch] = await Promise.all([
    prisma.messageBatch.findFirst({
      where: { kind: "WEEKLY_DIGEST", createdAt: { lt: batch.createdAt } },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
    prisma.messageBatch.findFirst({
      where: { kind: "WEEKLY_DIGEST", createdAt: { gt: batch.createdAt } },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  // 議事録ラジオ・放送室はどちらもBatchDocumentに紐づかない（記事本体の公開日ではなく
  // 音声自体の公開日でその週の号に属するため）。送信時と同じ「直近7日」の窓を
  // このバッチの作成日基準で再現する。
  const since = new Date(batch.createdAt.getTime() - 7 * 24 * 60 * 60 * 1000);
  const audioBriefings = await prisma.articleAudioBriefing.findMany({
    where: { status: "PUBLISHED", publishedAt: { gte: since, lte: batch.createdAt } },
    orderBy: { publishedAt: "desc" },
    select: { id: true, siteDocumentId: true, title: true, description: true, audioUrl: true, durationSec: true, heroImageUrl: true },
  });

  // 通し番号を出すため、公開済み全エピソードを古い順に取得してから対象週分だけ絞り込む
  const allEpisodes = await prisma.podcastEpisode.findMany({
    where: { status: "PUBLISHED", audioUrl: { not: null }, durationSec: { not: null } },
    orderBy: { publishedAt: "asc" },
  });
  const podcastEpisodes = allEpisodes
    .map((ep, i) => ({ ep, episodeNo: i + 1 }))
    .filter(({ ep }) => ep.publishedAt! >= since && ep.publishedAt! <= batch.createdAt)
    .reverse();

  const docs = batch.documents.map((bd) => bd.siteDocument);
  const batchDate = formatDate(batch.createdAt);

  return (
    <div className={styles.page}>
      {session ? <BaseHeader companyName={session.companyName} /> : <GuestHeader />}

      {/* 前後のダイジェストへの導線 */}
      <div className={styles.digestNav}>
        {prevBatch ? (
          <Link href={`/digest/${prevBatch.id}`} className={styles.digestNavLink}>
            ← 前のダイジェスト
          </Link>
        ) : (
          <span className={`${styles.digestNavLink} ${styles.digestNavDisabled}`}>← 前のダイジェスト</span>
        )}
        {nextBatch ? (
          <Link href={`/digest/${nextBatch.id}`} className={styles.digestNavLink}>
            次のダイジェスト →
          </Link>
        ) : (
          <span className={`${styles.digestNavLink} ${styles.digestNavDisabled}`}>次のダイジェスト →</span>
        )}
      </div>

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
            今回は {docs.length + audioBriefings.length + podcastEpisodes.length} 件のトピックスをまとめました
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

      {/* 議事録ラジオ（BatchDocumentには紐づかないため別枠） */}
      {audioBriefings.length > 0 && (
        <div className={styles.audioSection}>
          <h2 className={styles.audioSectionTitle}>🎙 分科会議事録ラジオ</h2>
          {audioBriefings.map((b) => (
            <ArticleAudioBriefingCard
              key={b.id}
              title={b.title}
              description={b.description}
              audioUrl={b.audioUrl!}
              heroImageUrl={b.heroImageUrl}
              articleId={b.siteDocumentId}
            />
          ))}
        </div>
      )}

      {/* ヨミトク放送室（同じくBatchDocumentには紐づかない） */}
      {podcastEpisodes.length > 0 && (
        <div className={styles.audioSection}>
          <h2 className={styles.audioSectionTitle}>🎙 ヨミトク放送室</h2>
          {podcastEpisodes.map(({ ep, episodeNo }) => (
            <PodcastEpisodeCard
              key={ep.id}
              episodeNo={episodeNo}
              title={ep.title}
              description={ep.description}
              audioUrl={ep.audioUrl!}
              durationSec={ep.durationSec!}
            />
          ))}
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
