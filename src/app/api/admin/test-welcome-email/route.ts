import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sendWelcomeEmail(
    "onziii.project@gmail.com",
    "株式会社テスト法人",
    "TEST-INVITE01",
  );

  return NextResponse.json({ ok: true });
}
