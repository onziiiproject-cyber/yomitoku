import { NextRequest, NextResponse } from "next/server";
import { verifyLineToken, setNicknameAndActivate } from "@/lib/line-registration";

export async function POST(req: NextRequest) {
  const { token, nickname } = await req.json().catch(() => ({ token: undefined, nickname: undefined }));
  if (!token || typeof nickname !== "string") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const profile = await verifyLineToken(token);
  if (!profile) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const trimmed = nickname.trim();
  const result = await setNicknameAndActivate(profile.userId, trimmed);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
