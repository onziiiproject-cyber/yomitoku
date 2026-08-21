/**
 * 既存のDRAFT議事録ラジオ解説の台本を、現在のプロンプトで作り直す。
 * プロンプトを直したあと、まだ公開していない台本に反映させたいときに使う。
 *
 * 議事録PDFは元記事のURLから取り直す（生成時のpdfBase64は保持していないため）。
 * 上書き前の台本は tmp/script-backup/ にJSONで残す。
 *
 * PUBLISHED済みのものは対象外（公開後に中身が変わると聴いた人と食い違うため）。
 *
 * Usage:
 *   npx tsx scripts/regenerate-audio-script.mjs --id <台本id>
 *   npx tsx scripts/regenerate-audio-script.mjs --all-drafts   # DRAFTすべて
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const [k, ...r] = l.split("="); return [k.trim(), r.join("=").trim().replace(/^["']|["']$/g, "")]; })
);
for (const [k, v] of Object.entries(env)) process.env[k] ??= v;

const args = process.argv.slice(2);
const getOpt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const targetId = getOpt("--id");
const allDrafts = args.includes("--all-drafts");

if (!targetId && !allDrafts) {
  console.error("--id <台本id> か --all-drafts を指定してください");
  process.exit(1);
}

const { prisma } = await import("../src/lib/prisma.ts");
const { generateShingiAudioScript } = await import("../src/lib/anthropic.ts");
const { extractShingiMinutesPdfUrl } = await import("../src/lib/scraper.ts");

const briefings = await prisma.articleAudioBriefing.findMany({
  where: targetId ? { id: targetId } : { status: "DRAFT" },
  include: { siteDocument: { select: { title: true, url: true, shingiSessionNo: true } } },
});

if (briefings.length === 0) {
  console.error(targetId ? `台本が見つかりません: ${targetId}` : "DRAFTの台本はありません。");
  await prisma.$disconnect();
  process.exit(1);
}

const backupDir = path.join(ROOT, "tmp/script-backup");
fs.mkdirSync(backupDir, { recursive: true });

// 議事録ページからPDFのURLを見つけて取得する。同じ会議の記事が複数あるので、
// 一度取ったPDFはURL単位で使い回す（無駄な再取得を避ける）
const pdfCache = new Map();
async function fetchMinutesPdf(pageUrl) {
  if (pdfCache.has(pageUrl)) return pdfCache.get(pageUrl);

  const html = await (await fetch(pageUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; YomitokuBot/1.0)" },
  })).text();
  const pdfUrl = extractShingiMinutesPdfUrl(html, pageUrl);
  if (!pdfUrl) throw new Error(`議事録PDFのリンクが見つかりません: ${pageUrl}`);

  const res = await fetch(pdfUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; YomitokuBot/1.0)" } });
  if (!res.ok) throw new Error(`PDF取得に失敗 (${res.status}): ${pdfUrl}`);
  const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
  pdfCache.set(pageUrl, b64);
  console.log(`  PDF取得: ${pdfUrl}（${(b64.length / 1024 / 1024 * 0.75).toFixed(1)}MB）`);
  return b64;
}

for (const b of briefings) {
  console.log(`\n${b.title} [${b.status}]`);

  if (b.status === "PUBLISHED") {
    console.log("  公開済みのため対象外（聴いた人と内容が食い違うため作り直さない）");
    continue;
  }

  try {
    const before = b.script ?? [];
    const backup = path.join(backupDir, `${b.id}.json`);
    fs.writeFileSync(backup, JSON.stringify({ title: b.title, description: b.description, script: before }, null, 2), "utf8");

    const pdfBase64 = await fetchMinutesPdf(b.siteDocument.url);
    // テーマ名は台本タイトルから復元する（「◯◯」議事録ラジオ解説 の形で保存されている）
    const themeTitle = b.title.replace(/^「(.+)」議事録ラジオ解説$/, "$1");
    const sessionLabel = `第${b.siteDocument.shingiSessionNo}回 社会保障審議会介護給付費分科会`;

    const draft = await generateShingiAudioScript(themeTitle, sessionLabel, pdfBase64);

    await prisma.articleAudioBriefing.update({
      where: { id: b.id },
      data: { title: draft.title, description: draft.description, script: draft.script },
    });

    const chars = (s) => s.reduce((n, l) => n + l.text.length, 0);
    console.log(`  作り直し完了: ${before.length}行/${chars(before)}字 → ${draft.script.length}行/${chars(draft.script)}字`);
    console.log(`  上書き前の台本: ${backup}`);
  } catch (e) {
    console.error(`  失敗: ${e}`);
  }
}

await prisma.$disconnect();
