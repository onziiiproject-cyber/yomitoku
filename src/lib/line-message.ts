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

function weeklyDigestFlex(
  weekLabel: string,
  docCount: number,
  digestText: string,
  allTags: string[],
  digestUrl: string,
  libraryUrl: string | null,
  pdfUrl: string | null = null
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

  if (pdfUrl) {
    footerContents.push({
      type: "button",
      action: { type: "uri", label: "📄 週刊ダイジェストPDFを見る", uri: pdfUrl },
      style: "secondary",
      height: "sm",
      margin: "sm",
    } as messagingApi.FlexButton);
  }

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
            action: { type: "uri", label: "BASEで記事を読む →", uri: `${appUrl}/base/articles/${doc.id}` },
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
  batchId: string,
  pdfUrl: string | null = null
): Promise<string> {
  const client = getClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const digestUrl = `${appUrl}/digest/${batchId}`;
  const liffLibraryId = process.env.NEXT_PUBLIC_LIFF_LIBRARY_ID;
  const libraryUrl = liffLibraryId ? `https://liff.line.me/${liffLibraryId}` : null;

  const allTags = docs.flatMap((d) => d.tags);
  const message = weeklyDigestFlex(weekLabel, docs.length, digestText, allTags, digestUrl, libraryUrl, pdfUrl);

  const res = await client.pushMessage({ to: lineUserId, messages: [message] });
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
        backgroundColor: "#1B5E52",
        paddingAll: "20px",
        contents: [
          { type: "text", text: "📋  分科会かんたん解説", color: "#a8d5c8", size: "xs", weight: "bold" } as messagingApi.FlexText,
          { type: "text", text: `第${sessionNo}回 ${councilShortName}`, color: "#ffffff", size: "lg", weight: "bold", wrap: true, margin: "sm" } as messagingApi.FlexText,
          { type: "text", text: `${date}  ·  ${featureLabel}`, color: "#a8d5c8", size: "sm", margin: "sm", wrap: true } as messagingApi.FlexText,
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
            color: "#1B7A6D",
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
        backgroundColor: "#2E7D8C",
        paddingAll: "16px",
        contents: [
          { type: "text", text: "📌  あなたの事業所に関係するテーマがあります", color: "#ffffff", size: "sm", weight: "bold", wrap: true } as messagingApi.FlexText,
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
            text: "登録タグに関連するテーマが今回はありませんでした。全テーマの解説はBASEからご確認いただけます。",
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
            action: { type: "uri", label: "全テーマをBASEで見る →", uri: baseUrl },
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

export async function pushTestMessage(lineUserId: string): Promise<void> {
  const client = getClient();
  await client.pushMessage({
    to: lineUserId,
    messages: [
      { type: "text", text: "✅ ヨミトクのテスト送信です。正常に受信できています。" },
    ],
  });
}
