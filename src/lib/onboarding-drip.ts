import { messagingApi } from "@line/bot-sdk";

function getClient() {
  return new messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  });
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://yomitoku-base.com";
}

function liffTagsUrl() {
  return `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_TAGS_ID ?? process.env.NEXT_PUBLIC_LIFF_ID}`;
}

// 登録N日目に送るオンボーディング配信の対象日。Day0は登録直後に即時送信、
// それ以外はcronが毎日9:00 JSTにUser.createdAtからの経過日数と照合して送る。
export const ONBOARDING_DAYS = [0, 1, 3, 5, 7, 9, 12, 14] as const;
export type OnboardingDay = (typeof ONBOARDING_DAYS)[number];

const DAY0_TEXT =
  "ゴリ編集長です。ヨミトク編集部へようこそ🦍🎉\n" +
  "これから数日にわけて、ヨミトクの使い方やコンテンツを少しずつ紹介していきます📮全部読まなくても大丈夫なので、気になったときにサラッと目を通してもらえたら十分です。\n" +
  "まずは次の水曜日、最初の週刊ヨミトクをお楽しみに✨";

const DAY1_TEXT =
  "ゴリ編集長です🦍。ヨミトクから届く通知について、簡単に説明しておきます📬\n\n" +
  "・毎週水曜日9時「週刊ダイジェスト」📅\n" +
  "　1週間分の介護保険の最新情報・分科会の情報をまとめてお届けします📝\n\n" +
  "忙しい時は見出しだけでも大丈夫です😊気になったものだけ開いてもらえればOKです👍";

const DAY3_BODY =
  "ゴリ編集長です🦍。ヨミトクは、事業所に合わせて情報を絞り込めます🔍\n" +
  "訪問介護・デイサービス・特養…など、関係あるサービス種別や興味のあるジャンルだけタグ設定しておくと、無関係な情報に埋もれずに済みます✅\n\n" +
  "今は申込時のアカウント設定にもとづいたタグが登録されています📋リッチメニューの「タグ設定」から、いつでも自分専用に調整できます🔧まだの方は1分だけ触ってみてください⏱️";

const DAY5_TEXT =
  "ゴリ編集長です🦍。今日は記事の読み方を紹介します📖\n\n" +
  "まず「3行まとめ」で要点だけサッと確認できます⚡もっと知りたい時は「詳細を読む」でスワイプしながら深掘りできます👉分からない言葉や自分の事業所への影響がピンとこない時は、「ゴリ編集長に質問する」から直接聞いてください💬この記事の内容だけ、僕が答えます🦍\n\n" +
  "記事は週刊ヨミトクで届いたものをタップするほか、リッチメニューの「ヨミトク編集室へ」からいつでも一覧で見られます📚";

const DAY7_BODY =
  "ゴリ編集長です🦍。記事には5つのボタンがあるの、気づいてましたか？👀\n\n" +
  "・読んだ！…読了の記録に✅\n" +
  "・いいね…気になった記事にしるしを❤️\n" +
  "・保存…あとで見返したい記事をキープ🔖\n" +
  "・コメント…感想や疑問を書き込む💬\n" +
  "・報告…まとめが事実と違う、誤字脱字があるなど気になる点を伝える🚩\n\n" +
  "保存した記事は「保存した記事」ページからいつでも見返せます📂コメント欄では僕から質問することもあるので、気が向いたら答えてもらえると嬉しいです🦍";

const DAY9_BODY =
  "ゴリ編集長です🦍。ここまでで週刊ダイジェスト、もう届いてますよね？📬\n\n" +
  "実は専用ページもあって、過去のバックナンバーも遡って読めます📚前号・次号を行き来しながら確認できるので、見逃した週があれば探してみてください🔍\n" +
  "リッチメニューの「ヨミトク編集室へ」→「週刊ダイジェスト」タブから見られます👉";

const DAY12_BODY =
  "ゴリ編集長です🦍。文字を読むのがちょっと疲れた時は、音声コンテンツもどうぞ🎧\n\n" +
  "「ヨミトク放送室」は、新人記者ミスグレーの「そもそも◯◯って何？」に僕がゆるく答えていくラジオ形式のコンテンツです🐱通勤中とか、ながら聴きにちょうどいいと思います🚃リッチメニューの「ヨミトク放送室」からどうぞ📻\n\n" +
  "分科会の議事録をラジオ形式で解説した音声もあります🎙️文字よりも会議の熱量そのままにお届けしているので、こちらもぜひ✨対象の記事内で聴けます。";

