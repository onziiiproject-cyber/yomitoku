import { prisma } from "./prisma";
import { generateShingiAudioScript } from "./anthropic";
import { pushAudioBriefingDraftReady } from "./line-message";
import { generateAudioBriefingHeroImage } from "./social-image";
import { put } from "@vercel/blob";

export interface AudioBriefingDraftResult {
  created: boolean;
  briefingId?: string;
  reason?: string;
}

// 分科会「議事録版」記事1本につき、その記事のテーマに絞った音声解説（議事録ラジオ解説）の
// 台本初稿をAIに作らせてDRAFTとして保存する。音声合成（VOICEVOX）はローカル実行前提のため
// ここでは行わず、放送室と同じく管理者への通知だけ行う。
export async function draftShingiAudioBriefing(params: {
  siteDocumentId: string;
  articleTitle: string;
  themeTitle: string;
  sessionLabel: string;
  minutesPdfBase64: string;
}): Promise<AudioBriefingDraftResult> {
  const existing = await prisma.articleAudioBriefing.findUnique({
    where: { siteDocumentId: params.siteDocumentId },
  });
  if (existing) {
    return { created: false, reason: "この記事の音声解説は既に作成済みです" };
  }

  const draft = await generateShingiAudioScript(params.themeTitle, params.sessionLabel, params.minutesPdfBase64);

  const briefing = await prisma.articleAudioBriefing.create({
    data: {
      siteDocumentId: params.siteDocumentId,
      title: draft.title,
      description: draft.description,
      script: draft.script as object,
      status: "DRAFT",
    },
  });

  const adminLineUserId = process.env.ADMIN_LINE_USER_ID;
  if (adminLineUserId) {
    await pushAudioBriefingDraftReady(adminLineUserId, params.articleTitle, draft.title, draft.description);
  }

  return { created: true, briefingId: briefing.id };
}

export interface AudioBriefingPublishResult {
  status: "PUBLISHED";
}

// 音声合成（VOICEVOXでのローカル作業）が終わった音声解説をPUBLISHEDにする。
// 以前はここで即座にLINE個別配信していたが、水曜の週刊ヨミトクと別タイミングで
// 届くと事故のように見えるため廃止。以後は次回のrunWeeklyDigest実行時に、
// status:PUBLISHED かつ直近1週間以内のものが週刊カルーセルへ自動的に乗る。
// 放送室と異なり公開Podcastフィードには載せず、Facebook/Instagram投稿も行わない
// （ログイン必須の記事に紐づく非公開コンテンツのため）。
export async function publishArticleAudioBriefing(params: {
  briefingId: string;
  audioUrl: string;
  durationSec: number;
}): Promise<AudioBriefingPublishResult> {
  const draftBriefing = await prisma.articleAudioBriefing.findUniqueOrThrow({ where: { id: params.briefingId } });

  // ヒーロー画像は音声の長さ（durationSec）が確定する公開時に生成する
  // （台本ドラフト時点ではまだVOICEVOX合成前で長さが分からないため）
  const heroBuffer = await generateAudioBriefingHeroImage({
    title: draftBriefing.title,
    durationSec: params.durationSec,
  });
  const heroBlob = await put(`audio-briefing/${params.briefingId}-hero-${Date.now()}.png`, heroBuffer, {
    access: "public",
    contentType: "image/png",
  });

  await prisma.articleAudioBriefing.update({
    where: { id: params.briefingId },
    data: {
      audioUrl: params.audioUrl,
      durationSec: params.durationSec,
      heroImageUrl: heroBlob.url,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  return { status: "PUBLISHED" };
}
