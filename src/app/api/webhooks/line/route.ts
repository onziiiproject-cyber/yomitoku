import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { messagingApi } from "@line/bot-sdk";

export const dynamic = "force-dynamic";

function verifySignature(body: string, sig: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const expected = hmac.digest("base64");
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

function getClient() {
  return new messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  });
}

type LineEvent = {
  type: string;
  replyToken?: string;
  source?: { userId?: string };
  message?: { type: string; text?: string };
};

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("x-line-signature") ?? "";

  if (!verifySignature(body, sig, process.env.LINE_CHANNEL_SECRET!)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(body);
  const events: LineEvent[] = payload.events ?? [];
  const client = getClient();

  for (const ev of events) {
    const userId = ev.source?.userId;

    if (ev.type === "follow" && userId) {
      // Log follow event
      await prisma.webhookEvent.upsert({
        where: { source_externalEventId: { source: "LINE", externalEventId: `follow-${userId}` } },
        create: {
          source: "LINE",
          externalEventId: `follow-${userId}`,
          type: "follow",
          payload: JSON.stringify({ userId }),
          processedAt: new Date(),
        },
        update: { processedAt: new Date() },
      });
    }

    if (ev.type === "unfollow" && userId) {
      await prisma.lineRecipient.updateMany({
        where: { lineUserId: userId },
        data: { unfollowedAt: new Date() },
      });
    }

    // Reply with LINE user ID when user sends any text message (for setup/debug)
    if (ev.type === "message" && ev.message?.type === "text" && ev.replyToken && userId) {
      const recipient = await prisma.lineRecipient.findUnique({ where: { lineUserId: userId } });
      const replyText = recipient
        ? `✅ 登録済みです\nLINE ID: ${userId}`
        : `あなたのLINE ID:\n${userId}\n\n※ まだ会員登録が完了していません。`;

      await client.replyMessage({
        replyToken: ev.replyToken,
        messages: [{ type: "text", text: replyText }],
      });
    }
  }

  return NextResponse.json({ ok: true });
}
