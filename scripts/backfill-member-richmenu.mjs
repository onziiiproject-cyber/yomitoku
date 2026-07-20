/**
 * 既にニックネーム設定済み（アクティブ登録済み）の全ユーザーに、
 * メンバー用リッチメニューを個別リンクする。
 *
 * setup-rich-menu-before.mjs でアカウント全体のデフォルトを「登録前メニュー」に
 * 切り替えた直後に一度だけ実行し、既存メンバーが登録前メニューに巻き戻らないようにする。
 *
 * Usage:
 *   node scripts/backfill-member-richmenu.mjs
 */

import { readFileSync } from "fs";
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
const MEMBER_MENU_ID = env.LINE_RICHMENU_MEMBER_ID;
const DATABASE_URL = env.DATABASE_URL;

if (!ACCESS_TOKEN || !MEMBER_MENU_ID || !DATABASE_URL) {
  console.error("LINE_CHANNEL_ACCESS_TOKEN / LINE_RICHMENU_MEMBER_ID / DATABASE_URL が必要です");
  process.exit(1);
}

const { PrismaClient } = await import("../src/generated/prisma/client.ts");
const { PrismaPg } = await import("@prisma/adapter-pg");
const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const activeMembers = await prisma.lineRecipient.findMany({
  where: { unfollowedAt: null, nickname: { not: null } },
  select: { lineUserId: true, nickname: true },
});

console.log(`対象: ${activeMembers.length}件`);

for (const m of activeMembers) {
  const res = await fetch(`https://api.line.me/v2/bot/user/${m.lineUserId}/richmenu/${MEMBER_MENU_ID}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
  if (res.ok) {
    console.log(`✅ ${m.nickname} (${m.lineUserId})`);
  } else {
    console.error(`❌ ${m.nickname} (${m.lineUserId}): ${res.status} ${await res.text()}`);
  }
}

await prisma.$disconnect();
console.log("完了");
