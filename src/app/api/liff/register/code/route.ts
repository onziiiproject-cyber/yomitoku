import { NextRequest, NextResponse } from "next/server";
import { verifyLineToken, normalizeInviteCode, INVITE_CODE_PATTERN, registerRecipientByCode } from "@/lib/line-registration";

export async function POST(req: NextRequest) {
  const { token, code } = await req.json().catch(() => ({ token: undefined, code: undefined }));
  if (!token || typeof code !== "string") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const profile = await verifyLineToken(token);
  if (!profile) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const normalizedCode = normalizeInviteCode(code);
  if (!INVITE_CODE_PATTERN.test(normalizedCode)) {
    return NextResponse.json({ error: "invalid_format" }, { status: 400 });
  }

  const result = await registerRecipientByCode(profile.userId, normalizedCode, profile.displayName);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }

  return NextResponse.json({ ok: true, memberOfName: result.memberOfName });
}
