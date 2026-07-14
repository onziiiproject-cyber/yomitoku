import { prisma } from "./prisma";
import { scrapeMhlwLatest, scrapeShingi } from "./scraper";
import { analyzeDocument, generateStructuredContent, buildWeeklyDigest, buildPDFAIComment, buildShingiPDFData } from "./anthropic";
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

export interface ScrapeResult {
  saved: number;
  skipped: number;
  errors: string[];
}

export interface ProcessResult {
  processed: number;
  remaining: number;
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

// Phase 1: スクレイプしてDBに保存（Claudeなし）
export async function runScrapeAndSave(since?: Date): Promise<ScrapeResult> {
  const errors: string[] = [];
  const cutoff = since ?? oneWeekAgo();

  const [mhlwResult, shingiResult] = await Promise.allSettled([
    scrapeMhlwLatest(cutoff),
    scrapeShingi(cutoff),
  ]);

  const allItems = [
    ...(mhlwResult.status === "fulfilled" ? mhlwResult.value : []),
    ...(shingiResult.status === "fulfilled" ? shingiResult.value : []),
  ];
  if (mhlwResult.status === "rejected") errors.push(`MHLW scrape: ${mhlwResult.reason}`);
  if (shingiResult.status === "rejected") errors.push(`Shingi scrape: ${shingiResult.reason}`);

  // URLがすでにDBにある記事はスキップ（処理済み・未処理問わず）
  const existingUrls = new Set(
    (await prisma.siteDocument.findMany({
      where: { url: { in: allItems.map(i => i.url) } },
      select: { url: true },
    })).map(d => d.url)
  );

  const newItems = allItems.filter(i => !existingUrls.has(i.url));
  let saved = 0;

  for (const item of newItems) {
    try {
      await prisma.siteDocument.create({
        data: {
          url: item.url,
          title: item.title,
          source: item.source,
          publishedAt: item.publishedAt,
          rawText: item.rawText,
          // summary / tags / importance / structuredContent は Phase 2 で埋める
        },
      });
      saved++;
    } catch (e) {
      errors.push(`Save failed "${item.title.slice(0, 30)}": ${e}`);
    }
  }

  return { saved, skipped: existingUrls.size, errors };
}

// Phase 2: summary=null の記事を1件ずつClaude処理
export async function runProcessPending(limit = 1): Promise<ProcessResult> {
  const errors: string[] = [];

  const pending = await prisma.$queryRaw<{ id: string; url: string; title: string; rawText: string }[]>`
    SELECT id, url, title, "rawText"
    FROM "SiteDocument"
    WHERE summary IS NULL AND "rawText" IS NOT NULL
    ORDER BY "publishedAt" DESC NULLS LAST, "createdAt" DESC
    LIMIT ${limit}
  `;

  let processed = 0;
  for (const doc of pending) {
    try {
      // PDF URLならダウンロードしてClaudeに渡す
      let pdfBase64: string | undefined;
      if (doc.url.endsWith(".pdf")) {
        try {
          const pdfRes = await fetch(doc.url, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; YomitokuBot/1.0)" },
          });
          if (pdfRes.ok) pdfBase64 = Buffer.from(await pdfRes.arrayBuffer()).toString("base64");
        } catch { /* テキストのみでフォールバック */ }
      }

      const result = await analyzeDocument(doc.title, doc.rawText ?? "", pdfBase64);
      const structured = await generateStructuredContent(doc.title, doc.rawText ?? "", pdfBase64);

      await prisma.siteDocument.update({
        where: { id: doc.id },
        data: {
          summary: result.summary,
          tags: result.tags,
          importance: result.importance,
          structuredContent: structured as object,
          processedAt: new Date(),
        },
      });
      processed++;
    } catch (e) {
      errors.push(`Process failed "${doc.title.slice(0, 30)}": ${e}`);
    }
  }

  const remainingResult = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM "SiteDocument" WHERE summary IS NULL AND "rawText" IS NOT NULL
  `;
  const remaining = Number(remainingResult[0]?.count ?? 0);

  return { processed, remaining, errors };
}

export async function runWeeklyDigest(opts?: { force?: boolean; scrapeOnly?: boolean; limit?: number }): Promise<DigestResult> {
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

  // 2. Deduplicate against DB（日付あり記事のみスキップ、日付なしは再処理）
  const existingUrls = new Set(
    (
      await prisma.siteDocument.findMany({
        where: { url: { in: allItems.map((i) => i.url) }, publishedAt: { not: null } },
        select: { url: true },
      })
    ).map((d) => d.url)
  );

  const allNewItems = allItems.filter((i) => !existingUrls.has(i.url));
  const newItems = opts?.limit ? allNewItems.slice(0, opts.limit) : allNewItems;
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
      const result = await analyzeDocument(item.title, item.rawText, item.pdfBase64);
      const structured = await generateStructuredContent(item.title, item.rawText, item.pdfBase64);
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
          structuredContent: structured as object,
          processedAt: new Date(),
        },
        update: {
          title: item.title,
          publishedAt: item.publishedAt,
          summary: result.summary,
          tags: result.tags,
          importance: result.importance,
          structuredContent: structured as object,
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

  // scrapeOnly: 記事保存のみ、LINE送信しない
  if (opts?.scrapeOnly) {
    return { newDocs: analyzed.length, sentTo: 0, batchId: "", pdfUrl: null, errors };
  }

  // 5. Skip if already sent today（force=true で上書き可）
  const todayKey = `weekly-${new Date().toISOString().slice(0, 10)}`;
  const existing = await prisma.messageBatch.findUnique({ where: { idempotencyKey: todayKey } });
  if (existing && !opts?.force) {
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
      let pdfBase64 = item.pdfBase64;
      if (!pdfBase64 && item.url.endsWith(".pdf")) {
        try {
          const pdfRes = await fetch(item.url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; YomitokuBot/1.0)" } });
          if (pdfRes.ok) pdfBase64 = Buffer.from(await pdfRes.arrayBuffer()).toString("base64");
        } catch { /* fallback to title-only */ }
      }
      const result = await analyzeDocument(item.title, item.rawText, pdfBase64);
      const structured = await generateStructuredContent(item.title, item.rawText, pdfBase64);
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
          structuredContent: structured as object,
          processedAt: new Date(),
        },
        update: {
          summary: result.summary,
          tags: result.tags,
          importance: result.importance,
          structuredContent: structured as object,
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
