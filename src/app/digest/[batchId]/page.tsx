import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "週刊ダイジェスト | ヨミトク" };

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function sourceLabel(source: string) {
  return source === "shingi" ? "介護給付費分科会" : "介護保険最新情報";
}

function sourceIcon(source: string) {
  return source === "shingi" ? "🏛️" : "📋";
}

export default async function DigestPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;

  const batch = await prisma.messageBatch.findUnique({
    where: { id: batchId },
    include: {
      documents: {
        include: { siteDocument: true },
      },
    },
  });

  if (!batch) return notFound();

  const docs = batch.documents
    .map((bd) => bd.siteDocument)
    .sort((a, b) => {
      if (a.importance === "high" && b.importance !== "high") return -1;
      if (b.importance === "high" && a.importance !== "high") return 1;
      return 0;
    });

  const highDocs = docs.filter((d) => d.importance === "high");
  const normalDocs = docs.filter((d) => d.importance !== "high");

  const batchDate = formatDate(batch.createdAt);

  return (
    <div className={styles.page}>
      {/* Cover */}
      <div className={styles.cover}>
        <div className={styles.coverIcon}>📋</div>
        <p className={styles.coverLabel}>介護保険最新情報</p>
        <h1 className={styles.coverTitle}>{batch.title}</h1>
        <p className={styles.coverDate}>{batchDate}</p>
        <div className={styles.coverBadge}>
          今回は {docs.length} 件の通知をまとめました
        </div>
        <p className={styles.disclaimer}>
          ※ 厚生労働省「介護保険最新情報」をもとにしたAI自動要約です。正式な内容は原文でご確認ください。
        </p>
      </div>

      {/* Digest summary */}
      {batch.content && (
        <div className={styles.summary}>
          <p>{batch.content}</p>
        </div>
      )}

      {/* High priority docs */}
      {highDocs.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>⚠️</span>重要な通知
          </h2>
          {highDocs.map((doc) => (
            <div key={doc.id} className={`${styles.card} ${styles.cardHigh}`}>
              <div className={styles.cardHeader}>
                <span className={styles.sourceIcon}>{sourceIcon(doc.source)}</span>
                <h3 className={styles.cardTitle}>{doc.title}</h3>
              </div>
              {doc.summary && (
                <p className={styles.cardSummary}>{doc.summary}</p>
              )}
              <div className={styles.cardMeta}>
                <div className={styles.tags}>
                  {doc.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <span className={styles.metaDate}>{formatDate(doc.publishedAt)}</span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                >
                  資料を見る →
                </a>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Normal docs */}
      {normalDocs.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>📋</span>今週の通知一覧
          </h2>
          {normalDocs.map((doc) => (
            <div key={doc.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.sourceIcon}>{sourceIcon(doc.source)}</span>
                <h3 className={styles.cardTitle}>{doc.title}</h3>
              </div>
              {doc.summary && (
                <p className={styles.cardSummary}>{doc.summary}</p>
              )}
              <div className={styles.cardMeta}>
                <div className={styles.tags}>
                  {doc.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <span className={styles.metaDate}>{formatDate(doc.publishedAt)}</span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                >
                  資料を見る →
                </a>
              </div>
            </div>
          ))}
        </section>
      )}

      <footer className={styles.footer}>
        <p>ヨミトク | 介護保険最新情報</p>
        <p className={styles.footerNote}>
          情報は{batchDate}時点のものです。最新情報は原文でご確認ください。
        </p>
      </footer>
    </div>
  );
}
