/**
 * 同じ台本の冒頭を VOICEVOX と Gemini TTS の両方で合成し、聴き比べ用のmp3を2本作る。
 * エンジンを選び直すときの判断材料をつくるためのツール。
 *
 * 事前準備:
 *   - VOICEVOX（エンジン）を起動しておく
 *   - .env.local に GEMINI_API_KEY（https://aistudio.google.com/apikey で取得）
 *   - ffmpeg / ffprobe
 *
 * Usage:
 *   npx tsx scripts/tts-compare.mjs --id <台本id>              # 冒頭6行を両方で合成
 *   npx tsx scripts/tts-compare.mjs --id <台本id> --lines 25   # 行数を変える
 *   npx tsx scripts/tts-compare.mjs --id <台本id> --only gemini
 *   npx tsx scripts/tts-compare.mjs --id <台本id> --chunk 5    # Geminiの分割行数
 *
 * 出力（既定: ./tmp/tts-compare）:
 *   <タイトル>_VOICEVOX.mp3
 *   <タイトル>_Gemini.mp3
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

const VOICEVOX_ENGINE = "http://127.0.0.1:50021";
// 旧キャスティング（青山龍星 / 春日部つむぎ）。聴き比べの基準として残してある
const VV_SPEAKER = { gori: 13, gray: 8 };
const VV_GAP_SEC = 0.35;

const LABEL = { gori: "ゴリ編集長", gray: "ミスグレー" };
// オーディションで確定した組み合わせ。ゴリ編集長=Sadaltager（知識のある落ち着き）／
// ミスグレー=Leda（若々しい）。全30種は
// https://ai.google.dev/gemini-api/docs/speech-generation を参照
const GEMINI_VOICE = { gori: "Sadaltager", gray: "Leda" };
const GEMINI_MODEL = "gemini-3.1-flash-tts-preview";

const args = process.argv.slice(2);
const getOpt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const targetId = getOpt("--id");
const lineCount = Number(getOpt("--lines") ?? 6);
const only = getOpt("--only"); // voicevox | gemini | 未指定=両方
const outDir = path.resolve(getOpt("--out") ?? path.join(ROOT, "tmp/tts-compare"));

if (!targetId) {
  console.error("--id <台本id> を指定してください（show-audio-scripts.mjs で確認できます）");
  process.exit(1);
}

const { prisma } = await import("../src/lib/prisma.ts");
const item =
  (await prisma.articleAudioBriefing.findUnique({ where: { id: targetId } })) ??
  (await prisma.podcastEpisode.findUnique({ where: { id: targetId } }));
await prisma.$disconnect();

if (!item) { console.error(`台本が見つかりません: ${targetId}`); process.exit(1); }

const lines = item.script.slice(0, lineCount);
const safeTitle = item.title.replace(/[\/\\:*?"<>|]/g, "_");
fs.mkdirSync(outDir, { recursive: true });

console.log(`台本: ${item.title}`);
console.log(`比較対象: 冒頭${lines.length}行 / ${lines.reduce((n, l) => n + l.text.length, 0)}字\n`);

const dur = (f) => Math.round(Number(execFileSync("ffprobe",
  ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", f],
  { encoding: "utf8" }).trim()));

// ---- VOICEVOX（1行ずつ合成して連結する。乗り換え前の本番と同じ作り方） ----
async function buildVoicevox() {
  const res = await fetch(`${VOICEVOX_ENGINE}/version`).catch(() => null);
  if (!res?.ok) throw new Error(`VOICEVOXエンジン（${VOICEVOX_ENGINE}）に接続できません。VOICEVOXを起動してください。`);

  const work = fs.mkdtempSync(path.join(outDir, ".vv-"));
  try {
    const wavs = [];
    for (const [i, line] of lines.entries()) {
      const sp = VV_SPEAKER[line.speaker];
      const q = await fetch(`${VOICEVOX_ENGINE}/audio_query?speaker=${sp}&text=${encodeURIComponent(line.text)}`, { method: "POST" });
      if (!q.ok) throw new Error(`audio_query失敗 (${i + 1}行目): ${q.status}`);
      const query = await q.json();
      query.postPhonemeLength = VV_GAP_SEC;

      const s = await fetch(`${VOICEVOX_ENGINE}/synthesis?speaker=${sp}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(query),
      });
      if (!s.ok) throw new Error(`synthesis失敗 (${i + 1}行目): ${s.status}`);

      const wav = path.join(work, `${String(i + 1).padStart(3, "0")}.wav`);
      fs.writeFileSync(wav, Buffer.from(await s.arrayBuffer()));
      wavs.push(wav);
      process.stdout.write(".");
    }
    const list = path.join(work, "list.txt");
    fs.writeFileSync(list, wavs.map((f) => `file '${f}'`).join("\n"), "utf8");
    const mp3 = path.join(outDir, `${safeTitle}_VOICEVOX.mp3`);
    execFileSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", list, "-ar", "44100", "-ac", "1", "-b:a", "128k", mp3], { stdio: "pipe" });
    return mp3;
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// ---- Gemini TTS（2話者をまとめて合成する） ----
// 長い台本を1リクエストで一気に生成させると、後半にいくほど話速が上がり声質もぶれる
// （自己回帰生成で基準を取り直す機会がないため）。--chunk 行ずつに区切って投げ、
// 各区切りの先頭でテンポを基準に戻す。
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GEMINI_STYLE = [
  "次は介護保険制度を解説するラジオ番組の会話です。落ち着いた一定のテンポで、自然な掛け合いで読み上げてください。",
  `${LABEL.gori}は落ち着いた頼れるベテラン編集長、${LABEL.gray}は好奇心旺盛な新人記者です。`,
];

async function geminiSynth(chunk, key) {
  const input = [...GEMINI_STYLE, "", ...chunk.map((l) => `${LABEL[l.speaker]}: ${l.text}`)].join("\n");

  for (let attempt = 1; ; attempt++) {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        input,
        response_format: { type: "audio" },
        generation_config: {
          speech_config: [
            { speaker: LABEL.gori, voice: GEMINI_VOICE.gori },
            { speaker: LABEL.gray, voice: GEMINI_VOICE.gray },
          ],
        },
      }),
    });

    if (res.status === 429 && attempt <= 3) {
      const body = await res.text();
      const wait = Math.ceil(Number(body.match(/retry in ([\d.]+)s/)?.[1] ?? 30)) + 1;
      process.stdout.write(`(429: ${wait}秒待機)`);
      await sleep(wait * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`Gemini TTS失敗: ${res.status} ${(await res.text()).slice(0, 400)}`);

    const json = await res.json();
    // 音声は steps[].content[] の type:"audio" に入って返る（mime_type: audio/l16 の生PCM）。
    // ドキュメントにある output_audio.data では取れない
    const audio = (json.steps ?? []).flatMap((s) => s.content ?? []).find((c) => c.type === "audio" && c.data);
    if (!audio) throw new Error(`音声データが見つかりません: ${JSON.stringify(json).slice(0, 400)}`);
    return audio;
  }
}

async function buildGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error(".env.local に GEMINI_API_KEY がありません（https://aistudio.google.com/apikey で取得）");

  const chunkSize = Number(getOpt("--chunk") ?? 6);
  const chunks = [];
  for (let i = 0; i < lines.length; i += chunkSize) chunks.push(lines.slice(i, i + chunkSize));

  let rate = 24000, channels = 1;
  const pcms = [];
  for (const [i, chunk] of chunks.entries()) {
    if (i > 0) await sleep(3000);
    const audio = await geminiSynth(chunk, key);
    rate = audio.sample_rate ?? rate;
    channels = audio.channels ?? channels;
    pcms.push(Buffer.from(audio.data, "base64"));
    // 区切りの継ぎ目に短い無音を入れて、詰まって聞こえないようにする
    if (i < chunks.length - 1) pcms.push(Buffer.alloc(Math.round(rate * 2 * channels * 0.3)));
    process.stdout.write("#");
  }

  const work = fs.mkdtempSync(path.join(outDir, ".gm-"));
  try {
    const pcm = path.join(work, "raw.pcm");
    fs.writeFileSync(pcm, Buffer.concat(pcms));
    const mp3 = path.join(outDir, `${safeTitle}_Gemini.mp3`);
    execFileSync("ffmpeg", ["-y", "-f", "s16le", "-ar", String(rate), "-ac", String(channels),
      "-i", pcm, "-b:a", "128k", mp3], { stdio: "pipe" });
    return mp3;
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

const results = [];
for (const [name, fn] of [["VOICEVOX", buildVoicevox], ["Gemini", buildGemini]]) {
  if (only && only.toLowerCase() !== name.toLowerCase()) continue;
  try {
    const mp3 = await fn();
    process.stdout.write("\n");
    results.push(`${name.padEnd(9)} ${dur(mp3)}秒  ${mp3}`);
  } catch (e) {
    process.stdout.write("\n");
    results.push(`${name.padEnd(9)} ✗ ${e.message}`);
  }
}

console.log("\n" + results.join("\n"));
