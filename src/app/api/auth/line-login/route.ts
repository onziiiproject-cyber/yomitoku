import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/line-callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
    redirect_uri: callbackUrl,
    state,
    scope: "profile openid",
  });

  const res = NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?${params}`
  );

  // stateをcookieで保持してCSRF対策
  res.cookies.set("line_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 10, // 10分
    path: "/",
  });

  return res;
}
