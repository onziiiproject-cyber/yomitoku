import { prisma } from "./prisma";
import { scrapeMhlwLatest, scrapeShingi } from "./scraper";
import { analyzeDocument, buildWeeklyDigest, buildPDFAIComment, buildShingiPDFData } from "./anthropic";
import { pushWeeklyDigest, pushBreakingNews, pushShingiCover, pushShingiTopics, pushShingiNoMatch, type DigestDoc } from "./line-message";
import { generateDigestPDF, type PDFDigestDoc } from "./pdf-digest";
import { generateShingiCoverPDF, generateShingiTopicPDF } from "./pdf-shingi";
import { put } from "@vercel/blob";

export interface DigestResult {
  newDocs: number;
  sentTo: number;
  batchId: string;
  pdfUrl: string | null;
  errors: string[];
}

function getWeekLabel(): string {
  const now = new Date();
  return `${now.getMonth() + 1}/${now.getDate()}号`;
}

function oneWeekAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

export async function runWeeklyDigest(): Promise<DigestResult> {
  const errors: string[] = [];
  const since = oneWeekAgo();

  // 1. Scrape
  const [mhlwItems, shingiItems] = await Promise.allSettled([
    scrapeMhlwLatest(since),
    scrapeShingi(since),
  ]);

  const allItems = [
    ...(mhlwItems.status === "fulfilled" ? mhlwItems.value : []),
    ...(shingiItems.status === "fulfilled" ? shingiItems.value : []),
  ];

  if (mhlwItems.status === "rejected") errors.push(`MHLW scrape: ${mhlwItems.reason}`);
  if (shingiItems.status === "rejected") errors.push(`Shingi scrape: ${shingiItems.reason}`);

  // 2. Deduplicate against DB
  const existingUrls = new Set(
    (
      await prisma.siteDocument.findMany({
        where: { url: { in: allItems.map((i) => i.url) } },
        select: { url: true },
      })
    ).map((d) => d.url)
  );

  const newItems = allItems.filter((i) => !existingUrls.has(i.url));
  if (newItems.length === 0) {
    return { newDocs: 0, sentTo: 0, batchId: "", pdfUrl: null, errors };
  }

  // 3. Analyze with Claude
  const analyzed: Array<{
    doc: (typeof newItems)[0];
    result: Awaited<ReturnType<typeof analyzeDocument>>;
    savedId: string;
  }> = [];

  for (const item of newItems) {
    try {
      const result = await analyzeDocument(item.title, item.rawText);
      const saved = await prisma.siteDocument.upsert({
        where: { url: item.url },
        create: {
          url: item.url,
          title: item.title,
          source: item.source,
          publishedAt: item.publishedAt,
          rawText: item.rawText,
          summary: result.summary,
          tags: result.tags,
          importance: result.importance,
          processedAt: new Date(),
        },
        update: {
          summary: result.summary,
          tags: result.tags,
          importance: result.importance,
          processedAt: new Date(),
        },
      });
      analyzed.push({ doc: item, result, savedId: saved.id });
    } catch (e) {
      errors.push(`Failed "${item.title}": ${e}`);
    }
  }

  if (analyzed.length === 0) {
    return { newDocs: 0, sentTo: 0, batchId: "", pdfUrl: null, errors };
  }

  // 4. Build digest text
  const digestDocs: DigestDoc[] = analyzed.map(({ doc, result, savedId }) => ({
    id: savedId,
    title: doc.title,
    summary: result.summary,
    url: doc.url,
    importance: result.importance,
    tags: result.tags,
  }));

  const digestText = await buildWeeklyDigest(digestDocs);
  const weekLabel = getWeekLabel();

  // 5. Skip if already sent today
  const todayKey = `weekly-${new Date().toISOString().slice(0, 10)}`;
  const existing = await prisma.messageBatch.findUnique({ where: { idempotencyKey: todayKey } });
  if (existing) {
    return { newDocs: analyzed.length, sentTo: 0, batchId: existing.id, pdfUrl: null, errors: [...errors, "Already sent today"] };
  }

  // 6. Create MessageBatch
  const batch = await prisma.messageBatch.create({
    data: {
      kind: "WEEKLY_DIGEST",
      title: `週刊ダイジェスト ${weekLabel}`,
      content: digestText,
      idempotencyKey: todayKey,
    },
  });

  // 7. Link documents to batch
  await prisma.batchDocument.createMany({
    data: analyzed.map(({ savedId }) => ({
      messageBatchId: batch.id,
      siteDocumentId: savedId,
    })),
    skipDuplicates: true,
  });

  // 8. Generate PDF → Vercel Blob
  let pdfUrl: string | null = null;
  try {
    const pdfDocs: PDFDigestDoc[] = analyzed.map(({ doc, result, savedId }) => ({
      id: savedId,
      title: doc.title,
      summary: result.summary ?? "",
      url: doc.url,
      importance: result.importance,
      tags: result.tags,
      publishedAt: doc.publishedAt ?? null,
      source: doc.source,
    }));

    const aiComment = await buildPDFAIComment(
      pdfDocs.map(d => ({ title: d.title, summary: d.summary, tags: d.tags, importance: d.importance }))
    );

    const now = new Date();
    const fmtJp = (d: Date) => `令和${d.getFullYear() - 2018}年${d.getMonth() + 1}月${d.getDate()}日`;

    const pdfBuffer = await generateDigestPDF(
      pdfDocs,
      weekLabel,
      { from: fmtJp(oneWeekAgo()), to: fmtJp(now) },
      aiComment
    );

    const filename = `digest/weekly-${now.toISOString().slice(0, 10)}.pdf`;
    const blob = await put(filename, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
    });
    pdfUrl = blob.url;
  } catch (e) {
    errors.push(`PDF generation failed: ${e}`);
  }

  // 9. Skip if already sent today
  const recipients = await prisma.lineRecipient.findMany({
    where: {
      unfollowedAt: null,
      company: { status: "ACTIVE" },
    },
    include: { recipientTags: { include: { tag: true } } },
  });

  if (recipients.length === 0) {
    return { newDocs: analyzed.length, sentTo: 0, batchId: batch.id, pdfUrl, errors };
  }

  // 9. Send LINE messages
  let sentTo = 0;
  for (const recipient of recipients) {
    const recipientTagKeys = recipient.recipientTags.map((rt) => rt.tag.key);
    const relevantDocs =
      recipientTagKeys.length === 0
        ? digestDocs
        : digestDocs.filter((d) => d.tags.some((t) => recipientTagKeys.includes(t)));

    const docsToSend = relevantDocs.length > 0 ? relevantDocs : digestDocs;

    try {
      const messageId = await pushWeeklyDigest(
        recipient.lineUserId,
        digestText,
        docsToSend,
        weekLabel,
        batch.id,
        pdfUrl
      );
      await prisma.messageSend.create({
        data: {
          messageBatchId: batch.id,
          companyId: recipient.companyId,
          lineRecipientId: recipient.id,
          status: "SENT",
          lineResponseId: messageId,
          sentAt: new Date(),
        },
      });
      sentTo++;
    } catch (e) {
      errors.push(`LINE push failed for ${recipient.lineUserId}: ${e}`);
      await prisma.messageSend.create({
        data: {
          messageBatchId: batch.id,
          companyId: recipient.companyId,
          lineRecipientId: recipient.id,
          status: "FAILED",
          error: String(e),
        },
      });
    }
  }

  return { newDocs: analyzed.length, sentTo, batchId: batch.id, pdfUrl, errors };
}

