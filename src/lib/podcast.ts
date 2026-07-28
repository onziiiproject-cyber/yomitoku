import { prisma } from "./prisma";
import { generateRadioScript } from "./anthropic";
import { pushPodcastDraftReady } from "./line-message";

export interface PodcastDraftResult {
  created: boolean;
  episodeId?: string;
  reason?: string;
}

// 放送室向けの記事候補を選定し、台本の初稿をAIに作らせてDRAFTとして保存する。
// 音声合成（VOICEVOX）はローカル実行前提のためここでは行わず、管理者への通知だけ行う。
export async function runPodcastDraftGeneration(): Promise<PodcastDraftResult> {
  const usedDocIds = (
    await prisma.podcastEpisode.findMany({
      where: { sourceDocId: { not: null } },
      select: { sourceDocId: true },
    })
  )
    .map((e) => e.sourceDocId)
    .filter((id): id is string => !!id);

  // すでに放送室で扱った記事は除外し、直近で公開された記事から1件選ぶ
  const candidate = await prisma.siteDocument.findFirst({
    where: {
      summary: { not: null },
      publishedAt: { not: null },
      id: { notIn: usedDocIds },
    },
    orderBy: { publishedAt: "desc" },
  });

  if (!candidate || !candidate.summary) {
    return { created: false, reason: "候補記事が見つかりませんでした" };
  }

  const episodeNo = (await prisma.podcastEpisode.count()) + 1;
  const draft = await generateRadioScript(candidate.title, candidate.summary, episodeNo);

  const episode = await prisma.podcastEpisode.create({
    data: {
      title: draft.title,
      description: draft.description,
      script: draft.script as object,
      status: "DRAFT",
      sourceDocId: candidate.id,
    },
  });

  const adminLineUserId = process.env.ADMIN_LINE_USER_ID;
  if (adminLineUserId) {
    await pushPodcastDraftReady(adminLineUserId, draft.title, draft.description);
  }

  return { created: true, episodeId: episode.id };
}
