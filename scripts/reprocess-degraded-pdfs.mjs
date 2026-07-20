/**
 * PDF取得に失敗したまま「本文なし」で公開されてしまった記事を、
 * 実際にPDFを取得し直して再生成する（summary/tags/importance/structuredContent）。
 *
 * Usage:
 *   node --import tsx scripts/reprocess-degraded-pdfs.mjs
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

const { PrismaClient } = await import("../src/generated/prisma/client.ts");
const { PrismaPg } = await import("@prisma/adapter-pg");
const { analyzeDocument, generateStructuredContent } = await import("../src/lib/anthropic.ts");

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function fetchPdfBase64(url, label) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; YomitokuBot/1.0)" } });
      if (res.ok) return Buffer.from(await res.arrayBuffer()).toString("base64");
      console.error(`PDF non-OK (attempt ${attempt}/3, ${res.status}) for ${label}`);
    } catch (e) {
      console.error(`PDF fetch error (attempt ${attempt}/3) for ${label}:`, e.message);
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  return null;
}

const docs = await prisma.siteDocument.findMany({
  where: {
    summary: { not: null },
    url: { endsWith: ".pdf" },
  },
  select: { id: true, title: true, url: true, rawText: true, structuredContent: true },
});

const hedgePatterns = [
  "原文に", "原文本文に", "提供された原文", "添付Q&A本文", "添付ＱＡ本文",
  "確認不可", "記載なし", "本文の確認が前提", "含まれていないため",
];

const targets = docs.filter((d) => hedgePatterns.some((p) => JSON.stringify(d.structuredContent ?? {}).includes(p)));
console.log(`対象: ${targets.length}件\n`);

let fixed = 0;
let failed = 0;

for (const doc of targets) {
  console.log(`--- ${doc.title.slice(0, 50)} ---`);
  const pdfBase64 = await fetchPdfBase64(doc.url, doc.title.slice(0, 40));
  if (!pdfBase64) {
    failed++;
    console.error(`  PDF取得失敗。スキップ。\n`);
    continue;
  }

  try {
    const result = await analyzeDocument(doc.title, doc.rawText ?? "", pdfBase64);
    const structured = await generateStructuredContent(doc.title, doc.rawText ?? "", pdfBase64);

    await prisma.siteDocument.update({
      where: { id: doc.id },
      data: {
        summary: result.summary,
        tags: result.tags,
        importance: result.importance,
        structuredContent: structured,
      },
    });
    fixed++;
    console.log(`  OK: ${result.summary.slice(0, 60)}...\n`);
  } catch (e) {
    failed++;
    console.error(`  再生成失敗:`, e.message, "\n");
  }

  await new Promise((r) => setTimeout(r, 500));
}

console.log(`\n完了: 修正${fixed}件 / 失敗${failed}件`);
await prisma.$disconnect();
