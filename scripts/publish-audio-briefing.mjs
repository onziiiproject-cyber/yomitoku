/**
 * 合成済みのmp3をVercel Blobへアップロードし、議事録ラジオ解説を公開する。
 *
 * 公開すると本番APIが走り、statusがPUBLISHEDになる。個別のLINE配信は行われず、
 * 次回の週刊ヨミトク（水曜）のカルーセルに自動的に乗る。
 * 取り消せないので、既定はドライラン。--publish を付けたときだけ実際に公開する。
 *
 * Usage:
 *   npx tsx scripts/publish-audio-briefing.mjs --id <台本id>              # 内容の確認だけ（何も変更しない）
 *   npx tsx scripts/publish-audio-briefing.mjs --id <台本id> --publish    # アップロード＋公開
 *   npx tsx scripts/publish-audio-briefing.mjs --id <台本id> --mp3 <path> # mp3を明示（既定は tmp/audio から探す）
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

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
const doPublish = args.includes("--publish");

if (!targetId) { console.error("--id <台本id> を指定してください"); process.exit(1); }

const { prisma } = await import("../src/lib/prisma.ts");

const briefing = await prisma.articleAudioBriefing.findUnique({
  where: { id: targetId },
  include: { siteDocument: { select: { title: true, tags: true } } },
});
if (!briefing) { console.error(`台本が見つかりません: ${targetId}`); process.exit(1); }

// 合成スクリプトの出力名と揃えてある
const mp3 = getOpt("--mp3") ?? path.join(
  ROOT, "tmp/audio",
  `議事録解説_${briefing.title.replace(/[\/\\:*?"<>|]/g, "_")}.mp3`
);
if (!fs.existsSync(mp3)) {
  console.error(`mp3が見つかりません: ${mp3}`);
  console.error("先に synthesize-audio-script.mjs で合成してください。");
  process.exit(1);
}

const durationSec = Math.round(Number(execFileSync("ffprobe",
  ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", mp3],
  { encoding: "utf8" }).trim()));

console.log(`台本    : ${briefing.title}`);
console.log(`状態    : ${briefing.status}`);
console.log(`mp3     : ${mp3}`);
console.log(`長さ    : ${durationSec}秒（${Math.floor(durationSec / 60)}分${durationSec % 60}秒）／${(fs.statSync(mp3).size / 1024 / 1024).toFixed(1)}MB`);
// 公開時の個別LINE配信は廃止済み。次回の週刊ヨミトク（水曜）のカルーセルに乗る
console.log(`LINE配信: なし（次回の週刊ヨミトクのカルーセルに掲載）`);

if (briefing.status === "PUBLISHED") {
  console.log("\n既に公開済みです。重複を避けるため中止します。");
  await prisma.$disconnect();
  process.exit(0);
}

if (!doPublish) {
  console.log("\n（ドライラン。--publish を付けると アップロード → 公開 まで実行します）");
  await prisma.$disconnect();
  process.exit(0);
}

await prisma.$disconnect();

const { put } = await import("@vercel/blob");
const blob = await put(`audio-briefing/${targetId}.mp3`, fs.readFileSync(mp3), {
  access: "public",
  contentType: "audio/mpeg",
  token: process.env.BLOB_READ_WRITE_TOKEN,
});
console.log(`\nアップロード完了: ${blob.url}`);

const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/audio-briefing-publish`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-admin-secret": process.env.ADMIN_SECRET },
  body: JSON.stringify({ briefingId: targetId, audioUrl: blob.url, durationSec }),
});

const json = await res.json().catch(() => ({}));
if (!res.ok) { console.error(`公開に失敗: ${res.status} ${JSON.stringify(json)}`); process.exit(1); }

console.log(`公開完了: status=${json.status}`);
