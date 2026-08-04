/**
 * 台本（放送室・議事録ラジオ解説）をローカルのVOICEVOXエンジンで音声合成し、1本のmp3にする。
 * VOICEVOXアプリのGUIを開かずに済むが、イントネーションを細かく詰めたい回はGUIで作ってよい。
 *
 * 事前にVOICEVOX（エンジン）を起動しておくこと。ffmpeg/ffprobeも必要。
 *
 * 放送室と議事録ラジオ解説は別セッションで作業しているため、種別の取り違えを防ぐべく
 * --kind か --id のどちらかを必ず指定させる（引数なしで別種別を拾わせない）。
 *
 * Usage:
 *   npx tsx scripts/synthesize-audio-script.mjs --kind radio       # 最新のDRAFT放送室台本を合成
 *   npx tsx scripts/synthesize-audio-script.mjs --kind briefing    # 最新のDRAFT議事録ラジオ解説を合成
 *   npx tsx scripts/synthesize-audio-script.mjs --id <id>          # ID指定（status不問・種別自動判別）
 *   npx tsx scripts/synthesize-audio-script.mjs --kind radio --out <dir>  # 出力先（既定: ./tmp/audio）
 *
 * 出力:
 *   <out>/<タイトル>.mp3        音声本体
 *   <out>/<タイトル>_カナ.txt   全行の読み（audio_queryのカナ）。数字や固有名詞の読み間違いはここで確認する
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

const ENGINE = "http://127.0.0.1:50021";
// 確定済みのキャスティング。IDは /speakers で確認できる（青山龍星:ノーマル / 春日部つむぎ:ノーマル）
const SPEAKER = { gori: 13, gray: 8 };
// 行間の無音。詰まって聞こえないだけの最小限にしてある
const GAP_SEC = 0.35;

const args = process.argv.slice(2);
const getOpt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const targetId = getOpt("--id");
const kind = getOpt("--kind");
const outDir = path.resolve(getOpt("--out") ?? path.join(ROOT, "tmp/audio"));

if (!targetId && !kind) {
  console.error("--kind radio（放送室）か --kind briefing（議事録ラジオ解説）、または --id を指定してください。");
  console.error("種別の取り違えを防ぐため、引数なしでの自動選択はしません。");
  process.exit(1);
}
if (kind && !["radio", "briefing"].includes(kind)) {
  console.error(`--kind は radio か briefing を指定してください: ${kind}`);
  process.exit(1);
}

const versionRes = await fetch(`${ENGINE}/version`).catch(() => null);
if (!versionRes?.ok) {
  console.error(`VOICEVOXエンジン（${ENGINE}）に接続できません。VOICEVOXを起動してから実行してください。`);
  process.exit(1);
}

const { prisma } = await import("../src/lib/prisma.ts");

// 放送室・議事録ラジオ解説のどちらでも同じ形式（[{speaker, text}]）。
// --kind 指定時はその種別だけを見る。--id 指定時のみ、どちらのテーブルかを自動判別する
async function findTarget() {
  const where = targetId ? { id: targetId } : { status: "DRAFT" };
  const order = { createdAt: "desc" };

  if (kind !== "briefing") {
    const ep = await prisma.podcastEpisode.findFirst({ where, orderBy: order });
    if (ep) return { kind: "放送室", item: ep };
    if (kind === "radio") return null;
  }
  const br = await prisma.articleAudioBriefing.findFirst({ where, orderBy: order });
  if (br) return { kind: "議事録解説", item: br };
  return null;
}

const target = await findTarget();
await prisma.$disconnect();

if (!target) {
  const label = kind === "radio" ? "放送室" : kind === "briefing" ? "議事録ラジオ解説" : "";
  console.error(targetId ? `台本が見つかりません: ${targetId}` : `未収録（DRAFT）の${label}台本はありません。`);
  process.exit(1);
}

// 引数の --kind と名前が衝突するため、出力ラベル側は kindLabel で受ける
const { kind: kindLabel, item } = target;
console.log(`${kindLabel}: ${item.title}（${item.script.length}行）`);

fs.mkdirSync(outDir, { recursive: true });
const work = fs.mkdtempSync(path.join(outDir, ".synth-"));
const kana = [];
const wavs = [];

try {
  for (const [i, line] of item.script.entries()) {
    const speaker = SPEAKER[line.speaker];
    if (speaker === undefined) throw new Error(`未知の話者 (${i + 1}行目): ${line.speaker}`);

    const qRes = await fetch(`${ENGINE}/audio_query?speaker=${speaker}&text=${encodeURIComponent(line.text)}`, { method: "POST" });
    if (!qRes.ok) throw new Error(`audio_query失敗 (${i + 1}行目): ${qRes.status}`);
    const query = await qRes.json();
    query.postPhonemeLength = GAP_SEC;

    const sRes = await fetch(`${ENGINE}/synthesis?speaker=${speaker}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    if (!sRes.ok) throw new Error(`synthesis失敗 (${i + 1}行目): ${sRes.status}`);

    const wav = path.join(work, `${String(i + 1).padStart(3, "0")}.wav`);
    fs.writeFileSync(wav, Buffer.from(await sRes.arrayBuffer()));
    wavs.push(wav);
    kana.push(`${String(i + 1).padStart(3)} [${line.speaker}] ${query.kana}`);
    process.stdout.write(".");
  }
  process.stdout.write("\n");

  const safeTitle = item.title.replace(/[\/\\:*?"<>|]/g, "_");
  const listFile = path.join(work, "list.txt");
  fs.writeFileSync(listFile, wavs.map((f) => `file '${f}'`).join("\n"), "utf8");

  const mp3 = path.join(outDir, `${kindLabel}_${safeTitle}.mp3`);
  execFileSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile,
    "-ar", "44100", "-ac", "1", "-b:a", "128k", mp3], { stdio: "pipe" });

  const durationSec = Math.round(Number(execFileSync("ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", mp3],
    { encoding: "utf8" }).trim()));

  const kanaFile = path.join(outDir, `${kindLabel}_${safeTitle}_カナ.txt`);
  fs.writeFileSync(kanaFile, kana.join("\n") + "\n", "utf8");

  console.log(`\nmp3      : ${mp3}`);
  console.log(`読みカナ : ${kanaFile}`);
  console.log(`長さ     : ${durationSec}秒（${Math.floor(durationSec / 60)}分${durationSec % 60}秒）`);
  console.log(`サイズ   : ${(fs.statSync(mp3).size / 1024 / 1024).toFixed(1)}MB`);
  console.log(`\n公開時に渡す値: episodeId=${item.id} durationSec=${durationSec}`);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
