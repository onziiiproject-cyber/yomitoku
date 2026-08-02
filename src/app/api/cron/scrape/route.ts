import { NextRequest, NextResponse } from "next/server";
import { runScrapeAndSave, runShingiMinutesCheck } from "@/lib/digest";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runScrapeAndSave();
    console.log("[cron/scrape]", result);

    // 分科会の議事録は資料より数週間〜数ヶ月遅れて公開されるため、新着スクレイプとは別に
    // 既存の資料版に議事録が後から追加されていないかを毎回確認する（軽量なHTML走査のみ）
    let minutesCheck;
    try {
      minutesCheck = await runShingiMinutesCheck();
      console.log("[cron/scrape] shingi minutes check", minutesCheck);
    } catch (e) {
      console.error("[cron/scrape] shingi minutes check failed:", e);
      minutesCheck = { scanned: 0, saved: 0, errors: [String(e)] };
    }

    return NextResponse.json({ ok: true, ...result, minutesCheck });
  } catch (e) {
    console.error("[cron/scrape] failed:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
