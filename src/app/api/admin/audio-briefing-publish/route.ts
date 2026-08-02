import { NextRequest, NextResponse } from "next/server";
import { publishArticleAudioBriefing } from "@/lib/audio-briefing";

export const maxDuration = 120;

// 音声合成（ローカルVOICEVOX作業）が終わった議事録ラジオ解説を公開し、
// 対象記事のタグにマッチするLINE購読者へ配信する。
// audioUrlはVercel Blobに事前アップロード済みのものを渡す想定。
export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { briefingId, audioUrl, durationSec } = body as {
      briefingId?: string;
      audioUrl?: string;
      durationSec?: number;
    };
    if (!briefingId || !audioUrl || !durationSec) {
      return NextResponse.json({ error: "briefingId, audioUrl, durationSec are required" }, { status: 400 });
    }

    const result = await publishArticleAudioBriefing({ briefingId, audioUrl, durationSec });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
