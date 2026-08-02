export interface ScrapedItem {
  url: string;
  title: string;
  publishedAt: Date | null;
  source: "mhlw_latest" | "shingi";
  rawText: string;
  pdfBase64?: string; // PDF articles: base64 binary for Claude Document API
  shingiSessionNo?: number; // shingi only: 第N回
  shingiMinutesUrl?: string; // shingi only: 議事録の索引ページURL（公開されていれば）
}

export interface ShingiMaterialLink {
  no: number;
  title: string;
  url: string;
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; YomitokuBot/1.0; +https://yomitoku-base.com)",
      "Accept-Language": "ja,en;q=0.9",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);

  const buf = await res.arrayBuffer();
  // Try UTF-8 first; MHLW older pages are sometimes Shift-JIS
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
    return text;
  } catch {
    return new TextDecoder("shift_jis").decode(buf);
  }
}

function toHalfWidth(text: string): string {
  // 全角数字（０-９）を半角に変換
  return text.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
}

function parseDate(text: string): Date | null {
  const t = toHalfWidth(text);
  // 令和N年M月D日（日の前にスペースが入ることがある）
  const reiwa = t.match(/令和(\d+)年(\d+)月\s*(\d+)\s*日/);
  if (reiwa) {
    const year = 2018 + parseInt(reiwa[1]);
    return new Date(`${year}-${reiwa[2].padStart(2, "0")}-${reiwa[3].padStart(2, "0")}`);
  }
  const western = t.match(/(\d{4})年(\d{1,2})月\s*(\d{1,2})\s*日/);
  if (western) {
    return new Date(
      `${western[1]}-${western[2].padStart(2, "0")}-${western[3].padStart(2, "0")}`
    );
  }
  return null;
}

function extractLinks(
  html: string,
  baseUrl: string
): Array<{ href: string; text: string; context: string }> {
  const results: Array<{ href: string; text: string; context: string }> = [];
  // regexの遅延マッチングは大きなHTMLで問題があるため split で処理
  const parts = html.split("<a ");
  let pos = parts[0].length + 3; // 最初の "<a " の後の位置を追跡
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const hrefMatch = part.match(/href="([^"]+)"/);
    const closeAngle = part.indexOf(">");
    const closeTag = part.indexOf("</a>");
    if (!hrefMatch || closeAngle === -1 || closeTag === -1) {
      pos += part.length + 3;
      continue;
    }
    const href = hrefMatch[1].trim();
    const text = part.slice(closeAngle + 1, closeTag)
      .replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!text || text.length < 4) {
      pos += part.length + 3;
      continue;
    }
    // リンク直後（</a>の後）のコンテキストを次の <a タグの前まで取得
    const afterEnd = pos + closeAngle + 1 + (closeTag - closeAngle - 1) + 4;
    const afterLink = html.slice(afterEnd, afterEnd + 400);
    const rawCtx = afterLink.split("<a ")[0];
    const context = rawCtx.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const full = href.startsWith("http")
      ? href
      : href.startsWith("/")
      ? `https://www.mhlw.go.jp${href}`
      : `${baseUrl}/${href}`;
    results.push({ href: full, text, context });
    pos += part.length + 3;
  }
  return results;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// 介護保険最新情報掲載ページ（vol.XXXX の一覧）
const MHLW_LIST_URL =
  "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/kaigo_koureisha/index_00010.html";

// 介護給付費分科会 一覧ページ（現行回）
const SHINGI_LIST_URL =
  "https://www.mhlw.go.jp/stf/shingi/shingi-hosho_126698_00022.html";

export async function scrapeMhlwLatest(
  since?: Date
): Promise<ScrapedItem[]> {
  const html = await fetchPage(MHLW_LIST_URL);
  const links = extractLinks(html, "https://www.mhlw.go.jp");

  // 介護保険最新情報 vol.XXXX のリンク（PDFは /content/ 配下）
  const candidates = links.filter(
    (l) =>
      (l.href.includes("/content/") || l.href.includes("/stf/")) &&
      l.text.includes("介護保険最新情報") &&
      l.text.length > 10
  );

  // 一覧ページ自体に数年分（2020年〜）が掲載されているため、直近30件に絞らず
  // 全候補をsinceで絞り込む（日次cronはsince=1週間前を渡すので通常運用への影響はない）
  const items: ScrapedItem[] = [];
  for (const link of candidates) {
    // 日付はリンクテキスト内 or リンク直後のコンテキスト（令和N年M月D日...）
    const publishedAt = parseDate(link.text) ?? parseDate(link.context);
    if (since && publishedAt && publishedAt < since) continue;

    const fullUrl = link.href.startsWith("http")
      ? link.href
      : `https://www.mhlw.go.jp${link.href}`;
    const cleanTitle = link.text
      .replace(/\[.*?KB\]/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const contextText = link.context.replace(/\s+/g, " ").trim();
    const rawText = `${cleanTitle}\n${contextText}`;

    // PDFダウンロードはここでは行わない（新記事判定後にダイジェスト側で実施）
    items.push({
      url: fullUrl,
      title: cleanTitle,
      publishedAt,
      source: "mhlw_latest",
      rawText,
    });
  }

  return items;
}

// 全角数字を含む「【資料N】タイトル」形式の全角数字→半角変換
function toHalfWidthDigits(s: string): string {
  return s.replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0));
}

