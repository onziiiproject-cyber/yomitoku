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

  const token = await createSession({
    companyId: company.id,
    email: company.email,
    companyName: company.name,
  });
  await setSessionCookie(token, rememberMe === true);

  return NextResponse.json({ ok: true });
}
