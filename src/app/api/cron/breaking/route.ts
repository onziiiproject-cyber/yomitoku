import { NextRequest, NextResponse } from "next/server";
import { runBreakingNewsCheck } from "@/lib/digest";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBreakingNewsCheck();
    console.log("[cron/breaking]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/breaking] failed:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
