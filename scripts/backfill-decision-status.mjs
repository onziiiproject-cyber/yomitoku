/**
 * 既存の公開済み記事に対して decisionStatus（議論中／決定事項）を後付けで分類する。
 *
 * Usage:
 *   node --import tsx scripts/backfill-decision-status.mjs
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
const { classifyDecisionStatus } = await import("../src/lib/anthropic.ts");

const docs = await prisma.siteDocument.findMany({
  where: { summary: { not: null }, decisionStatus: null },
  select: { id: true, title: true, rawText: true, summary: true },
});

console.log(`対象: ${docs.length}件`);

let done = 0;
let errors = 0;
for (const doc of docs) {
  try {
    const decisionStatus = await classifyDecisionStatus(doc.title, doc.summary || doc.rawText.slice(0, 3000));
    if (decisionStatus) {
      await prisma.siteDocument.update({ where: { id: doc.id }, data: { decisionStatus } });
    }
    done++;
    console.log(`[${done}/${docs.length}] ${doc.title.slice(0, 30)} -> ${decisionStatus ?? "null"}`);
  } catch (e) {
    errors++;
    console.error(`失敗: ${doc.title.slice(0, 30)}: ${e}`);
  }
}

console.log(`完了: ${done}件処理, ${errors}件エラー`);
await prisma.$disconnect();
