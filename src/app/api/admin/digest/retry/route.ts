import { NextRequest, NextResponse } from "next/server";
import { retryFailedWeeklyDigestSends } from "@/lib/digest";

export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body.batchId || typeof body.batchId !== "string") {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 });
    }
    const result = await retryFailedWeeklyDigestSends(body.batchId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[digest/retry] failed:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
