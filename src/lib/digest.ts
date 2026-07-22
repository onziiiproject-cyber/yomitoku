import { prisma } from "./prisma";
import { scrapeMhlwLatest, scrapeShingi } from "./scraper";
import { analyzeDocument, generateStructuredContent, generateDiscussionQuestion, buildWeeklyDigest, buildShingiPDFData, type StructuredContent } from "./anthropic";
import { pushWeeklyDigestCards, pushBreakingNews, pushShingiCover, pushShingiTopics, pushShingiNoMatch, type DigestDoc, type WeeklyCardDoc } from "./line-message";
import { generateShingiCoverPDF, generateShingiTopicPDF, type ShingiThemeDetail } from "./pdf-shingi";
import { put } from "@vercel/blob";

// PDFがClaudeのページ数上限（100ページ）やトークン上限を超えている場合、
// この文書は何度リトライしても永久に処理できないので判別して即座に諦める
function isDocumentTooLargeError(e: unknown): boolean {
  const message = e instanceof Error ? e.message : String(e);
  return message.includes("maximum of 100 PDF pages") || message.includes("prompt is too long");
}

// PDF取得は失敗しても黙ってテキストのみにフォールバックせず、
// リトライしてもダメならnullを返す（呼び出し側で「未処理のまま次回に持ち越す」判断に使う）
async function fetchPdfBase64(url: string, label: string): Promise<string | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; YomitokuBot/1.0)" } });
      if (res.ok) return Buffer.from(await res.arrayBuffer()).toString("base64");
      console.error(`[digest] PDF fetch non-OK (attempt ${attempt}/3, status ${res.status}) for "${label}": ${url}`);
    } catch (e) {
      console.error(`[digest] PDF fetch error (attempt ${attempt}/3) for "${label}": ${e}`);
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  return null;
}

export interface DigestResult {
  newDocs: number;
  sentTo: number;
  batchId: string;
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

// 記事処理完了直後に、ゴリ編集長名義で議論のきっかけとなる質問コメントを自動投稿する。
// 「この先どうなるか、予想してみます」パート（信憑性なしと明記された推測）への反応を聞く形にすることで、
// 事業所の内部情報を答えさせるプレッシャーを避け、気軽に書き込める問いかけにする。
// 失敗しても記事処理自体は成立済みなので、ここでは例外を握りつぶしログのみ残す。
async function postEditorComment(siteDocumentId: string, title: string, structured: StructuredContent) {
  try {
    const outlook = structured.sections.find((s) => s.kind === "outlook")?.body;
    if (!outlook) return;
    const question = await generateDiscussionQuestion(title, outlook);
    if (!question) return;
    await prisma.articleComment.create({
      data: {
        siteDocumentId,
        authorName: "ゴリ編集長",
        body: question,
        isEditorComment: true,
      },
    });
  } catch (e) {
    console.error(`Editor comment failed for ${siteDocumentId}:`, e);
  }
}

// 分科会のテーマ単位データを、既存のgenerateStructuredContent/analyzeDocumentに渡せる1本のテキストに変換
function buildShingiThemeText(detail: ShingiThemeDetail): string {
  const parts: string[] = [`概要: ${detail.overview}`];
  if (detail.revision_points?.length) {
    parts.push("改定ポイント:\n" + detail.revision_points.map((p) => `- ${p.title}: ${p.desc}`).join("\n"));
  }
  if (detail.issues?.length) {
    parts.push("論点:\n" + detail.issues.map((i) => `- ${i.desc}${i.value ? `（${i.value}）` : ""}${i.note ? ` ${i.note}` : ""}`).join("\n"));
  }
  if (detail.opinions?.length) {
    parts.push("委員の意見:\n" + detail.opinions.map((o) => `- ${o.title}: ${o.desc}`).join("\n"));
  }
  return parts.join("\n\n");
}

// 分科会1回の会合（1URL）を、buildShingiPDFDataで検出したトピック数ぶんのSiteDocumentに分割保存する。
// pendingの元レコード（doc.id）は最初に成功したテーマで再利用し、残りは新規行として作成する。
export async function processShingiSession(doc: {
  id: string;
  url: string;
  title: string;
  rawText: string;
  publishedAt: Date | null;
}): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  const pdfData = await buildShingiPDFData(doc.title, doc.rawText, doc.url);

