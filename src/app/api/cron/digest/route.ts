import { NextRequest, NextResponse } from "next/server";
import { runWeeklyDigest } from "@/lib/digest";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // Vercel Cron sends this header
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runWeeklyDigest();
    console.log("[cron/digest]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/digest] failed:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
