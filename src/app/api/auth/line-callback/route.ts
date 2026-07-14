import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = req.cookies.get("line_oauth_state")?.value;

  const errorRedirect = (msg: string) =>
    NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/base/login?line_error=${encodeURIComponent(msg)}`);

  if (!code || !state || state !== storedState) {
    return errorRedirect("認証に失敗しました。もう一度お試しください。");
  }

  // コードをアクセストークンに交換
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/line-callback`;
  const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl,
      client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
      client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
    }),
  });

  if (!tokenRes.ok) {
    return errorRedirect("LINEとの連携に失敗しました。");
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token as string;

  // LINEプロフィールからuserIdを取得
  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileRes.ok) {
    return errorRedirect("プロフィールの取得に失敗しました。");
  }

  const profile = await profileRes.json();
  const lineUserId = profile.userId as string;

  // LineRecipientからCompanyを検索
  const recipient = await prisma.lineRecipient.findUnique({
    where: { lineUserId },
    include: { company: true },
  });

  if (!recipient) {
    return errorRedirect("アカウントが見つかりません。まずLINE公式アカウントを友だち追加してください。");
  }

  if (recipient.company.status === "CANCELED") {
    return errorRedirect("このアカウントは解約済みです。");
  }

  await prisma.company.update({ where: { id: recipient.company.id }, data: { lastLoginAt: new Date() } });

  const token = await createSession({
    companyId: recipient.company.id,
    email: recipient.company.email,
    companyName: recipient.company.name,
  });

  const res = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/base`);
  await setSessionCookie(token);

  // stateクッキーを削除
  res.cookies.delete("line_oauth_state");

  return res;
}