// 資料の索引ページ（例: newpage_74599.html）から【資料N】形式の個別PDFリンクを抽出する。
// 議事次第・委員名簿は資料そのものではないため除外する。
export function extractShingiMaterialPdfLinks(html: string, baseUrl: string): ShingiMaterialLink[] {
  const links: ShingiMaterialLink[] = [];
  const re = /href="([^"]+\.pdf)"[^>]*>\s*【資料([0-9０-９]+)】\s*([^［<]+?)\s*(?:［[^］]*］)?\s*</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[1];
    const no = parseInt(toHalfWidthDigits(m[2]));
    const title = m[3].trim();
    if (!title) continue;
    links.push({
      no,
      title,
      url: href.startsWith("http") ? href : `https://www.mhlw.go.jp${href}`,
    });
  }
  return links;
}

// 議事録の索引ページ（例: newpage_75206.html）から議事録本体PDFのURLを抽出する。
// このページは通常、議事録PDF1本のみをリンクしている。
export function extractShingiMinutesPdfUrl(html: string, baseUrl: string): string | null {
  const match = html.match(/href="([^"]+\.pdf)"/);
  if (!match) return null;
  const href = match[1];
  return href.startsWith("http") ? href : `https://www.mhlw.go.jp${href}`;
}

// 分科会一覧ページを走査し、「議事録」リンクを持つ回を全件返す（sinceによる絞り込みなし）。
// 議事録は資料より数週間〜数ヶ月遅れて公開されるため、日次スクレイプの新着検知（scrapeShingi）とは
// 別に、既存の資料版に議事録が後から追加されていないかを確認する専用の走査を行う。
export async function findShingiMinutesLinks(): Promise<{ sessionNo: number; minutesUrl: string; title: string }[]> {
  const html = await fetchPage(SHINGI_LIST_URL);
  const rows = html.split("<tr");
  const results: { sessionNo: number; minutesUrl: string; title: string }[] = [];

  for (const row of rows) {
    const sessionMatch = row.match(/第(\d+)回/);
    if (!sessionMatch) continue;
    const sessionNo = parseInt(sessionMatch[1]);

    const minutesMatch = row.match(/href="([^"]+newpage_[^"]+)"[^>]*>\s*議事録/);
    if (!minutesMatch) continue;
    const minutesHref = minutesMatch[1];
    const minutesUrl = minutesHref.startsWith("http")
      ? minutesHref
      : `https://www.mhlw.go.jp${minutesHref}`;

    results.push({
      sessionNo,
      minutesUrl,
      title: `社会保障審議会介護給付費分科会 第${sessionNo}回`,
    });
  }

  return results;
}

export async function scrapeShingi(since?: Date): Promise<ScrapedItem[]> {
  const html = await fetchPage(SHINGI_LIST_URL);

  // <tr> ブロックを分割して 第XX回 の行を見つける
  const rows = html.split("<tr");
  const items: ScrapedItem[] = [];

  for (const row of rows) {
    const sessionMatch = row.match(/第(\d+)回/);
    if (!sessionMatch) continue;
    const sessionNo = parseInt(sessionMatch[1]);

    // 日付を取得（西暦 / 令和両対応）
    const dateText = row.replace(/<[^>]+>/g, " ");
    const publishedAt = parseDate(dateText);
    if (since && publishedAt && publishedAt < since) continue;

    // 資料リンクを取得
    const resourceMatch = row.match(/href="([^"]+newpage_[^"]+)"[^>]*>\s*資料/);
    if (!resourceMatch) continue;
    const resourceHref = resourceMatch[1];
    const resourceUrl = resourceHref.startsWith("http")
      ? resourceHref
      : `https://www.mhlw.go.jp${resourceHref}`;

    // 議題テキスト（簡易抽出）
    const agendaRaw = dateText.replace(/\s+/g, " ").match(/令和\d+年\d+月\d+日[）\s]+(.+?)(?:\s*－|\s*$)/)?.[1] ?? "";
    const title = `社会保障審議会介護給付費分科会 第${sessionNo}回 ${agendaRaw.slice(0, 60)}`.trim();

    // 資料ページの本文を取得
    let rawText = title;
    try {
      const pageHtml = await fetchPage(resourceUrl);
      rawText = stripHtml(pageHtml).slice(0, 10000);
    } catch {
      // タイトルのみでフォールバック
    }

    items.push({
      url: resourceUrl,
      title,
      publishedAt,
      source: "shingi",
      rawText,
      shingiSessionNo: sessionNo,
    });

    if (items.length >= 3) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  return items;
}
