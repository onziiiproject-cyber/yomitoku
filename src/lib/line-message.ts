import { messagingApi } from "@line/bot-sdk";

function getClient() {
  return new messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  });
}

export interface DigestDoc {
  id: string;
  title: string;
  summary: string;
  url: string;
  importance: string;
  tags: string[];
}

function tagChip(tag: string, bg = "#E8F5F1", color = "#1B7A6D"): messagingApi.FlexBox {
  return {
    type: "box",
    layout: "vertical",
    paddingAll: "4px",
    paddingStart: "10px",
    paddingEnd: "10px",
    backgroundColor: bg,
    cornerRadius: "20px",
    contents: [
      { type: "text", text: tag, size: "xs", color, weight: "bold" } as messagingApi.FlexText,
    ],
  };
}

export interface WeeklyCardDoc {
  id: string;
  title: string;
  hookTitle: string | null;
  summary: string;
  source: string;
  tags: string[];
  importanceStars: number | null;
  urgencyStars: number | null;
  isNew: boolean;
  decisionStatus: string | null;
  heroImageUrl: string;
}

const WEEKLY_SOURCE_BADGE: Record<string, { label: string; color: string }> = {
  mhlw_latest: { label: "介護保険最新情報", color: "#0D686E" },
  shingi: { label: "分科会かんたん解説", color: "#B45309" },
};

function weeklySourceBreakdown(docs: WeeklyCardDoc[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const doc of docs) {
    counts.set(doc.source, (counts.get(doc.source) ?? 0) + 1);
  }
  return Object.entries(WEEKLY_SOURCE_BADGE).map(([source, { label }]) => ({
    label,
    count: counts.get(source) ?? 0,
  }));
}

