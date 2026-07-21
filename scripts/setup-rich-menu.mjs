/**
 * LINEリッチメニュー生成・登録スクリプト
 *
 * Usage:
 *   node scripts/setup-rich-menu.mjs
 *
 * 必要な環境変数 (.env.local から読み込み):
 *   LINE_CHANNEL_ACCESS_TOKEN
 *   NEXT_PUBLIC_LIFF_LIBRARY_ID     (記事ライブラリ LIFF)
 *   NEXT_PUBLIC_LIFF_TAGS_ID        (タグ設定 LIFF) ← LINE Developersで新規作成
 *   NEXT_PUBLIC_APP_URL             (本番HTTPS URL)
 */

import { readFileSync } from "fs";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// .env.local を手動パース
const env = Object.fromEntries(
  readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const [k, ...rest] = l.split("=");
      return [k.trim(), rest.join("=").trim().replace(/^["']|["']$/g, "")];
    })
);

const ACCESS_TOKEN    = env.LINE_CHANNEL_ACCESS_TOKEN;
const LIFF_LIBRARY_URL = `https://liff.line.me/${env.NEXT_PUBLIC_LIFF_LIBRARY_ID}`;
const LIFF_TAGS_URL    = `https://liff.line.me/${env.NEXT_PUBLIC_LIFF_TAGS_ID ?? env.NEXT_PUBLIC_LIFF_ID}`;
const BASE_URL         = `${env.NEXT_PUBLIC_APP_URL}/base`;
const SPOTIFY_SHOW_URL = "https://open.spotify.com/show/033TlBFRkPM02RusVb5Xl6";

if (!ACCESS_TOKEN) {
  console.error("LINE_CHANNEL_ACCESS_TOKEN が設定されていません");
  process.exit(1);
}
if (!env.NEXT_PUBLIC_LIFF_TAGS_ID) console.warn("⚠️  NEXT_PUBLIC_LIFF_TAGS_ID 未設定 — LIFF_IDで代替");

// ────────────────────────────────────────────────────────
// 1. リッチメニュー画像を生成
// ────────────────────────────────────────────────────────
async function buildImage() {
  const W = 2500, H = 1686;
  const topH = 1124; // 上 2/3
  const botH = H - topH; // 下 1/3 = 562
  const halfW = W / 2; // 1250

  // アイコン読み込み・リサイズ
  const [searchIcon, tagIcon, baseLogo] = await Promise.all([
    sharp(path.join(ROOT, "public/design/assets/07-icons/icon-search.png"))
      .resize(320, null)
      .toBuffer(),
    sharp(path.join(ROOT, "public/design/assets/07-icons/icon-tag.png"))
      .resize(220, null)
      .toBuffer(),
    sharp(path.join(ROOT, "public/icons/logo-base-horizontal.png"))
      .resize(380, null)
      .toBuffer(),
  ]);

  const searchMeta = await sharp(searchIcon).metadata();
  const tagMeta    = await sharp(tagIcon).metadata();
  const baseMeta   = await sharp(baseLogo).metadata();

  // SVGベース
  const fontStack = "Hiragino Kaku Gothic ProN, Hiragino Sans, Noto Sans JP, sans-serif";
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <!-- 上エリア（記事検索）: ティール -->
    <rect x="0" y="0" width="${W}" height="${topH}" fill="#0D686E"/>

    <!-- 下エリア左（タグ設定）: 濃いティール -->
    <rect x="0" y="${topH}" width="${halfW}" height="${botH}" fill="#0A5459"/>

    <!-- 下エリア右（BASEを開く）: 薄いティール -->
    <rect x="${halfW}" y="${topH}" width="${halfW}" height="${botH}" fill="#E6F4F2"/>

    <!-- 区切り線 -->
    <line x1="0" y1="${topH}" x2="${W}" y2="${topH}" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
    <line x1="${halfW}" y1="${topH}" x2="${halfW}" y2="${H}" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>

    <!-- 上: 主テキスト -->
    <text x="${W / 2}" y="${topH / 2 + 100}"
      font-family="${fontStack}"
      font-size="100" font-weight="700"
      fill="white" text-anchor="middle" dominant-baseline="middle">
      過去の記事を検索する
    </text>
    <text x="${W / 2}" y="${topH / 2 + 210}"
      font-family="${fontStack}"
      font-size="50"
      fill="rgba(255,255,255,0.65)" text-anchor="middle" dominant-baseline="middle">
      介護保険最新情報のアーカイブ
    </text>

    <!-- 下左: タグ設定テキスト -->
    <text x="${halfW / 2}" y="${topH + botH / 2 + 70}"
      font-family="${fontStack}"
      font-size="72" font-weight="700"
      fill="white" text-anchor="middle" dominant-baseline="middle">
      タグ設定
    </text>
    <text x="${halfW / 2}" y="${topH + botH / 2 + 150}"
      font-family="${fontStack}"
      font-size="40"
      fill="rgba(255,255,255,0.6)" text-anchor="middle" dominant-baseline="middle">
      配信カテゴリを変更する
    </text>

    <!-- 下右: BASEを開くテキスト -->
    <text x="${halfW + halfW / 2}" y="${topH + botH / 2 + 70}"
      font-family="${fontStack}"
      font-size="72" font-weight="700"
      fill="#0D686E" text-anchor="middle" dominant-baseline="middle">
      ヨミトクBASEを開く
    </text>
    <text x="${halfW + halfW / 2}" y="${topH + botH / 2 + 150}"
      font-family="${fontStack}"
      font-size="40"
      fill="#555" text-anchor="middle" dominant-baseline="middle">
      過去の記事・設定
    </text>
  </svg>`;

  // アイコン合成位置
  const searchLeft = Math.floor(W / 2 - (searchMeta.width ?? 320) / 2);
  const searchTop  = Math.floor(topH / 2 - (searchMeta.height ?? 160) / 2 - 120);

  const tagLeft = Math.floor(halfW / 2 - (tagMeta.width ?? 220) / 2);
  const tagTop  = Math.floor(topH + botH / 2 - (tagMeta.height ?? 110) / 2 - 90);

  const baseLeft = Math.floor(halfW + halfW / 2 - (baseMeta.width ?? 380) / 2);
  const baseTop  = Math.floor(topH + botH / 2 - (baseMeta.height ?? 80) / 2 - 90);

  const outPath = path.join(ROOT, "public/rich-menu.png");
  await sharp(Buffer.from(svg))
    .png()
    .composite([
      { input: searchIcon, top: searchTop, left: searchLeft },
      { input: tagIcon,    top: tagTop,    left: tagLeft },
      { input: baseLogo,   top: baseTop,   left: baseLeft },
    ])
    .toFile(outPath);

  console.log(`✅ 画像生成: ${outPath}`);
  return outPath;
}

// ────────────────────────────────────────────────────────
// 2. LINE API ヘルパー
// ────────────────────────────────────────────────────────
async function lineApi(method, endpoint, body) {
  const res = await fetch(`https://api.line.me/v2/bot${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      ...(body instanceof Buffer
        ? { "Content-Type": "image/png" }
        : { "Content-Type": "application/json" }),
    },
    body: body instanceof Buffer ? body : (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`LINE API ${method} ${endpoint} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

// ────────────────────────────────────────────────────────
// 3. リッチメニュー作成・設定
// ────────────────────────────────────────────────────────
async function setupRichMenu(imagePath) {
  // 画像: 1536×1024  上部=655px（編集室へ）  下3等分=512px（タグ設定・機能要望・個別相談）
  const W = 1536, H = 1024, splitY = 655, colW = Math.round(W / 3);
  const isJpeg = imagePath.endsWith(".jpg") || imagePath.endsWith(".jpeg");

  // 3-1. 既存削除
  const listRes = await lineApi("GET", "/richmenu/list");
  for (const rm of listRes.richmenus ?? []) {
    await fetch(`https://api.line.me/v2/bot/richmenu/${rm.richMenuId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    console.log(`🗑  削除: ${rm.richMenuId}`);
  }

  // 3-2. リッチメニュー作成
  const { richMenuId } = await lineApi("POST", "/richmenu", {
    size:        { width: W, height: H },
    selected:    true,
    name:        "ヨミトク編集部メニュー",
    chatBarText: "編集室を開く",
    areas: [
      {
        bounds: { x: 0, y: 0, width: W, height: splitY },
        action: { type: "uri", label: "ヨミトク編集室へ", uri: BASE_URL },
      },
      {
        bounds: { x: 0, y: splitY, width: colW, height: H - splitY },
        action: { type: "uri", label: "タグ設定", uri: LIFF_TAGS_URL },
      },
      {
        bounds: { x: colW, y: splitY, width: colW, height: H - splitY },
        action: { type: "uri", label: "ヨミトク放送室", uri: SPOTIFY_SHOW_URL },
      },
      {
        bounds: { x: colW * 2, y: splitY, width: W - colW * 2, height: H - splitY },
        action: {
          type:  "message",
          label: "個別に相談する",
          text:  "個別相談サービスは現在準備中です。もうしばらくお待ちください！",
        },
      },
    ],
  });
  console.log(`✅ リッチメニュー作成: ${richMenuId}`);

  // 3-3. 画像アップロード（api-data.line.me）
  const imageBuffer = readFileSync(imagePath);
  const uploadRes = await fetch(
    `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
    {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": isJpeg ? "image/jpeg" : "image/png",
      },
      body: imageBuffer,
    }
  );
  if (!uploadRes.ok) throw new Error(`画像アップロード失敗 ${uploadRes.status}: ${await uploadRes.text()}`);
  console.log("✅ 画像アップロード完了");

  // 3-4. 全ユーザーに設定
  const setRes = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
    method:  "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
  if (!setRes.ok) throw new Error(`デフォルト設定失敗: ${await setRes.text()}`);
  console.log("✅ 全ユーザーにリッチメニューを設定しました");

  return richMenuId;
}

// ────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────
(async () => {
  try {
    // rich-menu.jpg があればそれを使用、なければ自動生成
    const jpegPath = path.join(ROOT, "public/rich-menu.jpg");
    const pngPath  = path.join(ROOT, "public/rich-menu.png");
    let imagePath;

    try {
      readFileSync(jpegPath);
      imagePath = jpegPath;
      console.log("📁 既存の画像を使用: rich-menu.jpg");
    } catch {
      console.log("🎨 リッチメニュー画像を生成中...");
      imagePath = await buildImage();
      // PNG → JPEG 圧縮
      await sharp(imagePath).resize(1200, null).jpeg({ quality: 85 }).toFile(jpegPath);
      imagePath = jpegPath;
    }

    console.log("📡 LINE APIに登録中...");
    const id = await setupRichMenu(imagePath);

    console.log(`\n🎉 完了！ richMenuId: ${id}`);
  } catch (e) {
    console.error("❌ エラー:", e.message);
    process.exit(1);
  }
})();