  let count = 0;
  for (const detail of pdfData.theme_details) {
    try {
      const themeText = buildShingiThemeText(detail);
      const title = detail.name;
      const result = await analyzeDocument(title, themeText);
      const structured = await generateStructuredContent(title, themeText);

      if (count === 0) {
        await prisma.siteDocument.update({
          where: { id: doc.id },
          data: {
            themeNo: detail.no,
            title,
            rawText: themeText,
            summary: result.summary,
            tags: result.tags,
            importance: result.importance,
            decisionStatus: result.decisionStatus,
            structuredContent: structured as object,
            processedAt: new Date(),
          },
        });
        await postEditorComment(doc.id, title, structured);
      } else {
        const created = await prisma.siteDocument.create({
          data: {
            url: doc.url,
            themeNo: detail.no,
            title,
            source: "shingi",
            publishedAt: doc.publishedAt,
            rawText: themeText,
            summary: result.summary,
            tags: result.tags,
            importance: result.importance,
            decisionStatus: result.decisionStatus,
            structuredContent: structured as object,
            processedAt: new Date(),
          },
        });
        await postEditorComment(created.id, title, structured);
      }
      count++;
    } catch (e) {
      errors.push(`Shingi theme failed "${detail.name}": ${e}`);
    }
  }
  return { count, errors };
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

  const pending = await prisma.$queryRaw<{ id: string; url: string; title: string; source: string; rawText: string; publishedAt: Date | null }[]>`
    SELECT id, url, title, source, "rawText", "publishedAt"
    FROM "SiteDocument"
    WHERE summary IS NULL AND "rawText" IS NOT NULL
    ORDER BY "publishedAt" DESC NULLS LAST, "createdAt" DESC
    LIMIT ${limit}
  `;