function weeklyLeadFlex(
  weekLabel: string,
  docs: WeeklyCardDoc[],
  docCount: number
): messagingApi.FlexMessage {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yomitoku-base.com";
  const iconUrl = `${baseUrl}/icons/icon-gori-editor.jpg`;
  const pointerImageUrl = `${baseUrl}/line/weekly-pointer.jpg`;
  const matchedCount = docs.length;
  const breakdown = weeklySourceBreakdown(docs);

  return {
    type: "flex",
    altText: `【週刊ヨミトク】${weekLabel}（あなたのタグに${matchedCount}件ヒット）`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#0D686E",
        paddingAll: "20px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            alignItems: "center",
            contents: [
              {
                type: "box",
                layout: "vertical",
                width: "40px",
                height: "40px",
                cornerRadius: "20px",
                contents: [
                  { type: "image", url: iconUrl, size: "full", aspectMode: "cover", aspectRatio: "1:1" } as messagingApi.FlexImage,
                ],
              } as messagingApi.FlexBox,
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "週刊ヨミトク", color: "#ffffff", size: "lg", weight: "bold" } as messagingApi.FlexText,
                  { type: "text", text: weekLabel, color: "#BFE3DD", size: "xs", margin: "xs" } as messagingApi.FlexText,
                ],
              } as messagingApi.FlexBox,
            ],
          } as messagingApi.FlexBox,
          {
            type: "text",
            text: "ゴリ編集長です。今週分をまとめました！",
            color: "#ffffff",
            size: "sm",
            margin: "md",
            wrap: true,
          } as messagingApi.FlexText,
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        contents: [
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#F0F9F8",
            cornerRadius: "12px",
            paddingAll: "16px",
            alignItems: "center",
            contents: [
              {
                type: "text",
                text: "あなたのタグにヒットした件数 / 全体件数",
                size: "xs",
                color: "#527672",
              } as messagingApi.FlexText,
              {
                type: "box",
                layout: "baseline",
                margin: "sm",
                contents: [
                  { type: "text", text: String(matchedCount), size: "4xl", weight: "bold", color: "#FA5203", flex: 0 } as messagingApi.FlexText,
                  { type: "text", text: ` / ${docCount}`, size: "lg", weight: "bold", color: "#888888", margin: "xs", flex: 0 } as messagingApi.FlexText,
                ],
              } as messagingApi.FlexBox,
            ],
          } as messagingApi.FlexBox,
          { type: "text", text: "今週の通知は以下の通りです♪", size: "sm", weight: "bold", color: "#333333", margin: "lg" } as messagingApi.FlexText,
          {
            type: "box",
            layout: "vertical",
            margin: "sm",
            spacing: "xs",
            contents: breakdown.map(
              (row) =>
                ({
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "text", text: `・${row.label}`, size: "sm", color: "#333333", flex: 3 } as messagingApi.FlexText,
                    { type: "text", text: `${row.count}件`, size: "sm", weight: "bold", color: "#0D686E", align: "end", flex: 1 } as messagingApi.FlexText,
                  ],
                }) as messagingApi.FlexBox
            ),
          } as messagingApi.FlexBox,
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "12px",
        contents: [
          {
            type: "image",
            url: pointerImageUrl,
            size: "full",
            aspectRatio: "495:347",
            aspectMode: "cover",
          } as messagingApi.FlexImage,
        ],
      },
    } as messagingApi.FlexBubble,
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function weeklyCardBubble(doc: WeeklyCardDoc, appUrl: string): messagingApi.FlexBubble {
  const src = WEEKLY_SOURCE_BADGE[doc.source] ?? { label: doc.source, color: "#555555" };
  const displayTitle = doc.hookTitle || doc.title;

  return {
    type: "bubble",
    size: "kilo",
    hero: {
      type: "image",
      url: doc.heroImageUrl,
      size: "full",
      aspectRatio: "18:13",
      aspectMode: "cover",
    } as messagingApi.FlexImage,
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "20px",
      contents: [
        { type: "text", text: displayTitle, wrap: true, weight: "bold", size: "md", color: "#1a1a1a", maxLines: 3 } as messagingApi.FlexText,
        { type: "text", text: doc.summary, wrap: true, size: "sm", color: "#666666", maxLines: 3, margin: "md" } as messagingApi.FlexText,
        { type: "separator", margin: "32px", color: "#EEEEEE" } as messagingApi.FlexSeparator,
        {
          type: "box",
          layout: "horizontal",
          margin: "32px",
          contents: [
            { type: "text", text: "この記事を詳しく見る", size: "sm", weight: "bold", color: src.color, flex: 0 } as messagingApi.FlexText,
            { type: "text", text: "→", size: "sm", weight: "bold", color: src.color, flex: 0, margin: "xs" } as messagingApi.FlexText,
          ],
          action: { type: "uri", uri: `${appUrl}/base/articles/${doc.id}` },
        } as messagingApi.FlexBox,
        {
          type: "box",
          layout: "horizontal",
          margin: "md",
          contents: [
            { type: "text", text: "週刊記事をすべて見る", size: "sm", weight: "bold", color: "#888888", flex: 0 } as messagingApi.FlexText,
            { type: "text", text: "→", size: "sm", weight: "bold", color: "#888888", flex: 0, margin: "xs" } as messagingApi.FlexText,
          ],
          action: { type: "uri", uri: `${appUrl}/base` },
        } as messagingApi.FlexBox,
      ],
    },
  } as messagingApi.FlexBubble;
}

function weeklyCarouselFlex(docs: WeeklyCardDoc[], appUrl: string): messagingApi.FlexMessage {
  const bubbles = docs.slice(0, 10).map((d) => weeklyCardBubble(d, appUrl));
  return {
    type: "flex",
    altText: `【週刊ヨミトク】今週の記事一覧（${docs.length}件）`,
    contents: { type: "carousel", contents: bubbles },
  };
}

