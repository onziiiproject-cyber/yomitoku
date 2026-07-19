import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.userId) {
    return NextResponse.json({ error: "プロフィールが未設定です" }, { status: 400 });
  }

  const { nickname } = await req.json();
  const trimmed = typeof nickname === "string" ? nickname.trim() : "";
  if (!trimmed || trimmed.length > 20) {
    return NextResponse.json({ error: "ニックネームは1〜20文字で入力してください" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { name: trimmed },
  });

  // LINE連携済みなら表示名をそちらにも反映しておく
  if (user.lineRecipientId) {
    await prisma.lineRecipient.update({
      where: { id: user.lineRecipientId },
      data: { nickname: trimmed },
    });
  }

  const token = await createSession({ ...session, nickname: trimmed });
  await setSessionCookie(token);

  return NextResponse.json({ nickname: trimmed });
}
