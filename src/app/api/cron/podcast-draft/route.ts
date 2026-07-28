import { NextRequest, NextResponse } from "next/server";
import { runPodcastDraftGeneration } from "@/lib/podcast";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPodcastDraftGeneration();
    console.log("[cron/podcast-draft]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/podcast-draft] failed:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