  let processed = 0;
  for (const doc of pending) {
    try {
      if (doc.source === "shingi") {
        const { count, errors: themeErrors } = await processShingiSession(doc);
        errors.push(...themeErrors);
        if (count > 0) processed++;
        continue;
      }

      // PDF URLならダウンロードしてClaudeに渡す。取得に失敗した場合、一覧ページの
      // 断片テキストだけで要約を生成すると内容の伴わない記事になるため、
      // summaryをnullのままにしてこの記事はスキップし、次回のcron実行で再試行する
      let pdfBase64: string | undefined;
      if (doc.url.endsWith(".pdf")) {
        const fetched = await fetchPdfBase64(doc.url, doc.title.slice(0, 40));
        if (!fetched) {
          errors.push(`PDF取得失敗のためスキップ（次回に再試行）: "${doc.title.slice(0, 30)}"`);
          continue;
        }
        pdfBase64 = fetched;
      }

      let result: Awaited<ReturnType<typeof analyzeDocument>>;
      let structured: StructuredContent;
      try {
        result = await analyzeDocument(doc.title, doc.rawText ?? "", pdfBase64);
        structured = await generateStructuredContent(doc.title, doc.rawText ?? "", pdfBase64);
      } catch (e) {
        // PDFがページ数上限（100ページ）やトークン上限を超えている場合は、テキストのみに
        // フォールバックせず（=中身のない要約を防ぐため）、正直に「対象外」として処理済みにする。
        // これをしないと毎日のcronが同じ処理不能な文書を無限にリトライし続けてしまう。
        if (isDocumentTooLargeError(e)) {
          await prisma.siteDocument.update({
            where: { id: doc.id },
            data: {
              summary: "この文書はページ数・分量が多いため自動要約の対象外です。原文PDFを直接ご確認ください。",
              tags: [],
              importance: "normal",
              processedAt: new Date(),
            },
          });
          errors.push(`文書サイズ上限のため要約対象外としてマーク: "${doc.title.slice(0, 30)}"`);
          processed++;
          continue;
        }
        throw e;
      }

      await prisma.siteDocument.update({
        where: { id: doc.id },
        data: {
          summary: result.summary,
          tags: result.tags,
          importance: result.importance,
          decisionStatus: result.decisionStatus,
          structuredContent: structured as object,
          processedAt: new Date(),
        },
      });
      await postEditorComment(doc.id, doc.title, structured);
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

export async function runWeeklyDigest(opts?: { force?: boolean }): Promise<DigestResult> {
  const errors: string[] = [];
  const since = oneWeekAgo();

  // 1. 今週分の記事は日次パイプライン（scrape→process）で処理済みのはずなので、
  //    自前で再スクレイプせずDBから素直に集める（再スクレイプすると「既にDBにある」記事が
  //    毎回除外され、その週たまたま処理漏れた1件だけが「新着」扱いになるバグがあった）
  const weekDocs = await prisma.siteDocument.findMany({
    where: { publishedAt: { gte: since }, summary: { not: null } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  if (weekDocs.length === 0) {
    return { newDocs: 0, sentTo: 0, batchId: "", errors };
  }

  // 2. Build digest text
  const digestDocs: DigestDoc[] = weekDocs.map((d) => ({
    id: d.id,
    title: d.title,
    summary: d.summary ?? "",
    url: d.url,
    importance: d.importance,
    tags: d.tags as string[],
  }));

  const digestText = await buildWeeklyDigest(digestDocs);
  const weekLabel = getWeekLabel();

  // 3. Skip if already sent today（force=true で上書き可）
  const todayKey = `weekly-${new Date().toISOString().slice(0, 10)}`;
  const existing = await prisma.messageBatch.findUnique({ where: { idempotencyKey: todayKey } });
  if (existing && !opts?.force) {
    return { newDocs: weekDocs.length, sentTo: 0, batchId: existing.id, errors: [...errors, "Already sent today"] };
  }

  // 4. Create MessageBatch
  const batch = await prisma.messageBatch.create({
    data: {
      kind: "WEEKLY_DIGEST",
      title: `週刊ダイジェスト ${weekLabel}`,
      content: digestText,
      idempotencyKey: todayKey,
    },
  });

  // 5. Link documents to batch
  await prisma.batchDocument.createMany({
    data: weekDocs.map((d) => ({
      messageBatchId: batch.id,
      siteDocumentId: d.id,
    })),
    skipDuplicates: true,
  });

  // 6. Send LINE messages（タグでパーソナライズしたカードカルーセル）
  const recipients = await prisma.lineRecipient.findMany({
    where: {
      unfollowedAt: null,
      company: { status: "ACTIVE" },
    },
    include: { user: { include: { tags: { include: { tag: true } } } } },
  });

  if (recipients.length === 0) {
    return { newDocs: weekDocs.length, sentTo: 0, batchId: batch.id, errors };
  }

  const cardDocs: WeeklyCardDoc[] = weekDocs.map((d) => {
    const sc = d.structuredContent as unknown as StructuredContent | null;
    return {
      id: d.id,
      title: d.title,
      hookTitle: sc?.hookTitle ?? null,
      source: d.source,
      tags: d.tags as string[],
      importanceStars: sc?.importanceStars ?? null,
      urgencyStars: sc?.urgencyStars ?? null,
      isNew: new Date().getTime() - new Date(d.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000,
      decisionStatus: d.decisionStatus,
    };
  });

  let sentTo = 0;
  for (const recipient of recipients) {
    const recipientTagKeys = recipient.user?.tags.map((ut) => ut.tag.key) ?? [];
    // タグ未設定なら全件、設定していて0件ヒットならその旨のカードをpushWeeklyDigestCards側で表示する
    const cardsToSend =
      recipientTagKeys.length === 0
        ? cardDocs
        : cardDocs.filter((c) => c.tags.some((t) => recipientTagKeys.includes(t)));

    try {
      const messageId = await pushWeeklyDigestCards(
        recipient.lineUserId,
        weekLabel,
        weekDocs.length,
        digestText,
        cardsToSend,
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

  return { newDocs: weekDocs.length, sentTo, batchId: batch.id, errors };
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
        const fetched = await fetchPdfBase64(item.url, item.title.slice(0, 40));
        if (!fetched) {
          errors.push(`PDF取得失敗のためスキップ（次回に再試行）: "${item.title.slice(0, 30)}"`);
          continue;
        }
        pdfBase64 = fetched;
      }
      const result = await analyzeDocument(item.title, item.rawText, pdfBase64);
      const structured = await generateStructuredContent(item.title, item.rawText, pdfBase64);
      const saved = await prisma.siteDocument.upsert({
        where: { url_themeNo: { url: item.url, themeNo: 0 } },
        create: {
          url: item.url,
          title: item.title,
          source: item.source,
          publishedAt: item.publishedAt,
          rawText: item.rawText,
          summary: result.summary,
          tags: result.tags,
          importance: result.importance,
          decisionStatus: result.decisionStatus,
          structuredContent: structured as object,
          processedAt: new Date(),
        },
        update: {
          summary: result.summary,
          tags: result.tags,
          importance: result.importance,
          decisionStatus: result.decisionStatus,
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
    include: { user: { include: { tags: { include: { tag: true } } } } },
  });

  if (recipients.length === 0) {
    return { checked: shingiItems.length, newDocs: analyzed.length, sentTo: 0, errors };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yomitoku-base.com";

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

          // タグマッチング（個人単位のUserTag。週刊ダイジェストと同じ基準に揃える）
          const userTags = recipient.user?.tags.map(ut => ut.tag.key) ?? [];
          if (userTags.length > 0) {
            const matchingThemes = pdfData.theme_details.filter(detail =>
              detail.related_roles.some(role => userTags.includes(role))
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
