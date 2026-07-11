import { prisma } from "./prisma";
import { scrapeMhlwLatest, scrapeShingi } from "./scraper";
import { analyzeDocument, buildWeeklyDigest, AVAILABLE_TAGS } from "./anthropic";
import { pushWeeklyDigest, type DigestDoc } from "./line-message";

export interface DigestResult {
  newDocs: number;
  sentTo: number;
  batchId: string;
  errors: string[];
}

function getWeekLabel(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return `${month}/${day}号`;
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

  if (mhlwItems.status === "rejected")
    errors.push(`MHLW scrape: ${mhlwItems.reason}`);
  if (shingiItems.status === "rejected")
    errors.push(`Shingi scrape: ${shingiItems.reason}`);

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
    // No new docs — still create a batch but skip sending
    return { newDocs: 0, sentTo: 0, batchId: "", errors };
  }

  // 3. Analyze with Claude
  const analyzed: Array<{
    doc: (typeof newItems)[0];
    result: Awaited<ReturnType<typeof analyzeDocument>>;
  }> = [];

  for (const item of newItems) {
    try {
      const result = await analyzeDocument(item.title, item.rawText);
      analyzed.push({ doc: item, result });
    } catch (e) {
      errors.push(`AI analysis failed for "${item.title}": ${e}`);
    }
  }

  // 4. Save to DB
  for (const { doc, result } of analyzed) {
    await prisma.siteDocument.upsert({
      where: { url: doc.url },
      create: {
        url: doc.url,
        title: doc.title,
        source: doc.source,
        publishedAt: doc.publishedAt,
        rawText: doc.rawText,
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
  }

  // 5. Build digest message
  const digestDocs: DigestDoc[] = analyzed.map(({ doc, result }) => ({
    title: doc.title,
    summary: result.summary,
    url: doc.url,
    importance: result.importance,
    tags: result.tags,
  }));

  const digestText = await buildWeeklyDigest(digestDocs);
  const weekLabel = getWeekLabel();

  // 6. Get all active LINE recipients
  const recipients = await prisma.lineRecipient.findMany({
    where: {
      unfollowedAt: null,
      company: { status: "ACTIVE" },
    },
    include: { company: { include: { tags: { include: { tag: true } } } } },
  });

  if (recipients.length === 0) {
    return { newDocs: analyzed.length, sentTo: 0, batchId: "", errors };
  }

  // 7. Create MessageBatch (skip if already sent today)
  const todayKey = `weekly-${new Date().toISOString().slice(0, 10)}`;
  const existing = await prisma.messageBatch.findUnique({
    where: { idempotencyKey: todayKey },
  });
  if (existing) {
    return { newDocs: analyzed.length, sentTo: 0, batchId: existing.id, errors: ["Already sent today"] };
  }

  const batch = await prisma.messageBatch.create({
    data: {
      kind: "WEEKLY_DIGEST",
      title: `週刊ダイジェスト ${weekLabel}`,
      content: digestText,
      idempotencyKey: todayKey,
    },
  });

  // 8. Send LINE messages
  let sentTo = 0;
  for (const recipient of recipients) {
    const companyTags = recipient.company.tags.map((ct) => ct.tag.key);

    // Filter docs by company's tag preferences (if no tags set, send all)
    const relevantDocs =
      companyTags.length === 0
        ? digestDocs
        : digestDocs.filter((d) =>
            d.tags.some((t) => companyTags.includes(t))
          );

    if (relevantDocs.length === 0 && companyTags.length > 0) {
      await prisma.messageSend.create({
        data: {
          messageBatchId: batch.id,
          companyId: recipient.companyId,
          lineRecipientId: recipient.id,
          status: "SKIPPED_UNFOLLOWED",
        },
      });
      continue;
    }

    try {
      const messageId = await pushWeeklyDigest(
        recipient.lineUserId,
        digestText,
        relevantDocs.length > 0 ? relevantDocs : digestDocs,
        weekLabel
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

  return { newDocs: analyzed.length, sentTo, batchId: batch.id, errors };
}
