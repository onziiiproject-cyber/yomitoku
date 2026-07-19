import { NextRequest, NextResponse } from "next/server";
import { runWeeklyDigest } from "@/lib/digest";

export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  // Simple secret-based auth for manual trigger
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const result = await runWeeklyDigest({ force: !!body.force });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[digest] failed:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
