/**
 * ヨミトク放送室・議事録ラジオ解説の台本をDBから読み出して表示する。
 * 台本はファイルではなくDB（PodcastEpisode.script / ArticleAudioBriefing.script）にしか
 * 存在しないため、収録前のレビューはこのスクリプトで行う。
 *
 * 放送室と議事録ラジオ解説は別セッションで作業しているため、--kind で扱う種別を絞れる。
 *
 * Usage:
 *   npx tsx scripts/show-audio-scripts.mjs                 # DRAFTの台本を全文表示（両方の種別）
 *   npx tsx scripts/show-audio-scripts.mjs --kind radio    # 放送室だけ（briefing で議事録ラジオ解説だけ）
 *   npx tsx scripts/show-audio-scripts.mjs --all           # PUBLISHED済みも含める
 *   npx tsx scripts/show-audio-scripts.mjs --id <id>       # ID指定（statusを問わない）
 *   npx tsx scripts/show-audio-scripts.mjs --out <dir>     # VOICEVOX読み込み用テキストも書き出す
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
// 固定CTAは放送室の全エピソード共通。ここを参照しておけば文言が変わっても本編との境目がずれない
const { PROMO_SEGMENT } = await import("../src/lib/podcast.ts");

// 確定済みのキャスティング。VOICEVOXのテキスト読み込みは「キャラクター名,セリフ」形式で
// 話者を割り当てられるため、この名前をそのまま行頭に出力する
const VOICE = {
  gori: { label: "ゴリ編集長", voicevox: "青山龍星" },
  gray: { label: "ミスグレー", voicevox: "春日部つむぎ" },
};

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(name);
const getOpt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const targetId = getOpt("--id");
const showAll = hasFlag("--all");
const outDir = getOpt("--out");
const kind = getOpt("--kind");

if (kind && !["radio", "briefing"].includes(kind)) {
  console.error(`--kind は radio（放送室）か briefing（議事録ラジオ解説）を指定してください: ${kind}`);
  process.exit(1);
}

const statusFilter = targetId || showAll ? {} : { status: "DRAFT" };

const episodes = kind === "briefing" ? [] : await prisma.podcastEpisode.findMany({
  where: targetId ? { id: targetId } : statusFilter,
  orderBy: { createdAt: "desc" },
  include: { sourceDoc: { select: { title: true, url: true } } },
});

const briefings = kind === "radio" ? [] : await prisma.articleAudioBriefing.findMany({
  where: targetId ? { id: targetId } : statusFilter,
  orderBy: { createdAt: "desc" },
  include: { siteDocument: { select: { title: true, url: true } } },
});

const jst = (d) =>
  new Date(d).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", dateStyle: "medium", timeStyle: "short" });

const countChars = (lines) => lines.reduce((sum, l) => sum + l.text.length, 0);

// 末尾が固定CTAと一致していれば、本編とCTAを分けて数える（本編の尺だけを見たいため）
function splitPromo(script) {
  const tail = script.slice(-PROMO_SEGMENT.length);
  const isPromo =
    tail.length === PROMO_SEGMENT.length &&
    tail.every((line, i) => line.text === PROMO_SEGMENT[i].text);
  return isPromo
    ? { body: script.slice(0, -PROMO_SEGMENT.length), promo: tail }
    : { body: script, promo: [] };
}

function printScript(kind, item, sourceTitle) {
  const script = item.script ?? [];
  const { body, promo } = splitPromo(script);

  console.log("");
  console.log("=".repeat(78));
  console.log(`${kind}  [${item.status}]  ${item.title}`);
  console.log("=".repeat(78));
  console.log(`  id        : ${item.id}`);
  console.log(`  作成      : ${jst(item.createdAt)}`);
  if (item.publishedAt) console.log(`  公開      : ${jst(item.publishedAt)}`);
  if (sourceTitle) console.log(`  元記事    : ${sourceTitle}`);
  console.log(`  紹介文    : ${item.description}（${item.description.length}字）`);
  console.log(
    `  尺の目安  : 本編 ${body.length}行 / ${countChars(body)}字` +
      (promo.length ? `　＋ 固定CTA ${promo.length}行 / ${countChars(promo)}字` : "")
  );
  console.log("-".repeat(78));

  body.forEach((line, i) => {
    const who = VOICE[line.speaker]?.label ?? line.speaker;
    console.log(`${String(i + 1).padStart(3)} ${who.padEnd(7, "　")} ${line.text}`);
  });

  if (promo.length) {
    console.log("-".repeat(78));
    console.log("  ↓ ここから固定CTA（podcast.tsのPROMO_SEGMENT／台本ごとの編集不要）");
    promo.forEach((line, i) => {
      const who = VOICE[line.speaker]?.label ?? line.speaker;
      console.log(`${String(body.length + i + 1).padStart(3)} ${who.padEnd(7, "　")} ${line.text}`);
    });
  }
}

// VOICEVOXの「テキスト読み込み」に渡す形式。1行1セリフ、行頭に話者名＋半角カンマ。
// セリフ側のカンマは触らない（「826,500円」を全角にすると数字として読まれなくなるため。
// 話者名にカンマは入らないので、最初のカンマが区切りとして機能する）
function writeVoicevoxText(kind, item, dir) {
  const safeTitle = item.title.replace(/[\/\\:*?"<>|]/g, "_");
  const file = path.join(dir, `${kind}_${safeTitle}_${item.id.slice(-6)}.txt`);
  const text = (item.script ?? [])
    .map((line) => `${VOICE[line.speaker]?.voicevox ?? line.speaker},${line.text}`)
    .join("\n");
  fs.writeFileSync(file, text + "\n", "utf8");
  return file;
}

if (outDir) fs.mkdirSync(outDir, { recursive: true });

for (const ep of episodes) {
  printScript("🎙 ヨミトク放送室", ep, ep.sourceDoc?.title);
  if (outDir) console.log(`\n  → VOICEVOX用テキスト: ${writeVoicevoxText("放送室", ep, outDir)}`);
}

for (const b of briefings) {
  printScript("📻 議事録ラジオ解説", b, b.siteDocument?.title);
  if (outDir) console.log(`\n  → VOICEVOX用テキスト: ${writeVoicevoxText("議事録解説", b, outDir)}`);
}

if (episodes.length === 0 && briefings.length === 0) {
  console.log(targetId ? `該当する台本が見つかりませんでした: ${targetId}` : "未収録（DRAFT）の台本はありません。");
}

await prisma.$disconnect();