const DAY14_TEXT =
  "ゴリ編集長です🦍。最後にひとつ💡\n\n" +
  "LINEは週1回のお届けですが、InstagramとFacebookはもう少しこまめに更新しています📸もっと早く情報をキャッチしたい方はこちらもどうぞ👇\n\n" +
  "Instagram: https://www.instagram.com/yomitoku_kaigo\n" +
  "Facebook: https://www.facebook.com/share/1D7U6k3bxi";

const IMAGES = {
  day3: { url: "https://scotkokifyxnvfhh.public.blob.vercel-storage.com/onboarding-drip/day3-tag-settei.jpg", aspectRatio: "512:369" },
  day9: { url: "https://scotkokifyxnvfhh.public.blob.vercel-storage.com/onboarding-drip/day9-digest-nav.png", aspectRatio: "900:445" },
  day12: { url: "https://scotkokifyxnvfhh.public.blob.vercel-storage.com/onboarding-drip/day12-housoushitsu.jpg", aspectRatio: "512:369" },
} as const;

function textParagraphs(body: string): messagingApi.FlexText[] {
  return body.split("\n\n").map((paragraph, i) => ({
    type: "text",
    text: paragraph,
    wrap: true,
    size: "sm",
    color: "#444444",
    ...(i > 0 ? { margin: "md" } : {}),
  } as messagingApi.FlexText));
}

function heroBubble(params: {
  altText: string;
  imageUrl: string;
  aspectRatio: string;
  body: string;
  buttonLabel?: string;
  buttonUri?: string;
}): messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: params.altText,
    contents: {
      type: "bubble",
      size: "mega",
      hero: {
        type: "image",
        url: params.imageUrl,
        size: "full",
        aspectRatio: params.aspectRatio,
        aspectMode: "cover",
      } as messagingApi.FlexImage,
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        contents: textParagraphs(params.body),
      },
      ...(params.buttonLabel && params.buttonUri
        ? {
            footer: {
              type: "box",
              layout: "vertical",
              paddingAll: "16px",
              contents: [
                {
                  type: "button",
                  action: { type: "uri", label: params.buttonLabel, uri: params.buttonUri },
                  style: "primary",
                  color: "#0D686E",
                } as messagingApi.FlexButton,
              ],
            },
          }
        : {}),
    } as messagingApi.FlexBubble,
  };
}

function buildStepMessage(day: OnboardingDay, latestDigestUrl: string): messagingApi.Message {
  switch (day) {
    case 0:
      return { type: "text", text: DAY0_TEXT };
    case 1:
      return { type: "text", text: DAY1_TEXT };
    case 3:
      return heroBubble({
        altText: "タグ設定で、自分に必要な情報だけ届くようにしませんか？",
        imageUrl: IMAGES.day3.url,
        aspectRatio: IMAGES.day3.aspectRatio,
        body: DAY3_BODY,
        buttonLabel: "タグ設定を開く",
        buttonUri: liffTagsUrl(),
      });
    case 5:
      return { type: "text", text: DAY5_TEXT };
    case 7:
      return { type: "text", text: DAY7_BODY };
    case 9:
      return heroBubble({
        altText: "週刊ダイジェストのバックナンバー、見られます",
        imageUrl: IMAGES.day9.url,
        aspectRatio: IMAGES.day9.aspectRatio,
        body: DAY9_BODY,
        buttonLabel: "ダイジェストを読む",
        buttonUri: latestDigestUrl,
      });
    case 12:
      return heroBubble({
        altText: "音声で聴けるヨミトク、あります",
        imageUrl: IMAGES.day12.url,
        aspectRatio: IMAGES.day12.aspectRatio,
        body: DAY12_BODY,
      });
    case 14:
      return { type: "text", text: DAY14_TEXT };
  }
}

// 1ユーザー・1日ぶんのオンボーディングメッセージを送信する。
// latestDigestUrlは呼び出し側で最新の週刊ダイジェストページURLを解決して渡す
// （Day9のボタン遷移先。未解決の場合はタイムラインにフォールバック）。
export async function sendOnboardingStep(
  lineUserId: string,
  day: OnboardingDay,
  latestDigestUrl?: string
): Promise<void> {
  const client = getClient();
  const message = buildStepMessage(day, latestDigestUrl ?? `${appUrl()}/base`);
  await client.pushMessage({ to: lineUserId, messages: [message] });
}
