import { NextRequest, NextResponse } from "next/server";
import { runProcessPending } from "@/lib/digest";

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runProcessPending(4);
    console.log("[cron/process]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/process] failed:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
