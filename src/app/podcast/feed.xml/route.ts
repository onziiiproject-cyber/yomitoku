import { prisma } from "@/lib/prisma";

const SITE_URL = "https://yomitoku-base.com";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDurationHms(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export async function GET() {
  const episodes = await prisma.podcastEpisode.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  const items = episodes
    .map((ep) => {
      const pubDate = (ep.publishedAt ?? ep.createdAt).toUTCString();
      return `
    <item>
      <title>${escapeXml(ep.title)}</title>
      <description>${escapeXml(ep.description)}</description>
      <enclosure url="${escapeXml(ep.audioUrl)}" type="audio/mpeg" />
      <guid isPermaLink="false">${ep.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <itunes:duration>${formatDurationHms(ep.durationSec)}</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ヨミトク放送室｜介護保険制度、ゴリ編集長に聞いてみた</title>
    <link>${SITE_URL}</link>
    <language>ja</language>
    <description>介護保険の最新情報を、ゴリ編集長がわかりやすく解説する「ヨミトク編集部」がお届けする音声コンテンツ。新人記者ミスグレーとの掛け合いで、制度に出てくる専門用語を超初心者向けに解説します。</description>
    <itunes:author>ヨミトク編集部</itunes:author>
    <itunes:owner>
      <itunes:name>ヨミトク編集部</itunes:name>
      <itunes:email>info@yomitoku-base.com</itunes:email>
    </itunes:owner>
    <itunes:image href="${SITE_URL}/podcast/cover.png" />
    <image>
      <url>${SITE_URL}/podcast/cover.png</url>
      <title>ヨミトク放送室</title>
      <link>${SITE_URL}</link>
    </image>
    <itunes:category text="Business" />
    <itunes:explicit>false</itunes:explicit>
    <atom:link href="${SITE_URL}/podcast/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
