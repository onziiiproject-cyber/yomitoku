import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { answerArticleQuestion, type ArticleQAMessage } from "@/lib/anthropic";

const MAX_QUESTION_LENGTH = 200;
const MAX_HISTORY_TURNS = 6; // 直近6往復まで文脈として渡す

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docId, question, history } = await req.json();
  if (!docId || typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "docId and question required" }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json({ error: `質問は${MAX_QUESTION_LENGTH}文字以内で入力してください` }, { status: 400 });
  }

  const doc = await prisma.siteDocument.findUnique({
    where: { id: docId },
    select: { title: true, summary: true, rawText: true },
  });
  if (!doc) return NextResponse.json({ error: "Article not found" }, { status: 404 });

  const safeHistory: ArticleQAMessage[] = Array.isArray(history)
    ? history
        .filter((h): h is ArticleQAMessage => h && (h.role === "user" || h.role === "assistant") && typeof h.text === "string")
        .slice(-MAX_HISTORY_TURNS * 2)
    : [];

  try {
    const answer = await answerArticleQuestion(doc, question.trim(), safeHistory);
    return NextResponse.json({ answer });
  } catch (e) {
    console.error("[api/base/articles/ask] failed:", e);
    return NextResponse.json({ error: "回答の生成に失敗しました。もう一度お試しください。" }, { status: 500 });
  }
}
