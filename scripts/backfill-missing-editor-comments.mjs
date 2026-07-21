/**
 * 公開済みでコメント0件、かつstructuredContentに「outlook」セクションがある記事にだけ
 * ゴリ編集長の自動コメント（議論を促す問いかけ）を後付けする。
 *
 * scripts/backfill-editor-comments.mjs（全記事を対象に上書き再生成）とは違い、
 * 既にコメントがある記事には一切触れない（新規投稿のみ）。
 * outlookセクションが無い記事（Q&A・様式・事務連絡等）はそもそも自動コメント対象外の仕様なので含まない。
 *
 * Usage:
 *   node --import tsx scripts/backfill-missing-editor-comments.mjs
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
const { generateDiscussionQuestion } = await import("../src/lib/anthropic.ts");

const docs = await prisma.siteDocument.findMany({
  where: { summary: { not: null }, publishedAt: { not: null }, comments: { none: {} } },
  select: { id: true, title: true, structuredContent: true },
});

const targets = docs.filter((d) => d.structuredContent?.sections?.some((s) => s.kind === "outlook"));
console.log(`コメント0件: ${docs.length}件 / うちoutlookあり(対象): ${targets.length}件`);

let done = 0, skipped = 0;
for (const doc of targets) {
  try {
    const outlook = doc.structuredContent.sections.find((s) => s.kind === "outlook")?.body;
    const question = await generateDiscussionQuestion(doc.title, outlook);
    if (!question) {
      console.log(`[skip] 質問生成失敗: ${doc.title.slice(0, 30)}`);
      skipped++;
      continue;
    }
    await prisma.articleComment.create({
      data: { siteDocumentId: doc.id, authorName: "ゴリ編集長", body: question, isEditorComment: true },
    });
    done++;
    console.log(`[${done}] ${doc.title.slice(0, 30)} -> "${question.slice(0, 40)}"`);
  } catch (e) {
    skipped++;
    console.error(`[error] ${doc.title.slice(0, 30)}: ${e}`);
  }
}

console.log(`完了: ${done}件投稿, ${skipped}件スキップ`);
await prisma.$disconnect();
