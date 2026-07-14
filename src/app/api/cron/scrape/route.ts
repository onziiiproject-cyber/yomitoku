import { NextRequest, NextResponse } from "next/server";
import { runScrapeAndSave } from "@/lib/digest";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runScrapeAndSave();
    console.log("[cron/scrape]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/scrape] failed:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
