import { prisma } from "./prisma";
import { scrapeMhlwLatest, scrapeShingi, extractShingiMaterialPdfLinks, extractShingiMinutesPdfUrl, findShingiMinutesLinks } from "./scraper";
import { analyzeDocument, generateStructuredContent, generateDiscussionQuestion, extractPublishedDate, buildWeeklyDigest, buildShingiPDFData, type StructuredContent, type AnalysisResult } from "./anthropic";
import { pushWeeklyDigestCards, pushBreakingNews, pushShingiCover, pushShingiTopics, pushShingiNoMatch, pushWeeklyNoNewsWithPodcast, type DigestDoc, type WeeklyCardDoc } from "./line-message";
import { generateShingiCoverPDF, generateShingiTopicPDF, type ShingiThemeDetail } from "./pdf-shingi";
import { generateCoverCardImage, generateSummaryCardImage, generateWeeklyCardHeroImage } from "./social-image";
import { postArticleToSocial } from "./meta";
import { extractPdfText } from "./pdf-text";
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

// analyzeDocument/generateStructuredContentを、ページ数上限フォールバック込みで実行する共通ヘルパー。
// PDFがClaudeのネイティブ読み込み上限（100ページ）を超えていた場合、自前でテキスト抽出して
// テキストのみで再試行する。それでもトークン上限を超える場合のみ tooLarge:true を返す。
async function analyzeGrounded(
  title: string,
  content: string,
  pdfBase64?: string
): Promise<{ tooLarge: false; result: AnalysisResult; structured: StructuredContent } | { tooLarge: true }> {
  try {
    const result = await analyzeDocument(title, content, pdfBase64);
    const structured = await generateStructuredContent(title, content, pdfBase64);
    return { tooLarge: false, result, structured };
  } catch (e) {
    if (!(isDocumentTooLargeError(e) && pdfBase64)) throw e;
    try {
      const extractedText = await extractPdfText(pdfBase64);
      const result = await analyzeDocument(title, extractedText);
      const structured = await generateStructuredContent(title, extractedText);
      return { tooLarge: false, result, structured };
    } catch (e2) {
      if (isDocumentTooLargeError(e2)) return { tooLarge: true };
      throw e2;
    }
  }
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

// 記事処理完了直後に、Facebook/Instagramへ表紙＋3行まとめの2枚組を自動投稿する。
// 失敗しても記事処理自体は成立済みなので、ここでは例外を握りつぶしログのみ残す。
async function postToSocial(
  doc: { id: string; title: string; source: string; tags: string[]; publishedAt: Date | null; decisionStatus: string | null },
  structured: StructuredContent,
  summary: string
) {
  try {
    const title = structured.hookTitle || doc.title;
    const [coverBuffer, summaryBuffer] = await Promise.all([
      generateCoverCardImage({
        title,
        subtitle: doc.title,
        source: doc.source,
        tags: doc.tags,
        publishedAt: doc.publishedAt ?? new Date(),
        decisionStatus: doc.decisionStatus,
      }),
      generateSummaryCardImage({ source: doc.source, points: structured.points }),
    ]);
    const [coverBlob, summaryBlob] = await Promise.all([
      put(`social/article-${doc.id}-cover-${Date.now()}.png`, coverBuffer, { access: "public", contentType: "image/png" }),
      put(`social/article-${doc.id}-summary-${Date.now()}.png`, summaryBuffer, { access: "public", contentType: "image/png" }),
    ]);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yomitoku-base.com";
    const articleUrl = `${baseUrl}/base/articles/${doc.id}`;
    const result = await postArticleToSocial({ imageUrls: [coverBlob.url, summaryBlob.url], summary, articleUrl });
    if (result.errors.length) console.error(`SNS投稿一部失敗 ${doc.id}:`, result.errors);
  } catch (e) {
    console.error(`SNS投稿失敗 ${doc.id}:`, e);
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
// 1テーマぶんの資料PDF（または議事録PDF）を分析し、doc.id（count===0の場合）か新規行に保存する。
// 資料版・議事録版どちらの保存処理も同じ形なので、processShingiSession/processShingiMinutesの両方から呼ぶ。
async function saveShingiTheme(params: {
  doc: { id: string; url: string; publishedAt: Date | null };
  themeNo: number;
  title: string;
  rawText: string;
  isFirst: boolean;
  shingiSessionNo: number | null;
  shingiVariant: "materials" | "minutes";
  result: AnalysisResult;
  structured: StructuredContent;
}): Promise<string> {
  const { doc, themeNo, title, rawText, isFirst, shingiSessionNo, shingiVariant, result, structured } = params;
  const commonData = {
    themeNo,
    title,
    rawText,
    summary: result.summary,
    tags: result.tags,
    importance: result.importance,
    decisionStatus: result.decisionStatus,
    structuredContent: structured as object,
    shingiSessionNo,
    shingiVariant,
    processedAt: new Date(),
  };

  const id = isFirst
    ? (await prisma.siteDocument.update({ where: { id: doc.id }, data: commonData })).id
    : (
        await prisma.siteDocument.create({
          data: { url: doc.url, source: "shingi", publishedAt: doc.publishedAt, ...commonData },
        })
      ).id;

  await postEditorComment(id, title, structured);
  await postToSocial(
    { id, title, source: "shingi", tags: result.tags, publishedAt: doc.publishedAt, decisionStatus: result.decisionStatus },
    structured,
    result.summary
  );
  return id;
}

// 分科会1回の会合（1URL）を、資料PDF（【資料N】形式で個別リンクされている実PDF）を1本ずつ
// Claudeに直接読ませてSiteDocumentに分割保存する（テーマ数ぶん）。
// pendingの元レコード（doc.id）は最初に成功したテーマで再利用し、残りは新規行として作成する。
export async function processShingiSession(doc: {
  id: string;
  url: string;
  title: string;
  rawText: string;
  publishedAt: Date | null;
  shingiSessionNo: number | null;
}): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];

  let materials: { no: number; title: string; url: string }[] = [];
  try {
    const html = await (await fetch(doc.url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; YomitokuBot/1.0)" } })).text();
    materials = extractShingiMaterialPdfLinks(html, doc.url);
  } catch (e) {
    errors.push(`資料ページ取得失敗 "${doc.title.slice(0, 30)}": ${e}`);
  }

  let count = 0;

  // 【資料N】形式の個別PDFが見つからない場合（フォーマット崩れ等の想定外パターン）は、
  // 資料ページのテキストからAIにテーマ一覧を推測させる旧来のフォールバックに切り替える
  // （PDF本文を読まないぶん要約の質は落ちるが、cronが完全に止まるよりはまし）。
  if (materials.length === 0) {
    const pdfData = await buildShingiPDFData(doc.title, doc.rawText, doc.url);
    for (const detail of pdfData.theme_details) {
      try {
        const themeText = buildShingiThemeText(detail);
        const analysis = await analyzeGrounded(detail.name, themeText);
        if (analysis.tooLarge) continue; // テキストのみのフォールバックでは通常発生しない
        await saveShingiTheme({
          doc,
          themeNo: detail.no,
          title: detail.name,
          rawText: themeText,
          isFirst: count === 0,
          shingiSessionNo: doc.shingiSessionNo,
          shingiVariant: "materials",
          result: analysis.result,
          structured: analysis.structured,
        });
        count++;
      } catch (e) {
        errors.push(`Shingi theme failed "${detail.name}": ${e}`);
      }
    }
    return { count, errors };
  }

  for (const material of materials) {
    try {
      const pdfBase64 = await fetchPdfBase64(material.url, material.title.slice(0, 40));
      if (!pdfBase64) {
        errors.push(`資料PDF取得失敗のためスキップ: "${material.title.slice(0, 30)}"`);
        continue;
      }

      const analysis = await analyzeGrounded(material.title, "", pdfBase64);
      if (analysis.tooLarge) {
        errors.push(`資料PDFがサイズ上限のためスキップ: "${material.title.slice(0, 30)}"`);
        continue;
      }

      await saveShingiTheme({
        doc,
        themeNo: material.no,
        title: material.title,
        rawText: `${material.title}（資料PDF: ${material.url}）`,
        isFirst: count === 0,
        shingiSessionNo: doc.shingiSessionNo,
        shingiVariant: "materials",
        result: analysis.result,
        structured: analysis.structured,
      });
      count++;
    } catch (e) {
      errors.push(`Shingi theme failed "${material.title}": ${e}`);
    }
  }
  return { count, errors };
}

// 議事録が後日公開された回について、議事録PDF（会合全体の逐語録1本）を各テーマの文脈として
// 使い回し、資料版と同じテーマ構成で議事録ベースの記事を生成する。
// テーマ構成は既存の資料版（shingiVariant="materials", shingiSessionNo一致）のものを踏襲する
// ことで、同じ回の資料版・議事録版が同じテーマ数・同じテーマ名で並び、見比べやすくなる。
export async function processShingiMinutes(doc: {
  id: string;
  url: string;
  title: string;
  rawText: string;
  publishedAt: Date | null;
  shingiSessionNo: number | null;
}): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];

  if (doc.shingiSessionNo == null) {
    errors.push(`議事録処理スキップ（回次番号不明）: "${doc.title.slice(0, 30)}"`);
    return { count: 0, errors };
  }

  const materialThemes = await prisma.siteDocument.findMany({
    where: { source: "shingi", shingiVariant: "materials", shingiSessionNo: doc.shingiSessionNo },
    select: { themeNo: true, title: true },
    orderBy: { themeNo: "asc" },
  });
  if (materialThemes.length === 0) {
    errors.push(`議事録処理スキップ（対応する資料版が見つからない）: 第${doc.shingiSessionNo}回`);
    return { count: 0, errors };
  }

  let minutesPdfUrl: string | null = null;
  try {
    const html = await (await fetch(doc.url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; YomitokuBot/1.0)" } })).text();
    minutesPdfUrl = extractShingiMinutesPdfUrl(html, doc.url);
  } catch (e) {
    errors.push(`議事録ページ取得失敗 "${doc.title.slice(0, 30)}": ${e}`);
  }
  if (!minutesPdfUrl) {
    errors.push(`議事録PDFリンクが見つかりません: 第${doc.shingiSessionNo}回`);
    return { count: 0, errors };
  }

  const pdfBase64 = await fetchPdfBase64(minutesPdfUrl, `第${doc.shingiSessionNo}回議事録`);
  if (!pdfBase64) {
    errors.push(`議事録PDF取得失敗のためスキップ: 第${doc.shingiSessionNo}回`);
    return { count: 0, errors };
  }

  let count = 0;
  for (const theme of materialThemes) {
    try {
      const title = `${theme.title}（議事録より）`;
      const analysis = await analyzeGrounded(
        `第${doc.shingiSessionNo}回 社会保障審議会介護給付費分科会 議事録のうち「${theme.title}」に関する議論`,
        "",
        pdfBase64
      );
      if (analysis.tooLarge) {
        errors.push(`議事録PDFがサイズ上限のためスキップ: 第${doc.shingiSessionNo}回`);
        continue;
      }

      await saveShingiTheme({
        doc,
        themeNo: theme.themeNo,
        title,
        rawText: `${title}（議事録PDF: ${minutesPdfUrl}）`,
        isFirst: count === 0,
        shingiSessionNo: doc.shingiSessionNo,
        shingiVariant: "minutes",
        result: analysis.result,
        structured: analysis.structured,
      });
      count++;
    } catch (e) {
      errors.push(`Shingi minutes theme failed "${theme.title}": ${e}`);
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
          ...(item.source === "shingi" ? { shingiSessionNo: item.shingiSessionNo, shingiVariant: "materials" } : {}),
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

export interface ShingiMinutesCheckResult {
  scanned: number;
  saved: number;
  errors: string[];
}

// 分科会一覧ページを走査し、資料版は既にある（＝処理済み）が議事録版はまだ無い回を見つけて
// pendingのプレースホルダー行を保存する（Claude呼び出しはPhase 2のprocessShingiMinutesで行う）。
// 議事録は資料より数週間〜数ヶ月遅れて公開されるため、日次スクレイプとは別に毎回この走査が必要。
export async function runShingiMinutesCheck(): Promise<ShingiMinutesCheckResult> {
  const errors: string[] = [];
  const found = await findShingiMinutesLinks();

  const existingMinutesUrls = new Set(
    (await prisma.siteDocument.findMany({
      where: { url: { in: found.map((f) => f.minutesUrl) } },
      select: { url: true },
    })).map((d) => d.url)
  );

  const candidates = found.filter((f) => !existingMinutesUrls.has(f.minutesUrl));
  if (candidates.length === 0) return { scanned: found.length, saved: 0, errors };

  const materialSessions = await prisma.siteDocument.findMany({
    where: {
      source: "shingi",
      shingiVariant: "materials",
      shingiSessionNo: { in: candidates.map((c) => c.sessionNo) },
    },
    select: { shingiSessionNo: true, publishedAt: true },
    distinct: ["shingiSessionNo"],
  });
  const materialSessionMap = new Map(materialSessions.map((m) => [m.shingiSessionNo, m.publishedAt]));

  let saved = 0;
  for (const candidate of candidates) {
    // 対応する資料版がまだ処理されていない回はスキップ（processShingiMinutesが前提とする
    // テーマ構成が存在しないため）。資料版の処理が進んだ次回の実行で改めて拾われる。
    if (!materialSessionMap.has(candidate.sessionNo)) continue;
    try {
      await prisma.siteDocument.create({
        data: {
          url: candidate.minutesUrl,
          title: candidate.title,
          source: "shingi",
          publishedAt: materialSessionMap.get(candidate.sessionNo) ?? null,
          rawText: candidate.title,
          shingiSessionNo: candidate.sessionNo,
          shingiVariant: "minutes",
          // summary / tags / structuredContent は Phase 2（processShingiMinutes）で埋める
        },
      });
      saved++;
    } catch (e) {
      errors.push(`議事録プレースホルダー保存失敗 "第${candidate.sessionNo}回": ${e}`);
    }
  }

  return { scanned: found.length, saved, errors };
}

// Phase 2: summary=null の記事を1件ずつClaude処理
export async function runProcessPending(limit = 1): Promise<ProcessResult> {
  const errors: string[] = [];

  const pending = await prisma.$queryRaw<{ id: string; url: string; title: string; source: string; rawText: string; publishedAt: Date | null; shingiSessionNo: number | null; shingiVariant: string | null }[]>`
    SELECT id, url, title, source, "rawText", "publishedAt", "shingiSessionNo", "shingiVariant"
    FROM "SiteDocument"
    WHERE summary IS NULL AND "rawText" IS NOT NULL
    ORDER BY "publishedAt" DESC NULLS LAST, "createdAt" DESC
    LIMIT ${limit}
  `;

  let processed = 0;
  for (const doc of pending) {
    try {
      if (doc.source === "shingi" && doc.shingiVariant === "minutes") {
        const { count, errors: themeErrors } = await processShingiMinutes(doc);
        errors.push(...themeErrors);
        if (count > 0) processed++;
        continue;
      }
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

      const analysis = await analyzeGrounded(doc.title, doc.rawText ?? "", pdfBase64);
      if (analysis.tooLarge) {
        // テキスト抽出後もトークン上限を超える場合のみ、正直に「対象外」として処理済みにする。
        // これをしないと毎日のcronが同じ処理不能な文書を無限にリトライし続けてしまう。
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
      const { result, structured } = analysis;

      // 一覧ページから発行日が拾えなかった場合（PDF本文にしか記載がないケースがある）、
      // 週刊ダイジェストが「直近7日以内」をpublishedAt基準で絞り込むため、ここで埋めないと
      // 実際は今週処理された記事が永久にダイジェストへ載らなくなる
      let publishedAt = doc.publishedAt;
      if (!publishedAt && pdfBase64) {
        try {
          const dateStr = await extractPublishedDate(doc.title, pdfBase64);
          if (dateStr) publishedAt = new Date(dateStr);
        } catch (e) {
          errors.push(`発行日抽出失敗 "${doc.title.slice(0, 30)}": ${e}`);
        }
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
          ...(publishedAt ? { publishedAt } : {}),
        },
      });
      await postEditorComment(doc.id, doc.title, structured);
      await postToSocial(
        { id: doc.id, title: doc.title, source: doc.source, tags: result.tags, publishedAt, decisionStatus: result.decisionStatus },
        structured,
        result.summary
      );
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
  const weekLabel = getWeekLabel();

  // 0. Skip if already sent today（force=true で上書き可）
  const todayKey = `weekly-${new Date().toISOString().slice(0, 10)}`;
  const existingBatch = await prisma.messageBatch.findUnique({ where: { idempotencyKey: todayKey } });
  if (existingBatch && !opts?.force) {
    return { newDocs: 0, sentTo: 0, batchId: existingBatch.id, errors: [...errors, "Already sent today"] };
  }

  // 1. 今週分の記事は日次パイプライン（scrape→process）で処理済みのはずなので、
  //    自前で再スクレイプせずDBから素直に集める（再スクレイプすると「既にDBにある」記事が
  //    毎回除外され、その週たまたま処理漏れた1件だけが「新着」扱いになるバグがあった）
  const weekDocs = await prisma.siteDocument.findMany({
    where: { publishedAt: { gte: since }, summary: { not: null } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  // 新着が1件もない週は、黙ってスキップせず「新着なし＋放送室紹介」を送る
  // （何も届かないと解約に見えるし、せっかくの放送室の宣伝機会でもある）
  if (weekDocs.length === 0) {
    const episode = await prisma.podcastEpisode.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: { title: true, description: true },
    });

    const batch = await prisma.messageBatch.create({
      data: {
        kind: "WEEKLY_DIGEST",
        title: `週刊ヨミトク（新着なし） ${weekLabel}`,
        content: "今週は新着情報がありませんでした",
        idempotencyKey: todayKey,
      },
    });

    const recipients = await prisma.lineRecipient.findMany({
      where: { unfollowedAt: null, company: { status: "ACTIVE" } },
    });

    let sentTo = 0;
    for (const recipient of recipients) {
      try {
        const messageId = await pushWeeklyNoNewsWithPodcast(recipient.lineUserId, weekLabel, episode);
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

    return { newDocs: 0, sentTo, batchId: batch.id, errors };
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

  // 3. Create MessageBatch
  const batch = await prisma.messageBatch.create({
    data: {
      kind: "WEEKLY_DIGEST",
      title: `週刊ダイジェスト ${weekLabel}`,
      content: digestText,
      idempotencyKey: todayKey,
    },
  });

  // 4. Link documents to batch
  await prisma.batchDocument.createMany({
    data: weekDocs.map((d) => ({
      messageBatchId: batch.id,
      siteDocumentId: d.id,
    })),
    skipDuplicates: true,
  });

  // 5. Send LINE messages（タグでパーソナライズしたカードカルーセル）
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

  // ヒーロー画像は受信者ごとに変わらないので、記事ごとに1回だけ生成してBlobに上げる
  // （LINE Flexのbox/textだけでは表現できないタイトル×キャラの回り込みや行間をここに焼き込む）
  const heroImageUrls = await Promise.all(
    weekDocs.map(async (d) => {
      const sc = d.structuredContent as unknown as StructuredContent | null;
      const buffer = await generateWeeklyCardHeroImage({
        source: d.source,
        title: sc?.hookTitle || d.title,
        decisionStatus: d.decisionStatus,
        importanceStars: sc?.importanceStars ?? null,
        urgencyStars: sc?.urgencyStars ?? null,
      });
      const blob = await put(`weekly/${d.id}-hero-${Date.now()}.png`, buffer, { access: "public", contentType: "image/png" });
      return [d.id, blob.url] as const;
    })
  );
  const heroImageUrlByDocId = new Map(heroImageUrls);

  const cardDocs: WeeklyCardDoc[] = weekDocs.map((d) => {
    const sc = d.structuredContent as unknown as StructuredContent | null;
    return {
      id: d.id,
      title: d.title,
      hookTitle: sc?.hookTitle ?? null,
      summary: d.summary ?? "",
      source: d.source,
      tags: d.tags as string[],
      importanceStars: sc?.importanceStars ?? null,
      urgencyStars: sc?.urgencyStars ?? null,
      isNew: new Date().getTime() - new Date(d.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000,
      decisionStatus: d.decisionStatus,
      heroImageUrl: heroImageUrlByDocId.get(d.id)!,
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
        cardsToSend
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
