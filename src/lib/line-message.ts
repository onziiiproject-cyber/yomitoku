import { messagingApi } from "@line/bot-sdk";

function getClient() {
  return new messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  });
}

export interface DigestDoc {
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

function weeklyDigestFlex(
  weekLabel: string,
  docCount: number,
  digestText: string,
  allTags: string[],
  digestUrl: string,
  libraryUrl: string | null
): messagingApi.FlexMessage {
  const uniqueTags = [...new Set(allTags)].slice(0, 6);

  const footerContents: messagingApi.FlexComponent[] = [
    {
      type: "button",
      action: { type: "uri", label: "詳細を見る →", uri: digestUrl },
      style: "primary",
      color: "#1B7A6D",
      height: "md",
    } as messagingApi.FlexButton,
  ];

  if (libraryUrl) {
    footerContents.push({
      type: "button",
      action: { type: "uri", label: "📚 過去の資料を検索", uri: libraryUrl },
      style: "secondary",
      height: "sm",
      margin: "sm",
    } as messagingApi.FlexButton);
  }

  return {
    type: "flex",
    altText: `【ヨミトク】週刊ダイジェスト ${weekLabel}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1B5E52",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "📋  介護保険最新情報",
            color: "#a8d5c8",
            size: "xs",
            weight: "bold",
          } as messagingApi.FlexText,
          {
            type: "text",
            text: "週刊ダイジェスト",
            color: "#ffffff",
            size: "xl",
            weight: "bold",
            margin: "sm",
          } as messagingApi.FlexText,
          {
            type: "text",
            text: `${weekLabel}  ·  ${docCount}件の通知`,
            color: "#a8d5c8",
            size: "sm",
            margin: "sm",
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
            text: digestText || "今週の介護保険最新情報をまとめました。",
            wrap: true,
            size: "sm",
            color: "#333333",
            maxLines: 5,
          } as messagingApi.FlexText,
          ...(uniqueTags.length > 0
            ? [
                {
                  type: "text",
                  text: uniqueTags.join("  ·  "),
                  size: "xs",
                  color: "#1B7A6D",
                  wrap: true,
                  margin: "md",
                } as messagingApi.FlexText,
              ]
            : []),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        spacing: "sm",
        contents: footerContents,
      },
    } as messagingApi.FlexBubble,
  };
}

function breakingNewsFlex(doc: DigestDoc): messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: `【ヨミトク速報】${doc.title}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#7B2D2D",
        paddingAll: "16px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "⚠️  速報",
                color: "#ffffff",
                size: "sm",
                weight: "bold",
              } as messagingApi.FlexText,
              {
                type: "text",
                text: "重要度の高い通知をお知らせします",
                color: "#f5c0b0",
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
            action: { type: "uri", label: "通知PDFを見る →", uri: doc.url },
            style: "primary",
            color: "#7B2D2D",
          } as messagingApi.FlexButton,
        ],
      },
    } as messagingApi.FlexBubble,
  };
}

export async function pushWeeklyDigest(
  lineUserId: string,
  digestText: string,
  docs: DigestDoc[],
  weekLabel: string,
  batchId: string
): Promise<string> {
  const client = getClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const digestUrl = `${appUrl}/digest/${batchId}`;
  const liffLibraryId = process.env.NEXT_PUBLIC_LIFF_LIBRARY_ID;
  const libraryUrl = liffLibraryId ? `https://liff.line.me/${liffLibraryId}` : null;

  const allTags = docs.flatMap((d) => d.tags);
  const message = weeklyDigestFlex(weekLabel, docs.length, digestText, allTags, digestUrl, libraryUrl);

  const res = await client.pushMessage({ to: lineUserId, messages: [message] });
  return res.sentMessages?.[0]?.id ?? "";
}

export async function pushBreakingNews(
  lineUserId: string,
  doc: DigestDoc
): Promise<string> {
  const client = getClient();
  const message = breakingNewsFlex(doc);
  const res = await client.pushMessage({ to: lineUserId, messages: [message] });
  return res.sentMessages?.[0]?.id ?? "";
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
