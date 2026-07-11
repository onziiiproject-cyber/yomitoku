import { prisma } from "./prisma";
import { scrapeMhlwLatest, scrapeShingi } from "./scraper";
import { analyzeDocument, buildWeeklyDigest } from "./anthropic";
import { pushWeeklyDigest, type DigestDoc } from "./line-message";

export interface DigestResult {
  newDocs: number;
  sentTo: number;
  batchId: string;
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
    return { newDocs: 0, sentTo: 0, batchId: "", errors };
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
    return { newDocs: 0, sentTo: 0, batchId: "", errors };
  }

  // 4. Build digest text
  const digestDocs: DigestDoc[] = analyzed.map(({ doc, result }) => ({
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
    return { newDocs: analyzed.length, sentTo: 0, batchId: existing.id, errors: [...errors, "Already sent today"] };
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

  // 8. Get active LINE recipients
  const recipients = await prisma.lineRecipient.findMany({
    where: {
      unfollowedAt: null,
      company: { status: "ACTIVE" },
    },
    include: { company: { include: { tags: { include: { tag: true } } } } },
  });

  if (recipients.length === 0) {
    return { newDocs: analyzed.length, sentTo: 0, batchId: batch.id, errors };
  }

  // 9. Send LINE messages
  let sentTo = 0;
  for (const recipient of recipients) {
    const companyTags = recipient.company.tags.map((ct) => ct.tag.key);
    const relevantDocs =
      companyTags.length === 0
        ? digestDocs
        : digestDocs.filter((d) => d.tags.some((t) => companyTags.includes(t)));

    const docsToSend = relevantDocs.length > 0 ? relevantDocs : digestDocs;

    try {
      const messageId = await pushWeeklyDigest(
        recipient.lineUserId,
        digestText,
        docsToSend,
        weekLabel,
        batch.id
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
