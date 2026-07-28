import { NextRequest, NextResponse } from "next/server";
import { runPodcastDraftGeneration } from "@/lib/podcast";

export const maxDuration = 60;

// 手動トリガー用（cronの本番スケジュールを待たずに台本生成をテストする）
export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPodcastDraftGeneration();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
