/**
 * 台本（放送室・議事録ラジオ解説）を音声合成し、1本のmp3にする。
 *
 * エンジンは2つ。放送室は掛け合いの自然さを理由にGemini TTSへ移行済み（2026-08-04）。
 *   gemini   … Gemini TTS。2話者をまとめて生成するため掛け合いが自然。従量課金（1本15〜20円程度）
 *   voicevox … ローカルのVOICEVOXエンジン。無料だが1行ずつの合成なので掛け合いは平坦
 *
 * 事前準備:
 *   - gemini: .env.local の GEMINI_API_KEY
 *   - voicevox: VOICEVOX（エンジン）を起動しておく
 *   - どちらも ffmpeg / ffprobe
 *
 * 放送室と議事録ラジオ解説は別セッションで作業しているため、種別の取り違えを防ぐべく
 * --kind か --id のどちらかを必ず指定させる（引数なしで別種別を拾わせない）。
 *
 * Usage:
 *   npx tsx scripts/synthesize-audio-script.mjs --kind radio       # 最新のDRAFT放送室台本を合成
 *   npx tsx scripts/synthesize-audio-script.mjs --kind briefing    # 最新のDRAFT議事録ラジオ解説を合成
 *   npx tsx scripts/synthesize-audio-script.mjs --id <id>          # ID指定（status不問・種別自動判別）
 *   npx tsx scripts/synthesize-audio-script.mjs --kind radio --engine voicevox   # エンジンを明示
 *   npx tsx scripts/synthesize-audio-script.mjs --kind radio --out <dir>         # 出力先（既定: ./tmp/audio）
 *
 * 出力:
 *   <out>/<タイトル>.mp3        音声本体
 *   <out>/<タイトル>_カナ.txt   全行の読み。VOICEVOXのみ（audio_queryのカナ）
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

const LABEL = { gori: "ゴリ編集長", gray: "ミスグレー" };

// --- VOICEVOX ---
const VOICEVOX_ENGINE = "http://127.0.0.1:50021";
// IDは /speakers で確認できる（青山龍星:ノーマル / 春日部つむぎ:ノーマル）
const VV_SPEAKER = { gori: 13, gray: 8 };
const VV_GAP_SEC = 0.35;

// --- Gemini TTS ---
// オーディションで確定した組み合わせ。ゴリ編集長=Sadaltager（落ち着いたベテラン）／
// ミスグレー=Leda（若々しい新人）。全30種は https://ai.google.dev/gemini-api/docs/speech-generation
const GEMINI_VOICE = { gori: "Sadaltager", gray: "Leda" };
const GEMINI_MODEL = "gemini-3.1-flash-tts-preview";
// 長い台本を1リクエストで生成させると、後半ほど話速が上がり声質もぶれる（自己回帰生成の途中で
// テンポの基準を取り直せないため）。25行一括で0.153秒/字まで加速した実測があり、5行ずつに
// 区切ると0.169秒/字と短文単体（0.176秒/字）に近づく。ここは安易に増やさないこと
const GEMINI_CHUNK_LINES = 5;
const GEMINI_CHUNK_GAP_SEC = 0.3;
const GEMINI_STYLE = [
  "次は介護保険制度を解説するラジオ番組の会話です。落ち着いた一定のテンポで、自然な掛け合いで読み上げてください。",
  `${LABEL.gori}は落ち着いた頼れるベテラン編集長、${LABEL.gray}は好奇心旺盛な新人記者です。`,
];

const args = process.argv.slice(2);
const getOpt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const targetId = getOpt("--id");
const kind = getOpt("--kind");
const engineOpt = getOpt("--engine");
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
if (engineOpt && !["gemini", "voicevox"].includes(engineOpt)) {
  console.error(`--engine は gemini か voicevox を指定してください: ${engineOpt}`);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
// 放送室・議事録ラジオ解説ともGeminiへ移行済み（2026-08-04）。声はどちらも
// Sadaltager × Leda で共通。VOICEVOXに戻す場合のみ --engine voicevox を明示する
const engine = engineOpt ?? "gemini";

console.log(`${kindLabel}: ${item.title}（${item.script.length}行 / ${item.script.reduce((n, l) => n + l.text.length, 0)}字）`);
console.log(`エンジン: ${engine}\n`);

fs.mkdirSync(outDir, { recursive: true });
const safeTitle = item.title.replace(/[\/\\:*?"<>|]/g, "_");
const mp3 = path.join(outDir, `${kindLabel}_${safeTitle}.mp3`);

// ---- VOICEVOX: 1行ずつ合成してwavを連結する ----
async function buildVoicevox(work) {
  const res = await fetch(`${VOICEVOX_ENGINE}/version`).catch(() => null);
  if (!res?.ok) throw new Error(`VOICEVOXエンジン（${VOICEVOX_ENGINE}）に接続できません。VOICEVOXを起動してから実行してください。`);

  const kana = [];
  const wavs = [];
  for (const [i, line] of item.script.entries()) {
    const sp = VV_SPEAKER[line.speaker];
    if (sp === undefined) throw new Error(`未知の話者 (${i + 1}行目): ${line.speaker}`);

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
    kana.push(`${String(i + 1).padStart(3)} [${line.speaker}] ${query.kana}`);
    process.stdout.write(".");
  }
  process.stdout.write("\n");

  const list = path.join(work, "list.txt");
  fs.writeFileSync(list, wavs.map((f) => `file '${f}'`).join("\n"), "utf8");
  execFileSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", list,
    "-ar", "44100", "-ac", "1", "-b:a", "128k", mp3], { stdio: "pipe" });

  const kanaFile = path.join(outDir, `${kindLabel}_${safeTitle}_カナ.txt`);
  fs.writeFileSync(kanaFile, kana.join("\n") + "\n", "utf8");
  return kanaFile;
}

// ---- Gemini TTS: 2話者をまとめて、数行ずつに区切って生成する ----
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
    // 混雑時に500/503が返ることがある（"experiencing high demand"）。時間を置けば通るので待って再試行する
    if (res.status >= 500 && attempt <= 5) {
      const wait = 15 * attempt;
      process.stdout.write(`(${res.status}: ${wait}秒待機)`);
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

async function buildGemini(work) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error(".env.local に GEMINI_API_KEY がありません（https://aistudio.google.com/apikey で取得）");
  for (const [i, line] of item.script.entries()) {
    if (!LABEL[line.speaker]) throw new Error(`未知の話者 (${i + 1}行目): ${line.speaker}`);
  }

  const chunkSize = Number(getOpt("--chunk") ?? GEMINI_CHUNK_LINES);
  const chunks = [];
  for (let i = 0; i < item.script.length; i += chunkSize) chunks.push(item.script.slice(i, i + chunkSize));

  let rate = 24000, channels = 1;
  const pcms = [];
  for (const [i, chunk] of chunks.entries()) {
    if (i > 0) await sleep(3000);
    const audio = await geminiSynth(chunk, key);
    rate = audio.sample_rate ?? rate;
    channels = audio.channels ?? channels;
    pcms.push(Buffer.from(audio.data, "base64"));
    // 区切りの継ぎ目に短い無音を入れて、詰まって聞こえないようにする
    if (i < chunks.length - 1) pcms.push(Buffer.alloc(Math.round(rate * 2 * channels * GEMINI_CHUNK_GAP_SEC)));
    process.stdout.write(`#${i + 1 < chunks.length ? "" : "\n"}`);
  }

  const pcm = path.join(work, "raw.pcm");
  fs.writeFileSync(pcm, Buffer.concat(pcms));
  execFileSync("ffmpeg", ["-y", "-f", "s16le", "-ar", String(rate), "-ac", String(channels),
    "-i", pcm, "-ar", "44100", "-b:a", "128k", mp3], { stdio: "pipe" });
  return null;
}

const work = fs.mkdtempSync(path.join(outDir, ".synth-"));
try {
  const kanaFile = engine === "gemini" ? await buildGemini(work) : await buildVoicevox(work);

  const durationSec = Math.round(Number(execFileSync("ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", mp3],
    { encoding: "utf8" }).trim()));
  const chars = item.script.reduce((n, l) => n + l.text.length, 0);

  console.log(`\nmp3      : ${mp3}`);
  if (kanaFile) console.log(`読みカナ : ${kanaFile}`);
  console.log(`長さ     : ${durationSec}秒（${Math.floor(durationSec / 60)}分${durationSec % 60}秒）`);
  console.log(`話速     : ${(durationSec / chars).toFixed(3)}秒/字（速すぎるときは --chunk を減らす）`);
  console.log(`サイズ   : ${(fs.statSync(mp3).size / 1024 / 1024).toFixed(1)}MB`);
  console.log(`\n公開時に渡す値: episodeId=${item.id} durationSec=${durationSec}`);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
