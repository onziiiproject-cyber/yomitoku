export interface ScrapedItem {
  url: string;
  title: string;
  publishedAt: Date | null;
  source: "mhlw_latest" | "shingi";
  rawText: string;
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; YomitokuBot/1.0; +https://yomitoru-xi.vercel.app)",
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

function parseDate(text: string): Date | null {
  // e.g. "令和7年7月10日" or "2025年7月10日"
  const reiwa = text.match(/令和(\d+)年(\d+)月(\d+)日/);
  if (reiwa) {
    const year = 2018 + parseInt(reiwa[1]);
    return new Date(`${year}-${reiwa[2].padStart(2, "0")}-${reiwa[3].padStart(2, "0")}`);
  }
  const western = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
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
): Array<{ href: string; text: string }> {
  const results: Array<{ href: string; text: string }> = [];
  // Match <a href="...">text</a> including multi-line
  const re = /<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    const text = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!text || text.length < 4) continue;
    const full = href.startsWith("http")
      ? href
      : href.startsWith("/")
      ? `https://www.mhlw.go.jp${href}`
      : `${baseUrl}/${href}`;
    results.push({ href: full, text });
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

// 介護保険最新情報 list page
const MHLW_LIST_URL =
  "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/kaigo_koureisha/index.html";

// 介護給付費分科会 list page
const SHINGI_LIST_URL =
  "https://www.mhlw.go.jp/stf/shingi/shingi-hosho_126698.html";

export async function scrapeMhlwLatest(
  since?: Date
): Promise<ScrapedItem[]> {
  const html = await fetchPage(MHLW_LIST_URL);
  const links = extractLinks(html, "https://www.mhlw.go.jp");

  // Filter to MHLW links that look like content pages
  const candidates = links.filter(
    (l) =>
      l.href.includes("mhlw.go.jp") &&
      (l.href.includes("/stf/") || l.href.includes("/content/")) &&
      l.text.length > 8
  );

  const items: ScrapedItem[] = [];
  for (const link of candidates.slice(0, 15)) {
    const publishedAt = parseDate(link.text);
    if (since && publishedAt && publishedAt < since) continue;

    let rawText = link.text;
    try {
      const pageHtml = await fetchPage(link.href);
      rawText = stripHtml(pageHtml).slice(0, 5000);
    } catch {
      // Use title as fallback
    }

    items.push({
      url: link.href,
      title: link.text,
      publishedAt,
      source: "mhlw_latest",
      rawText,
    });

    // Rate limit
    await new Promise((r) => setTimeout(r, 500));
  }

  return items;
}

export async function scrapeShingi(since?: Date): Promise<ScrapedItem[]> {
  const html = await fetchPage(SHINGI_LIST_URL);
  const links = extractLinks(html, "https://www.mhlw.go.jp");

  // 分科会 links: usually contain "第XX回" or meeting-related keywords
  const candidates = links.filter(
    (l) =>
      l.href.includes("mhlw.go.jp") &&
      l.text.length > 8 &&
      (l.text.includes("第") ||
        l.text.includes("回") ||
        l.text.includes("分科会") ||
        l.text.includes("議事"))
  );

  const items: ScrapedItem[] = [];
  for (const link of candidates.slice(0, 8)) {
    const publishedAt = parseDate(link.text);
    if (since && publishedAt && publishedAt < since) continue;

    let rawText = link.text;
    try {
      const pageHtml = await fetchPage(link.href);
      rawText = stripHtml(pageHtml).slice(0, 10000);
    } catch {
      // Use title as fallback
    }

    items.push({
      url: link.href,
      title: link.text,
      publishedAt,
      source: "shingi",
      rawText,
    });

    await new Promise((r) => setTimeout(r, 500));
  }

  return items;
}
