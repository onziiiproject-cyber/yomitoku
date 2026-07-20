/**
 * 過去1年分の介護保険最新情報をまとめて取り込み・処理する（一回限りのバックフィル用）。
 *
 * Usage:
 *   node --import tsx scripts/backfill-historical-articles.mjs [days]
 *   （daysを省略した場合は365日）
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

const { runScrapeAndSave, runProcessPending } = await import("../src/lib/digest.ts");

const days = parseInt(process.argv[2] ?? "365", 10);
const since = new Date();
since.setDate(since.getDate() - days);

console.log(`--- Phase 1: スクレイプ（${since.toISOString().slice(0, 10)} 以降）---`);
const scrapeResult = await runScrapeAndSave(since);
console.log(JSON.stringify(scrapeResult, null, 2));

console.log(`\n--- Phase 2: 記事処理（PDF取得・AI分析）---`);
let totalProcessed = 0;
let round = 0;
while (true) {
  round++;
  const result = await runProcessPending(5);
  totalProcessed += result.processed;
  console.log(`[round ${round}] processed=${result.processed} remaining=${result.remaining} errors=${result.errors.length}`);
  if (result.errors.length > 0) {
    for (const e of result.errors) console.error("  -", e);
  }
  if (result.remaining === 0 || result.processed === 0) break;
  await new Promise((r) => setTimeout(r, 1000));
}

console.log(`\n完了: 合計処理件数=${totalProcessed}`);
process.exit(0);
