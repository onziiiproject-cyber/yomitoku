import { NextRequest, NextResponse } from "next/server";
import { scrapeMhlwLatest } from "@/lib/scraper";

// extractLinks のテスト用内部ロジック
const MHLW_URL = "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/kaigo_koureisha/index_00010.html";

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-secret") !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const debug = req.nextUrl.searchParams.get("debug") === "1";

  if (debug) {
    // リンク抽出のデバッグ
    const res = await fetch(MHLW_URL, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
    const html = await res.text();
    // split でリンク抽出
    const parts = html.split("<a ");
    const candidates: { href: string; text: string }[] = [];
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const hrefMatch = part.match(/href="([^"]+)"/);
      const closeAngle = part.indexOf(">");
      const closeTag = part.indexOf("</a>");
      if (!hrefMatch || closeAngle === -1 || closeTag === -1) continue;
      const href = hrefMatch[1].trim();
      const text = part.slice(closeAngle + 1, closeTag)
        .replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!text || text.length < 4) continue;
      if (text.includes("介護保険最新情報") && href.includes("/content/")) {
        const volMatch = text.match(/[Vv]ol\.?(\d+)/);
        candidates.push({ href: href.slice(0, 60), text: text.slice(0, 50) });
        if (candidates.length <= 30 && volMatch) {
          // just log first 30
        }
      }
    }
    return NextResponse.json({
      htmlLen: html.length,
      parts: parts.length,
      candidateCount: candidates.length,
      first20: candidates.slice(0, 20),
    });
  }

  try {
    const items = await scrapeMhlwLatest();
    return NextResponse.json({
      count: items.length,
      items: items.map(i => ({
        title: i.title.slice(0, 50),
        publishedAt: i.publishedAt,
        rawText: i.rawText.slice(0, 100),
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
