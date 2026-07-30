import { NextRequest, NextResponse } from "next/server";
import { publishPodcastEpisode } from "@/lib/podcast";

export const maxDuration = 120;

// 音声合成（ローカルVOICEVOX作業）が終わったエピソードを公開し、SNS告知まで行う。
// audioUrlはVercel Blobに事前アップロード済みのものを渡す想定。
export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { episodeId, audioUrl, durationSec } = body as {
      episodeId?: string;
      audioUrl?: string;
      durationSec?: number;
    };
    if (!episodeId || !audioUrl || !durationSec) {
      return NextResponse.json({ error: "episodeId, audioUrl, durationSec are required" }, { status: 400 });
    }

    const result = await publishPodcastEpisode({ episodeId, audioUrl, durationSec });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
