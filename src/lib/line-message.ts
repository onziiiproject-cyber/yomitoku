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

function tagChip(tag: string): messagingApi.FlexBox {
  return {
    type: "box",
    layout: "vertical",
    paddingAll: "4px",
    paddingStart: "10px",
    paddingEnd: "10px",
    backgroundColor: "#E8F5F1",
    cornerRadius: "20px",
    contents: [
      { type: "text", text: tag, size: "xxs", color: "#1B7A6D" } as messagingApi.FlexText,
    ],
  };
}

export interface WeeklyCardDoc {
  id: string;
  title: string;
  hookTitle: string | null;
  source: string;
  tags: string[];
  importanceStars: number | null;
  urgencyStars: number | null;
  isNew: boolean;
  decisionStatus: string | null;
}

const WEEKLY_SOURCE_BADGE: Record<string, { label: string; color: string }> = {
  mhlw_latest: { label: "介護保険最新情報", color: "#0D686E" },
  shingi: { label: "分科会かんたん解説", color: "#B45309" },
};

const DECISION_STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  discussion: { label: "議論中", bg: "#FEF3C7", color: "#B45309" },
  decided: { label: "決定事項", bg: "#E8F5F1", color: "#0D686E" },
};

// 情報源バッジ（塗りつぶし）と紛らわしくならないよう、薄い背景色のバッジにする
function paleBadgePill(text: string, bg: string, color: string): messagingApi.FlexBox {
  return {
    type: "box",
    layout: "vertical",
    paddingAll: "3px",
    paddingStart: "8px",
    paddingEnd: "8px",
    backgroundColor: bg,
    cornerRadius: "4px",
    contents: [{ type: "text", text, size: "xxs", weight: "bold", color } as messagingApi.FlexText],
  };
}

function starText(stars: number | null): string {
  if (!stars) return "";
  return "★".repeat(stars) + "☆".repeat(5 - stars);
}

function badgePill(text: string, bg: string, color = "#ffffff"): messagingApi.FlexBox {
  return {
    type: "box",
    layout: "vertical",
    paddingAll: "3px",
    paddingStart: "8px",
    paddingEnd: "8px",
    backgroundColor: bg,
    cornerRadius: "4px",
    contents: [{ type: "text", text, size: "xxs", weight: "bold", color } as messagingApi.FlexText],
  };
}

function weeklyLeadFlex(
  weekLabel: string,
  docCount: number,
  digestText: string,
  digestUrl: string
): messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: `【週刊ヨミトク】${weekLabel}（${docCount}件のトピックス）`,
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
            text: `${weekLabel}  ·  今週は${docCount}件のトピックスがありました`,
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
        contents: [
          {
            type: "text",
            text: digestText || "今週の介護保険最新情報をまとめました。",
            wrap: true,
            size: "sm",
            color: "#333333",
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
            action: { type: "uri", label: "この後にカード一覧が届きます →", uri: digestUrl },
            style: "primary",
            color: "#0C447C",
          } as messagingApi.FlexButton,
        ],
      },
    } as messagingApi.FlexBubble,
  };
}

function weeklyCardBubble(doc: WeeklyCardDoc, appUrl: string): messagingApi.FlexBubble {
  const src = WEEKLY_SOURCE_BADGE[doc.source] ?? { label: doc.source, color: "#555555" };
  const displayTitle = doc.hookTitle || doc.title;

  const badges: messagingApi.FlexComponent[] = [];
  if (doc.isNew) badges.push(badgePill("新着", "#F5A623"));
  badges.push(badgePill(src.label, src.color));
  const decisionBadge = doc.decisionStatus ? DECISION_STATUS_BADGE[doc.decisionStatus] : null;
  if (decisionBadge) badges.push(paleBadgePill(decisionBadge.label, decisionBadge.bg, decisionBadge.color));

  const starLines: messagingApi.FlexComponent[] = [];
  if (doc.importanceStars) {
    starLines.push({ type: "text", text: `重要度 ${starText(doc.importanceStars)}`, size: "xs", color: "#888888", margin: "sm" } as messagingApi.FlexText);
  }
  if (doc.urgencyStars) {
    starLines.push({ type: "text", text: `緊急度 ${starText(doc.urgencyStars)}`, size: "xs", color: "#888888" } as messagingApi.FlexText);
  }

  return {
    type: "bubble",
    size: "kilo",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      contents: [
        { type: "box", layout: "horizontal", spacing: "xs", contents: badges } as messagingApi.FlexBox,
        {
          type: "text",
          text: displayTitle,
          wrap: true,
          weight: "bold",
          size: "md",
          color: "#1a1a1a",
          margin: "sm",
          maxLines: 3,
        } as messagingApi.FlexText,
        ...starLines,
        ...(doc.tags.length > 0
          ? [
              {
                type: "box",
                layout: "horizontal",
                spacing: "xs",
                margin: "sm",
                contents: doc.tags.slice(0, 2).map(tagChip),
              } as messagingApi.FlexBox,
            ]
          : []),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "12px",
      contents: [
        {
          type: "button",
          action: { type: "uri", label: "編集室で読む →", uri: `${appUrl}/base/articles/${doc.id}` },
          style: "primary",
          color: src.color,
          height: "sm",
        } as messagingApi.FlexButton,
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
                  contents: doc.tags.slice(0, 3).map(tagChip),
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

export async function pushWeeklyDigestCards(
  lineUserId: string,
  weekLabel: string,
  docCount: number,
  digestText: string,
  docs: WeeklyCardDoc[],
  batchId: string
): Promise<string> {
  const client = getClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yomitoku-base.com";
  const digestUrl = `${appUrl}/digest/${batchId}`;

  const lead = weeklyLeadFlex(weekLabel, docCount, digestText, digestUrl);
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