function weeklyNoMatchFlex(weekLabel: string, appUrl: string): messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: `【週刊ヨミトク】${weekLabel} 今回は登録タグに関連する記事はありませんでした`,
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "24px",
        spacing: "md",
        contents: [
          { type: "text", text: "今週は登録タグにヒットする記事はありませんでした", size: "md", weight: "bold", color: "#1a1a1a", wrap: true } as messagingApi.FlexText,
          {
            type: "text",
            text: "今週発行された記事は、すべてヨミトク編集室でご確認いただけます。",
            size: "sm",
            color: "#666666",
            wrap: true,
            margin: "md",
          } as messagingApi.FlexText,
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        contents: [
          {
            type: "button",
            action: { type: "uri", label: "編集室で全ての記事を見る →", uri: `${appUrl}/base` },
            style: "secondary",
          } as messagingApi.FlexButton,
        ],
      },
    } as messagingApi.FlexBubble,
  };
}

function breakingNewsFlex(doc: DigestDoc, appUrl: string): messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: `【ヨミトク速報】${doc.title}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#FCEBEB",
        paddingAll: "16px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "⚠️  速報",
                color: "#A32D2D",
                size: "sm",
                weight: "bold",
              } as messagingApi.FlexText,
              {
                type: "text",
                text: "重要度の高い通知をお知らせします",
                color: "#B85C5C",
                size: "xxs",
                align: "end",
                gravity: "center",
              } as messagingApi.FlexText,
            ],
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: doc.title,
            wrap: true,
            size: "md",
            weight: "bold",
            color: "#1a1a1a",
          } as messagingApi.FlexText,
          ...(doc.tags.length > 0
            ? [
                {
                  type: "box",
                  layout: "horizontal",
                  spacing: "sm",
                  contents: doc.tags.slice(0, 3).map((t) => tagChip(t)),
                } as messagingApi.FlexBox,
              ]
            : []),
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#FFF5F5",
            cornerRadius: "8px",
            paddingAll: "12px",
            margin: "md",
            contents: [
              {
                type: "text",
                text: doc.summary,
                wrap: true,
                size: "sm",
                color: "#444444",
              } as messagingApi.FlexText,
            ],
          } as messagingApi.FlexBox,
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        contents: [
          {
            type: "button",
            action: { type: "uri", label: "編集室で記事を読む →", uri: `${appUrl}/base/articles/${doc.id}` },
            style: "primary",
            color: "#7B2D2D",
          } as messagingApi.FlexButton,
        ],
      },
    } as messagingApi.FlexBubble,
  };
}

// openExternalBrowser=1 でLINEアプリ内ブラウザではなく端末の標準ブラウザ（Safari等）で開かせる。
// LINE内ブラウザだとUniversal Linkが効かずSpotifyアプリへの直接遷移に失敗し、
// 毎回App Storeのアプリ詳細ページに飛ばされてしまうため（Safariなら正しく遷移する）
const SPOTIFY_SHOW_URL = "https://open.spotify.com/show/033TlBFRkPM02RusVb5Xl6?openExternalBrowser=1";

export interface PodcastEpisodeSummary {
  title: string;
  description: string;
}

function weeklyNoNewsPodcastFlex(weekLabel: string, episode: PodcastEpisodeSummary | null): messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: `【週刊ヨミトク】${weekLabel} 今週は新着情報がありませんでした`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#E6F1FB",
        paddingAll: "20px",
        contents: [
          { type: "text", text: "📋  週刊ヨミトク", color: "#0C447C", size: "xl", weight: "bold" } as messagingApi.FlexText,
          {
            type: "text",
            text: `${weekLabel}  ·  今週は新着情報がありませんでした`,
            color: "#185FA5",
            size: "sm",
            margin: "sm",
            wrap: true,
          } as messagingApi.FlexText,
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "介護保険最新情報・分科会情報ともに、今週は新しい発表がありませんでした。",
            wrap: true,
            size: "sm",
            color: "#333333",
          } as messagingApi.FlexText,
          ...(episode
            ? ([
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#F5FBF8",
                  cornerRadius: "10px",
                  paddingAll: "14px",
                  margin: "md",
                  spacing: "xs",
                  contents: [
                    { type: "text", text: "🎙 代わりに「ヨミトク放送室」はいかがですか？", size: "xs", weight: "bold", color: "#0D686E" } as messagingApi.FlexText,
                    { type: "text", text: episode.title, size: "sm", weight: "bold", color: "#1a1a1a", wrap: true, margin: "sm" } as messagingApi.FlexText,
                    { type: "text", text: episode.description, size: "xs", color: "#666666", wrap: true, margin: "sm" } as messagingApi.FlexText,
                  ],
                } as messagingApi.FlexBox,
              ] as messagingApi.FlexComponent[])
            : []),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        contents: [
          {
            type: "button",
            action: { type: "uri", label: "ヨミトク放送室を聴く →", uri: SPOTIFY_SHOW_URL },
            style: "primary",
            color: "#0D686E",
          } as messagingApi.FlexButton,
        ],
      },
    } as messagingApi.FlexBubble,
  };
}

// 放送室の台本ドラフトができた時に管理者へ1通だけ送る通知。
// 音声合成前のレビュー依頼のため、全ユーザー向け配信とは別枠（管理者のみ）。
export async function pushPodcastDraftReady(
  lineUserId: string,
  episodeTitle: string,
  description: string
): Promise<void> {
  const client = getClient();
  await client.pushMessage({
    to: lineUserId,
    messages: [
      {
        type: "text",
        text: `🎙 放送室の新しい台本ができました\n\n「${episodeTitle}」\n${description}\n\nClaude Codeで内容を確認・相談してください。`,
      },
    ],
  });
}

// 議事録ラジオ解説の台本ドラフトができた時に管理者へ1通だけ送る通知（放送室と同じ枠組み）。
export async function pushAudioBriefingDraftReady(
  lineUserId: string,
  articleTitle: string,
  briefingTitle: string,
  description: string
): Promise<void> {
  const client = getClient();
  await client.pushMessage({
    to: lineUserId,
    messages: [
      {
        type: "text",
        text: `🎙 議事録ラジオ解説の新しい台本ができました\n\n記事: 「${articleTitle}」\n台本: 「${briefingTitle}」\n${description}\n\nClaude Codeで内容を確認・相談してください。`,
      },
    ],
  });
}

function audioBriefingBubble(params: {
  docId: string;
  briefingTitle: string;
  description: string;
  heroImageUrl: string;
  appUrl: string;
}): messagingApi.FlexBubble {
  return {
    type: "bubble",
    size: "kilo",
    hero: {
      type: "image",
      url: params.heroImageUrl,
      size: "full",
      aspectRatio: "18:13",
      aspectMode: "cover",
    } as messagingApi.FlexImage,
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "20px",
      contents: [
        { type: "text", text: params.briefingTitle, wrap: true, weight: "bold", size: "md", color: "#1a1a1a", maxLines: 3 } as messagingApi.FlexText,
        { type: "text", text: params.description, wrap: true, size: "sm", color: "#666666", margin: "md", maxLines: 4 } as messagingApi.FlexText,
        {
          type: "box",
          layout: "horizontal",
          margin: "32px",
          contents: [
            { type: "text", text: "視聴する", size: "sm", weight: "bold", color: "#3050AE", flex: 0 } as messagingApi.FlexText,
            { type: "text", text: "→", size: "sm", weight: "bold", color: "#3050AE", flex: 0, margin: "xs" } as messagingApi.FlexText,
          ],
          action: { type: "uri", uri: `${params.appUrl}/base/articles/${params.docId}` },
        } as messagingApi.FlexBox,
      ],
    },
  } as messagingApi.FlexBubble;
}

// 議事録ラジオ解説が公開された時に、対象記事のタグにマッチする購読者へ配信する。
// 週刊ヨミトクのカードと同じFlexカード形式・同じタグマッチング基準に揃える。
// 記事自体はログイン必須なので、リンク先で自然にログインが求められる。
export async function pushAudioBriefingReady(
  lineUserId: string,
  params: { docId: string; briefingTitle: string; description: string; heroImageUrl: string }
): Promise<string> {
  const client = getClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yomitoku-base.com";
  const res = await client.pushMessage({
    to: lineUserId,
    messages: [
      {
        type: "flex",
        altText: `🎙 議事録ラジオ解説「${params.briefingTitle}」が公開されました`,
        contents: audioBriefingBubble({ ...params, appUrl }),
      },
    ],
  });
  return res.sentMessages?.[0]?.id ?? "";
}

export async function pushWeeklyNoNewsWithPodcast(
  lineUserId: string,
  weekLabel: string,
  episode: PodcastEpisodeSummary | null
): Promise<string> {
  const client = getClient();
  const message = weeklyNoNewsPodcastFlex(weekLabel, episode);
  const res = await client.pushMessage({ to: lineUserId, messages: [message] });
  return res.sentMessages?.[0]?.id ?? "";
}

export async function pushWeeklyDigestCards(
  lineUserId: string,
  weekLabel: string,
  docCount: number,
  docs: WeeklyCardDoc[]
): Promise<string> {
  const client = getClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yomitoku-base.com";

  const lead = weeklyLeadFlex(weekLabel, docs, docCount);
  const carousel = docs.length > 0 ? weeklyCarouselFlex(docs, appUrl) : weeklyNoMatchFlex(weekLabel, appUrl);

  const res = await client.pushMessage({ to: lineUserId, messages: [lead, carousel] });
  return res.sentMessages?.[0]?.id ?? "";
}

export async function pushBreakingNews(
  lineUserId: string,
  doc: DigestDoc
): Promise<string> {
  const client = getClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yomitoku-base.com";
  const message = breakingNewsFlex(doc, appUrl);
  const res = await client.pushMessage({ to: lineUserId, messages: [message] });
  return res.sentMessages?.[0]?.id ?? "";
}

// ─── 分科会かんたん解説メッセージ ───────────────────────────────────────────────

function shingiCoverFlex(
  sessionNo: number,
  councilShortName: string,
  date: string,
  featureLabel: string,
  themeNames: string[],
  coverPdfUrl: string
): messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: `【ヨミトク】第${sessionNo}回 分科会かんたん解説が届きました`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#FEF3C7",
        paddingAll: "20px",
        contents: [
          { type: "text", text: "📋  分科会かんたん解説", color: "#B45309", size: "xs", weight: "bold" } as messagingApi.FlexText,
          { type: "text", text: `第${sessionNo}回 ${councilShortName}`, color: "#78350F", size: "lg", weight: "bold", wrap: true, margin: "sm" } as messagingApi.FlexText,
          { type: "text", text: `${date}  ·  ${featureLabel}`, color: "#B45309", size: "sm", margin: "sm", wrap: true } as messagingApi.FlexText,
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "sm",
        contents: [
          { type: "text", text: "今回の議論テーマ", size: "xs", color: "#888888", weight: "bold" } as messagingApi.FlexText,
          ...themeNames.map((name, i) => ({
            type: "text",
            text: `${i + 1}. ${name}`,
            size: "sm",
            color: "#1a1a1a",
            wrap: true,
            margin: "sm",
          } as messagingApi.FlexText)),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        contents: [
          {
            type: "button",
            action: { type: "uri", label: "📄 表紙＋全体サマリーPDFを見る", uri: coverPdfUrl },
            style: "primary",
            color: "#B45309",
          } as messagingApi.FlexButton,
        ],
      },
    } as messagingApi.FlexBubble,
  };
}

function shingiTopicsFlex(
  sessionNo: number,
  matchingThemes: Array<{ no: number; name: string }>,
  topicPdfUrls: Record<number, string>
): messagingApi.FlexMessage {
  const buttons: messagingApi.FlexComponent[] = matchingThemes.slice(0, 4).map(t => ({
    type: "button",
    action: { type: "uri", label: `📄 ${t.name}`, uri: topicPdfUrls[t.no] },
    style: "secondary",
    height: "sm",
    margin: "sm",
  } as messagingApi.FlexButton));

  return {
    type: "flex",
    altText: `【ヨミトク】第${sessionNo}回 あなたの事業所に関係するテーマがあります`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#FEF3C7",
        paddingAll: "16px",
        contents: [
          { type: "text", text: "📌  あなたの事業所に関係するテーマがあります", color: "#B45309", size: "sm", weight: "bold", wrap: true } as messagingApi.FlexText,
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "登録タグに関連するテーマが今回の分科会で議論されました。詳細PDFをご確認ください。",
            size: "sm",
            color: "#444444",
            wrap: true,
          } as messagingApi.FlexText,
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        spacing: "sm",
        contents: buttons,
      },
    } as messagingApi.FlexBubble,
  };
}

function shingiNoMatchFlex(
  sessionNo: number,
  baseUrl: string
): messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: `【ヨミトク】第${sessionNo}回 今回は該当するトピックスはありませんでした`,
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "24px",
        spacing: "md",
        contents: [
          { type: "text", text: "今回は該当するトピックスはありませんでした", size: "md", weight: "bold", color: "#1a1a1a", wrap: true } as messagingApi.FlexText,
          {
            type: "text",
            text: "登録タグに関連するテーマが今回はありませんでした。全テーマの解説はヨミトク編集室からご確認いただけます。",
            size: "sm",
            color: "#666666",
            wrap: true,
            margin: "md",
          } as messagingApi.FlexText,
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        contents: [
          {
            type: "button",
            action: { type: "uri", label: "全テーマを編集室で見る →", uri: baseUrl },
            style: "secondary",
          } as messagingApi.FlexButton,
        ],
      },
    } as messagingApi.FlexBubble,
  };
}

export async function pushShingiCover(
  lineUserId: string,
  sessionNo: number,
  councilShortName: string,
  date: string,
  featureLabel: string,
  themeNames: string[],
  coverPdfUrl: string
): Promise<string> {
  const client = getClient();
  const message = shingiCoverFlex(sessionNo, councilShortName, date, featureLabel, themeNames, coverPdfUrl);
  const res = await client.pushMessage({ to: lineUserId, messages: [message] });
  return res.sentMessages?.[0]?.id ?? "";
}

export async function pushShingiTopics(
  lineUserId: string,
  sessionNo: number,
  matchingThemes: Array<{ no: number; name: string }>,
  topicPdfUrls: Record<number, string>
): Promise<string> {
  const client = getClient();
  const message = shingiTopicsFlex(sessionNo, matchingThemes, topicPdfUrls);
  const res = await client.pushMessage({ to: lineUserId, messages: [message] });
  return res.sentMessages?.[0]?.id ?? "";
}

export async function pushShingiNoMatch(
  lineUserId: string,
  sessionNo: number,
  baseUrl: string
): Promise<string> {
  const client = getClient();
  const message = shingiNoMatchFlex(sessionNo, baseUrl);
  const res = await client.pushMessage({ to: lineUserId, messages: [message] });
  return res.sentMessages?.[0]?.id ?? "";
}

export async function pushTrialEndingReminder(lineUserId: string, daysLeft: number): Promise<void> {
  const client = getClient();
  const text = daysLeft === 1
    ? "🎁 無料期間は明日までです。このまま自動で本登録となり、月額300円のお支払いが開始されます。解約をご希望の場合は「ヨミトク編集室」の設定ページからお手続きください。"
    : `🎁 無料期間は残り${daysLeft}日です。このまま自動で本登録となり、月額300円のお支払いが開始されます。解約をご希望の場合は「ヨミトク編集室」の設定ページからお手続きください。`;
  await client.pushMessage({
    to: lineUserId,
    messages: [{ type: "text", text }],
  });
}

export async function pushTestMessage(lineUserId: string): Promise<void> {
  const client = getClient();
  await client.pushMessage({
    to: lineUserId,
    messages: [
      { type: "text", text: "✅ ヨミトクのテスト送信です。正常に受信できています。" },
    ],
  });
}
