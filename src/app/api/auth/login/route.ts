import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password, rememberMe } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "メールアドレスとパスワードを入力してください" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({ where: { email } });
  if (!company || !company.passwordHash) {
    return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, company.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
  }

  if (company.status === "CANCELED") {
    return NextResponse.json({ error: "このアカウントは解約済みです" }, { status: 403 });
  }
  if (company.status === "PENDING_PAYMENT") {
    return NextResponse.json({ error: "お支払いが完了していません。登録メールをご確認ください" }, { status: 403 });
  }

  await prisma.company.update({ where: { id: company.id }, data: { lastLoginAt: new Date() } });

  // ID/PASSログインは会社単位の認証のため、登録済みの個人（User）が複数いる場合は
  // このあと「あなたは誰ですか」で選んでもらう（0人なら新規作成、1人なら自動的に本人とみなす）
  const users = await prisma.user.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "asc" },
  });

  const sessionPayload = {
    companyId: company.id,
    email: company.email,
    companyName: company.name,
    ...(users.length === 1
      ? { userId: users[0].id, nickname: users[0].name }
      : {}),
  };

  const token = await createSession(sessionPayload);
  await setSessionCookie(token, rememberMe === true);

  return NextResponse.json({ ok: true, needsProfileSelect: users.length !== 1 });
}
