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

function formatWeeklyDigest(
  digest: string,
  docs: DigestDoc[],
  weekLabel: string
): messagingApi.Message[] {
  const important = docs.filter((d) => d.importance === "high");
  const normal = docs.filter((d) => d.importance === "normal");

  let body = `【週刊ダイジェスト】${weekLabel}\n\n${digest}\n\n`;

  if (important.length > 0) {
    body += "🔴 重要な情報\n";
    important.forEach((d) => {
      body += `▶ ${d.title}\n${d.url}\n\n`;
    });
  }

  if (normal.length > 0) {
    body += "📋 その他の情報\n";
    normal.slice(0, 3).forEach((d) => {
      body += `▶ ${d.title}\n`;
    });
  }

  body += "\n━━━━━━━━━━━━━━\nヨミトク | 介護保険最新情報";

  return [{ type: "text", text: body }];
}

function formatBreakingNews(doc: DigestDoc): messagingApi.Message[] {
  const tagStr = doc.tags.length > 0 ? `[${doc.tags.join(" / ")}]` : "";
  const body =
    `🚨 速報\n${tagStr}\n\n` +
    `${doc.title}\n\n` +
    `${doc.summary}\n\n` +
    `詳細はこちら:\n${doc.url}\n\n` +
    `━━━━━━━━━━━━━━\nヨミトク | 介護保険最新情報`;

  return [{ type: "text", text: body }];
}

export async function pushWeeklyDigest(
  lineUserId: string,
  digest: string,
  docs: DigestDoc[],
  weekLabel: string
): Promise<string> {
  const client = getClient();
  const messages = formatWeeklyDigest(digest, docs, weekLabel);
  const res = await client.pushMessage({
    to: lineUserId,
    messages,
  });
  return res.sentMessages?.[0]?.id ?? "";
}

export async function pushBreakingNews(
  lineUserId: string,
  doc: DigestDoc
): Promise<string> {
  const client = getClient();
  const messages = formatBreakingNews(doc);
  const res = await client.pushMessage({
    to: lineUserId,
    messages,
  });
  return res.sentMessages?.[0]?.id ?? "";
}

export async function pushTestMessage(lineUserId: string): Promise<void> {
  const client = getClient();
  await client.pushMessage({
    to: lineUserId,
    messages: [
      {
        type: "text",
        text: "✅ ヨミトクのテスト送信です。正常に受信できています。",
      },
    ],
  });
}