export interface BreakingNewsResult {
  checked: number;
  newDocs: number;
  sentTo: number;
  errors: string[];
}

export async function runBreakingNewsCheck(): Promise<BreakingNewsResult> {
  const errors: string[] = [];

  let shingiItems: Awaited<ReturnType<typeof scrapeShingi>> = [];
  try {
    shingiItems = await scrapeShingi();
  } catch (e) {
    errors.push(`Shingi scrape failed: ${e}`);
    return { checked: 0, newDocs: 0, sentTo: 0, errors };
  }

  // Deduplicate against DB
  const existingUrls = new Set(
    (
      await prisma.siteDocument.findMany({
        where: { url: { in: shingiItems.map((i) => i.url) } },
        select: { url: true },
      })
    ).map((d) => d.url)
  );

  const newItems = shingiItems.filter((i) => !existingUrls.has(i.url));
  if (newItems.length === 0) {
    return { checked: shingiItems.length, newDocs: 0, sentTo: 0, errors };
  }

  // Analyze + save
  const analyzed: Array<{ doc: (typeof newItems)[0]; result: Awaited<ReturnType<typeof analyzeDocument>>; savedId: string }> = [];
  for (const item of newItems) {
    try {
      const result = await analyzeDocument(item.title, item.rawText);
      const saved = await prisma.siteDocument.upsert({
        where: { url: item.url },
        create: {
          url: item.url,
          title: item.title,
          source: item.source,
          publishedAt: item.publishedAt,
          rawText: item.rawText,
          summary: result.summary,
          tags: result.tags,
          importance: result.importance,
          processedAt: new Date(),
        },
        update: {
          summary: result.summary,
          tags: result.tags,
          importance: result.importance,
          processedAt: new Date(),
        },
      });
      analyzed.push({ doc: item, result, savedId: saved.id });
    } catch (e) {
      errors.push(`Analysis failed for "${item.title}": ${e}`);
    }
  }

  if (analyzed.length === 0) {
    return { checked: shingiItems.length, newDocs: 0, sentTo: 0, errors };
  }

  const recipients = await prisma.lineRecipient.findMany({
    where: { unfollowedAt: null, company: { status: "ACTIVE" } },
    include: { company: { include: { tags: { include: { tag: true } } } } },
  });

  if (recipients.length === 0) {
    return { checked: shingiItems.length, newDocs: analyzed.length, sentTo: 0, errors };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yomitoru-xi.vercel.app";

  let sentTo = 0;
  for (const { doc, savedId } of analyzed) {
    // PDF生成を試みる（失敗してもテキスト通知にフォールバック）
    let coverPdfUrl: string | null = null;
    let topicPdfUrls: Record<number, string> = {};
    let pdfData: Awaited<ReturnType<typeof buildShingiPDFData>> | null = null;

    try {
      pdfData = await buildShingiPDFData(doc.title, doc.rawText, doc.url);

      const coverBuffer = await generateShingiCoverPDF(pdfData);
      const coverBlob = await put(
        `shingi/session-${pdfData.meta.session_no}/cover.pdf`,
        coverBuffer,
        { access: "public", contentType: "application/pdf", addRandomSuffix: false }
      );
      coverPdfUrl = coverBlob.url;

      for (const theme of pdfData.themes) {
        try {
          const topicBuffer = await generateShingiTopicPDF(pdfData, theme.no);
          const topicBlob = await put(
            `shingi/session-${pdfData.meta.session_no}/topic-${theme.no}.pdf`,
            topicBuffer,
            { access: "public", contentType: "application/pdf", addRandomSuffix: false }
          );
          topicPdfUrls[theme.no] = topicBlob.url;
        } catch (e) {
          errors.push(`Topic PDF failed (theme ${theme.no}): ${e}`);
        }
      }
    } catch (e) {
      errors.push(`Shingi PDF generation failed: ${e}`);
    }

    for (const recipient of recipients) {
      try {
        if (pdfData && coverPdfUrl) {
          // 表紙PDFを全員に送信
          await pushShingiCover(
            recipient.lineUserId,
            pdfData.meta.session_no,
            pdfData.meta.council_name.replace("社会保障審議会 ", ""),
            pdfData.meta.date,
            pdfData.meta.feature_label,
            pdfData.themes.map(t => t.name),
            coverPdfUrl
          );

          // タグマッチング
          const companyTags = recipient.company.tags.map(ct => ct.tag.key);
          if (companyTags.length > 0) {
            const matchingThemes = pdfData.theme_details.filter(detail =>
              detail.related_roles.some(role => companyTags.includes(role))
            );

            if (matchingThemes.length > 0) {
              const availableTopics = matchingThemes.filter(t => topicPdfUrls[t.no]);
              if (availableTopics.length > 0) {
                await pushShingiTopics(
                  recipient.lineUserId,
                  pdfData.meta.session_no,
                  availableTopics.map(t => ({ no: t.no, name: t.name })),
                  topicPdfUrls
                );
              }
            } else {
              // タグはあるが今回はマッチなし
              await pushShingiNoMatch(recipient.lineUserId, pdfData.meta.session_no, baseUrl);
            }
          }
        } else {
          // PDF生成失敗時はテキスト通知にフォールバック
          const digestDoc: DigestDoc = {
            id: savedId,
            title: doc.title,
            summary: doc.rawText.slice(0, 200),
            url: doc.url,
            importance: "high",
            tags: [],
          };
          await pushBreakingNews(recipient.lineUserId, digestDoc);
        }
        sentTo++;
      } catch (e) {
        errors.push(`Push failed for ${recipient.lineUserId}: ${e}`);
      }
    }
  }

  return { checked: shingiItems.length, newDocs: analyzed.length, sentTo, errors };
}
