import { put } from "@vercel/blob";
import { prisma } from "./prisma";
import { generateRadioScript, type RadioScriptLine } from "./anthropic";
import { pushPodcastDraftReady } from "./line-message";
import { generatePodcastEpisodeCardImage } from "./social-image";
import { postPodcastEpisodeToSocial } from "./meta";

export interface PodcastDraftResult {
  created: boolean;
  episodeId?: string;
  reason?: string;
}

const SPOTIFY_SHOW_URL = "https://open.spotify.com/show/033TlBFRkPM02RusVb5Xl6";

// 毎回固定で末尾に付けるサービス紹介パート。AIに自由生成させず固定文言にすることで、
// 誘導文言のブレを防ぎ、番組の「締めの型」として聞き手に定着させる（ユーザー方針決定済み）。
export const PROMO_SEGMENT: RadioScriptLine[] = [
  { speaker: "gray", text: "ゴリ編集長、このヨミトク放送室は介護保険制度の今更聞けない、を耳で学ぶラジオですが、ヨミトク編集部っていうサービスがあるんですよね？どんなサービスなんですか？私、まだよく分かってないんです。" },
  { speaker: "gori", text: "おう、簡単に言うと、介護保険の最新情報を毎週水曜日にLINEでまとめて届けてるサービスだ。" },
  { speaker: "gray", text: "「届ける」っていうのがポイントなんですか？" },
  { speaker: "gori", text: "そうなんだ。本来、こういう情報って厚労省のサイトとか自分から見に行かないと手に入らないだろ？忙しい現場だと、それだけで後回しになっちまう。だからこっちから届ける形にしたんだ。" },
  { speaker: "gray", text: "なるほど、待ってるだけで届くのはありがたいですね。でも資料自体って結構堅くて読みにくいイメージがあります。" },
  { speaker: "gori", text: "そこも工夫してるとこだ。そもそも読みにくい、届いても正直読む気になれないような資料を、俺が進研ゼミみたいに分かりやすくまとめ直してるんだよ。" },
  { speaker: "gray", text: "進研ゼミ！！懐かしいです、あの「ここが出る」みたいな感じですね。" },
  { speaker: "gori", text: "そういうことだ。" },
  { speaker: "gray", text: "ちなみに…お高いんでしょう？" },
  { speaker: "gori", text: "月額……300円。" },
  { speaker: "gray", text: "え、300円！？" },
  { speaker: "gori", text: "しかも1契約でLINE登録は3人までできるから、経営者も現場の人も一緒に使えるぞ。" },
  { speaker: "gray", text: "それは気になります！どこで詳しく見れるんですか？" },
  { speaker: "gori", text: "InstagramとFacebookのプロフィール欄にリンクを貼ってあるから、そこから飛んでみてくれ。LINEの友だち追加もそこからできるぞ。" },
  { speaker: "gray", text: "チェックしてみます！というわけで、今日はこのへんで。" },
  { speaker: "gori", text: "制度を、読むから、わかるへ。続きは編集部で。" },
];

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

  // 見送り（REJECTED）は配信していないので通し番号に数えない。
  // なお見送りでも行は残しておくこと。記事の重複判定はsourceDocIdの有無だけを見ているため、
  // 行を消すとその記事が未使用に戻り、次の巡回でまた同じ記事が選ばれてしまう
  const episodeNo = (await prisma.podcastEpisode.count({ where: { status: { not: "REJECTED" } } })) + 1;
  const draft = await generateRadioScript(candidate.title, candidate.summary, episodeNo, candidate.publishedAt);
  const fullScript = [...draft.script, ...PROMO_SEGMENT];

  const episode = await prisma.podcastEpisode.create({
    data: {
      title: draft.title,
      description: draft.description,
      script: fullScript as object,
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

export interface PodcastPublishResult {
  facebook: { id: string } | null;
  instagram: { id: string } | null;
  errors: string[];
}

// 音声合成（VOICEVOXでのローカル作業）が終わったエピソードをPUBLISHEDにし、
// 告知カードを生成してFacebook/Instagramに同時投稿する。
export async function publishPodcastEpisode(params: {
  episodeId: string;
  audioUrl: string;
  durationSec: number;
}): Promise<PodcastPublishResult> {
  const episode = await prisma.podcastEpisode.update({
    where: { id: params.episodeId },
    data: {
      audioUrl: params.audioUrl,
      durationSec: params.durationSec,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  const episodeNo = await prisma.podcastEpisode.count({ where: { status: "PUBLISHED" } });
  const cardBuffer = await generatePodcastEpisodeCardImage({ episodeNo, title: episode.title });
  const cardBlob = await put(`podcast/social/ep${episodeNo}-card-${Date.now()}.png`, cardBuffer, {
    access: "public",
    contentType: "image/png",
  });

  const caption = `🎙 ヨミトク放送室 第${episodeNo}回配信中\n\n「${episode.title}」\n${episode.description}\n\n詳しくは以下のリンクまたはプロフィール欄のリンクから\n${SPOTIFY_SHOW_URL}`;

  return postPodcastEpisodeToSocial({ imageUrl: cardBlob.url, caption });
}
