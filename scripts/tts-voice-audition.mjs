/**
 * Gemini TTSの声を複数まとめて試聴するためのオーディション用ツール。
 * 同じセリフを候補の声すべてで読ませ、1本のmp3につないで出す。
 * 各候補は自分の名前を名乗ってから本編を読むので、聴きながら選べる。
 *
 * 事前準備: .env.local に GEMINI_API_KEY / ffmpeg
 *
 * Usage:
 *   npx tsx scripts/tts-voice-audition.mjs --role gori     # ゴリ編集長の候補
 *   npx tsx scripts/tts-voice-audition.mjs --role gray     # ミスグレーの候補
 *   npx tsx scripts/tts-voice-audition.mjs --voices Charon,Orus,Gacrux --role gori
 *   npx tsx scripts/tts-voice-audition.mjs --role gori --throttle 3   # 有料枠なら間隔を詰められる
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

const MODEL = "gemini-3.1-flash-tts-preview";
const SAMPLE_RATE = 24000;
const GAP_SEC = 0.9;

// 名乗りは英語名だと読みが安定しないのでカナを併記する
const ROLES = {
  gori: {
    label: "ゴリ編集長",
    style: "落ち着いた頼れるベテラン編集長の口調で、少しフランクに",
    // 専門用語と話し言葉が混ざる、この番組らしい一節を選んだ
    text: "大きく3つあったな。ひとつ目が「送迎問題」、ふたつ目が「加算が複雑すぎる」、みっつ目が「認知症対応型通所介護の事業所が減り続けている」って話だ。どれも委員から結構熱のある発言が出てたよ。",
    voices: [
      ["Charon", "カロン"], ["Orus", "オルス"], ["Algenib", "アルゲニブ"], ["Gacrux", "ガクルックス"],
      ["Rasalgethi", "ラサルゲティ"], ["Sadaltager", "サダルタゲル"], ["Achird", "アキルド"], ["Zubenelgenubi", "ズベンエルゲヌビ"],
    ],
  },
  gray: {
    label: "ミスグレー",
    style: "好奇心旺盛な新人記者の口調で、明るく",
    text: "シャドーワーク…報酬として見えていない労働ってことですよね。それは確かに問題ですね。加算の話も気になります！",
    voices: [
      ["Leda", "レダ"], ["Zephyr", "ゼフィア"], ["Aoede", "アオイデ"], ["Autonoe", "アウトノエ"],
      ["Laomedeia", "ラオメデイア"], ["Sadachbia", "サダクビア"], ["Callirrhoe", "カリロエ"], ["Sulafat", "スラファト"],
    ],
  },
};

const args = process.argv.slice(2);
const getOpt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const roleKey = getOpt("--role") ?? "gori";
const role = ROLES[roleKey];
if (!role) { console.error(`--role は ${Object.keys(ROLES).join(" / ")} のいずれかです`); process.exit(1); }

const override = getOpt("--voices");
const voices = override
  ? override.split(",").map((v) => [v.trim(), v.trim()])
  : role.voices;

const outDir = path.resolve(getOpt("--out") ?? path.join(ROOT, "tmp/tts-compare"));
fs.mkdirSync(outDir, { recursive: true });

const key = process.env.GEMINI_API_KEY;
if (!key) { console.error(".env.local に GEMINI_API_KEY がありません"); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 無料枠は制限が厳しく（10リクエスト/分＋トークン量の制限）、7秒間隔でも429が連発した。
// 既定を45秒にしてある。有料枠なら --throttle 3 まで下げてよい
const THROTTLE_MS = Number(getOpt("--throttle") ?? 45) * 1000;

async function synth(voice, text, attempt = 1) {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      model: MODEL,
      input: `${role.style}読んでください: ${text}`,
      response_format: { type: "audio" },
      generation_config: { speech_config: [{ voice }] },
    }),
  });

  if (res.status === 429 && attempt <= 3) {
    const body = await res.text();
    // エラー本文が「Please retry in 47.5s」と待ち時間を教えてくれるので、それに従う
    const wait = Math.ceil(Number(body.match(/retry in ([\d.]+)s/)?.[1] ?? 30)) + 1;
    process.stdout.write(`(429: ${wait}秒待機)`);
    await sleep(wait * 1000);
    return synth(voice, text, attempt + 1);
  }

  if (!res.ok) throw new Error(`${voice}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const audio = (json.steps ?? []).flatMap((s) => s.content ?? []).find((c) => c.type === "audio" && c.data);
  if (!audio) throw new Error(`${voice}: 音声データなし`);
  return { pcm: Buffer.from(audio.data, "base64"), tokens: json.usage?.total_output_tokens ?? 0 };
}

const silence = Buffer.alloc(SAMPLE_RATE * 2 * GAP_SEC); // 16bitモノラルの無音
const chunks = [];
const order = [];
let tokens = 0;

for (const [i, [voice, kana]] of voices.entries()) {
  if (i > 0) await sleep(THROTTLE_MS);
  const text = `候補${i + 1}番、${kana}です。${role.text}`;
  try {
    const { pcm, tokens: t } = await synth(voice, text);
    chunks.push(pcm, silence);
    tokens += t;
    order.push(`  ${i + 1}. ${voice}`);
    process.stdout.write(".");
  } catch (e) {
    order.push(`  ${i + 1}. ${voice} ✗ ${e.message}`);
    process.stdout.write("x");
  }
}
process.stdout.write("\n");

// 全滅した場合はffmpegに空データを渡さず、理由を出して止める
if (chunks.length === 0) {
  console.error("すべての候補で合成に失敗しました:");
  console.error(order.join("\n"));
  process.exit(1);
}

const work = fs.mkdtempSync(path.join(outDir, ".aud-"));
try {
  const raw = path.join(work, "all.pcm");
  fs.writeFileSync(raw, Buffer.concat(chunks));
  const mp3 = path.join(outDir, `声オーディション_${role.label}.mp3`);
  execFileSync("ffmpeg", ["-y", "-f", "s16le", "-ar", String(SAMPLE_RATE), "-ac", "1", "-i", raw, "-b:a", "128k", mp3], { stdio: "pipe" });

  const sec = Math.round(Number(execFileSync("ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", mp3],
    { encoding: "utf8" }).trim()));

  console.log(`\n${role.label} 候補一覧:`);
  console.log(order.join("\n"));
  console.log(`\nmp3   : ${mp3}`);
  console.log(`長さ  : ${Math.floor(sec / 60)}分${sec % 60}秒`);
  console.log(`出力トークン: ${tokens}（約${(tokens / 1_000_000 * 10 * 150).toFixed(1)}円）`);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
