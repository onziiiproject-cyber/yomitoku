/**
 * publishedAtがnullのままの介護保険最新情報vol.XXXX（PDF）に対し、
 * PDF本文から発出日をAIに読み取らせて埋める。
 *
 * Usage:
 *   node --import tsx scripts/backfill-published-date.mjs
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

const { prisma } = await import("../src/lib/prisma.ts");
const { extractPublishedDate } = await import("../src/lib/anthropic.ts");

async function fetchPdfBase64(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; YomitokuBot/1.0)" } });
      if (res.ok) return Buffer.from(await res.arrayBuffer()).toString("base64");
    } catch {
      // retry
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  return null;
}

const docs = await prisma.siteDocument.findMany({
  where: { publishedAt: null, source: "mhlw_latest", url: { endsWith: ".pdf" } },
  select: { id: true, title: true, url: true },
});

console.log(`対象: ${docs.length}件`);

let done = 0, failed = 0;
for (const doc of docs) {
  try {
    const pdfBase64 = await fetchPdfBase64(doc.url);
    if (!pdfBase64) {
      console.log(`[skip] PDF取得失敗: ${doc.title.slice(0, 30)}`);
      failed++;
      continue;
    }
    const dateStr = await extractPublishedDate(doc.title, pdfBase64);
    if (!dateStr) {
      console.log(`[skip] 日付読み取れず: ${doc.title.slice(0, 30)}`);
      failed++;
      continue;
    }
    await prisma.siteDocument.update({
      where: { id: doc.id },
      data: { publishedAt: new Date(dateStr) },
    });
    done++;
    console.log(`[${done}] ${doc.title.slice(0, 30)} -> ${dateStr}`);
  } catch (e) {
    failed++;
    console.error(`[error] ${doc.title.slice(0, 30)}: ${e}`);
  }
}

console.log(`完了: ${done}件成功, ${failed}件失敗`);
await prisma.$disconnect();
