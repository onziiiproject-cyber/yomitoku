import { messagingApi, webhook } from "@line/bot-sdk";

export const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

export const lineMiddlewareConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};
