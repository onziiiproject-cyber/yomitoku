import { prisma } from "./prisma";
import { generateShingiAudioScript } from "./anthropic";
import { pushAudioBriefingDraftReady, pushAudioBriefingReady } from "./line-message";

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
  sentTo: number;
  errors: string[];
}

// 音声合成（VOICEVOXでのローカル作業）が終わった音声解説をPUBLISHEDにし、
// 対象記事のタグにマッチするLINE購読者へ配信する（週刊ヨミトクと同じタグマッチング基準）。
// 放送室と異なり公開Podcastフィードには載せず、Facebook/Instagram投稿も行わない
// （ログイン必須の記事に紐づく非公開コンテンツのため）。
export async function publishArticleAudioBriefing(params: {
  briefingId: string;
  audioUrl: string;
  durationSec: number;
}): Promise<AudioBriefingPublishResult> {
  const errors: string[] = [];

  const briefing = await prisma.articleAudioBriefing.update({
    where: { id: params.briefingId },
    data: {
      audioUrl: params.audioUrl,
      durationSec: params.durationSec,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
    include: { siteDocument: { select: { tags: true } } },
  });

  const articleTags = (briefing.siteDocument?.tags as string[] | undefined) ?? [];

  const recipients = await prisma.lineRecipient.findMany({
    where: { unfollowedAt: null, company: { status: "ACTIVE" } },
    include: { user: { include: { tags: { include: { tag: true } } } } },
  });

  let sentTo = 0;
  for (const recipient of recipients) {
    const recipientTagKeys = recipient.user?.tags.map((ut) => ut.tag.key) ?? [];
    // タグ未設定の購読者には全件、設定している場合は記事タグとの一致がある場合だけ送る
    // （ボーナスコンテンツ的な位置づけのため、不一致者には無理に送らない）
    const matches = recipientTagKeys.length === 0 || articleTags.some((t) => recipientTagKeys.includes(t));
    if (!matches) continue;

    try {
      await pushAudioBriefingReady(recipient.lineUserId, {
        docId: briefing.siteDocumentId,
        briefingTitle: briefing.title,
        description: briefing.description,
        durationSec: params.durationSec,
      });
      sentTo++;
    } catch (e) {
      errors.push(`LINE送信失敗 (${recipient.lineUserId}): ${e}`);
    }
  }

  return { sentTo, errors };
}
