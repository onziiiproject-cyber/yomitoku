/**
 * 未登録ユーザー向け（登録前）リッチメニューを作成し、アカウント全体のデフォルトに設定する
 *
 * 既存の「ヨミトク編集部メニュー」（メンバー用）は削除せず、
 * .env.local の LINE_RICHMENU_MEMBER_ID として登録完了ユーザーに個別リンクする側に回す。
 *
 * Usage:
 *   node scripts/setup-rich-menu-before.mjs
 *
 * 必要な環境変数 (.env.local):
 *   LINE_CHANNEL_ACCESS_TOKEN
 *   NEXT_PUBLIC_LIFF_REGISTER_ID  (LINE Developersコンソールで作成した登録用LIFFのID)
 */

import { readFileSync } from "fs";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const env = Object.fromEntries(
  readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const [k, ...rest] = l.split("=");
      return [k.trim(), rest.join("=").trim().replace(/^["']|["']$/g, "")];
    })
);

const ACCESS_TOKEN = env.LINE_CHANNEL_ACCESS_TOKEN;
const LIFF_REGISTER_URL = `https://liff.line.me/${env.NEXT_PUBLIC_LIFF_REGISTER_ID}`;

if (!ACCESS_TOKEN) {
  console.error("LINE_CHANNEL_ACCESS_TOKEN が設定されていません");
  process.exit(1);
}
if (!env.NEXT_PUBLIC_LIFF_REGISTER_ID) {
  console.error("NEXT_PUBLIC_LIFF_REGISTER_ID が設定されていません。先にLINE Developersコンソールで登録用LIFFを作成してください。");
  process.exit(1);
}

async function lineApi(method, endpoint, body) {
  const res = await fetch(`https://api.line.me/v2/bot${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      ...(body instanceof Buffer ? { "Content-Type": "image/png" } : { "Content-Type": "application/json" }),
    },
    body: body instanceof Buffer ? body : (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`LINE API ${method} ${endpoint} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function buildImage() {
  const W = 2500, H = 1686;
  const fontStack = "Hiragino Kaku Gothic ProN, Hiragino Sans, Noto Sans JP, sans-serif";

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#0D686E"/>
    <text x="${W / 2}" y="${H / 2 - 140}"
      font-family="${fontStack}" font-size="90" font-weight="700"
      fill="white" text-anchor="middle" dominant-baseline="middle">
      🔐 事業所コードを登録する
    </text>
    <text x="${W / 2}" y="${H / 2 + 20}"
      font-family="${fontStack}" font-size="48"
      fill="rgba(255,255,255,0.75)" text-anchor="middle" dominant-baseline="middle">
      タップして事業所コードを入力すると
    </text>
    <text x="${W / 2}" y="${H / 2 + 90}"
      font-family="${fontStack}" font-size="48"
      fill="rgba(255,255,255,0.75)" text-anchor="middle" dominant-baseline="middle">
      週刊ヨミトクの配信が始まります
    </text>
  </svg>`;

  const outPath = path.join(ROOT, "public/rich-menu-before.png");
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`✅ 画像生成: ${outPath}`);
  return outPath;
}

async function setupBeforeRichMenu(imagePath) {
  const W = 1536, H = 1024;

  const { richMenuId } = await lineApi("POST", "/richmenu", {
    size: { width: W, height: H },
    selected: true,
    name: "ヨミトク登録前メニュー",
    chatBarText: "事業所コードを登録する",
    areas: [
      {
        bounds: { x: 0, y: 0, width: W, height: H },
        action: { type: "uri", label: "事業所コードを登録する", uri: LIFF_REGISTER_URL },
      },
    ],
  });
  console.log(`✅ リッチメニュー作成: ${richMenuId}`);

  const jpegPath = path.join(ROOT, "public/rich-menu-before.jpg");
  await sharp(imagePath).resize(W, H, { fit: "cover" }).jpeg({ quality: 90 }).toFile(jpegPath);
  const imageBuffer = readFileSync(jpegPath);

  const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "image/jpeg" },
    body: imageBuffer,
  });
  if (!uploadRes.ok) throw new Error(`画像アップロード失敗 ${uploadRes.status}: ${await uploadRes.text()}`);
  console.log("✅ 画像アップロード完了");

  // これをアカウント全体のデフォルトにする（新規フォロー時はこちらが表示される）
  const setRes = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
  if (!setRes.ok) throw new Error(`デフォルト設定失敗: ${await setRes.text()}`);
  console.log("✅ 全ユーザーのデフォルトに設定しました（未登録者はこのメニューを見ます）");

  return richMenuId;
}

(async () => {
  try {
    const sourcePath = path.join(ROOT, "public/rich-menu-assets/before-source.png");
    let imagePath;
    try {
      readFileSync(sourcePath);
      imagePath = sourcePath;
      console.log("📁 既存のデザイン画像を使用: public/rich-menu-assets/before-source.png");
    } catch {
      console.log("🎨 リッチメニュー画像を生成中...");
      imagePath = await buildImage();
    }

    console.log("📡 LINE APIに登録中...");
    const id = await setupBeforeRichMenu(imagePath);

    console.log(`\n🎉 完了！ 登録前メニュー richMenuId: ${id}`);
    console.log("既存のメンバー用メニューは削除されていません。今後は各ユーザーのニックネーム設定完了時に個別リンクされます。");
  } catch (e) {
    console.error("❌ エラー:", e.message);
    process.exit(1);
  }
})();
