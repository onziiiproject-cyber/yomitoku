import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
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

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

async function generateDiscussionQuestion(title, outlook) {
  const prompt = `あなたは介護保険の情報を発信するキャラクター「ゴリ編集長」です。以下は記事内の「この先どうなるか、予想してみます」というパート（AIによる将来予測で、事実ではなく推測であると画面上に明記されています）です。

タイトル: ${title}
AIの予想: ${outlook}

この予想について、読者（介護事業者）がコメント欄で気軽に反応したくなるような問いかけを1つ考えてください。

条件:
- 40〜70字程度の1文
- 「この予想、当たると思いますか？」「あなたはどう予想しますか？」のように、AIの予想への賛否・自分なりの予想を気軽に書き込みたくなる問いかけにする
- 事業所の内部情報や実務対応を答えさせる聞き方は避ける（あくまで予想に対する意見・感想を聞く）
- 語尾は親しみやすく、押しつけがましくない
- 質問文のみを出力する（前置き・記号・引用符は不要）`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return text.trim().replace(/^["「]|["」]$/g, "").slice(0, 150);
}

const docs = await prisma.siteDocument.findMany({
  where: { publishedAt: { not: null }, structuredContent: { not: null } },
  select: { id: true, title: true, structuredContent: true },
});

console.log(`対象記事: ${docs.length}件`);

let created = 0;
let skipped = 0;
let failed = 0;

for (const doc of docs) {
  const outlook = doc.structuredContent?.sections?.find((s) => s.kind === "outlook")?.body;
  if (!outlook) {
    skipped++;
    console.error(`予想セクションなし: ${doc.title.slice(0, 30)}`);
    continue;
  }

  try {
    const question = await generateDiscussionQuestion(doc.title, outlook);
    if (!question) {
      failed++;
      console.error(`空の質問文: ${doc.title.slice(0, 30)}`);
      continue;
    }
    // 既存の編集長コメントは上書き（プロンプト変更の再実行にも対応できるように）
    await prisma.articleComment.deleteMany({
      where: { siteDocumentId: doc.id, isEditorComment: true },
    });
    await prisma.articleComment.create({
      data: {
        siteDocumentId: doc.id,
        authorName: "ゴリ編集長",
        body: question,
        isEditorComment: true,
      },
    });
    created++;
    console.log(`OK: ${doc.title.slice(0, 30)} -> ${question}`);
  } catch (e) {
    failed++;
    console.error(`失敗: ${doc.title.slice(0, 30)}`, e);
  }

  await new Promise((r) => setTimeout(r, 300));
}

console.log(`\n完了: 作成${created}件 / スキップ${skipped}件 / 失敗${failed}件`);
await prisma.$disconnect();
