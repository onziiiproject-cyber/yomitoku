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

    // Handle text messages: company code or info
    if (ev.type === "message" && ev.message?.type === "text" && ev.replyToken && userId) {
      const text = ev.message.text?.trim() ?? "";
      const existingRecipient = await prisma.lineRecipient.findUnique({ where: { lineUserId: userId } });

      // Check if the message looks like a company invite code
      const codeMatch = text.match(/^[A-Za-z0-9]{6,12}$/);
      if (codeMatch && !existingRecipient) {
        const company = await prisma.company.findFirst({
          where: { inviteCode: text.toUpperCase(), status: "ACTIVE" },
          include: { lineRecipients: { where: { unfollowedAt: null } } },
        });

        if (!company) {
          await client.replyMessage({
            replyToken: ev.replyToken,
            messages: [{ type: "text", text: `「${text}」は有効な会社コードではありません。\n登録済みの会社コードを確認してください。` }],
          });
        } else if (company.lineRecipients.length >= company.maxRecipients) {
          await client.replyMessage({
            replyToken: ev.replyToken,
            messages: [{ type: "text", text: `${company.name}のLINE登録人数が上限（${company.maxRecipients}名）に達しています。\n管理者にお問い合わせください。` }],
          });
        } else {
          // Get display name from LINE
          let displayName = "メンバー";
          try {
            const profile = await client.getProfile(userId);
            displayName = profile.displayName;
          } catch { /* ignore */ }

          await prisma.lineRecipient.create({
            data: { lineUserId: userId, companyId: company.id, displayName },
          });

          await client.replyMessage({
            replyToken: ev.replyToken,
            messages: [{
              type: "text",
              text: `✅ 登録完了！\n\n${company.name}のメンバーとして登録されました。\n毎週水曜日に介護保険最新情報をお届けします。\n\nヨミトク BASE でいつでも過去の情報を検索できます。`,
            }],
          });
        }
        continue;
      }

      // Already registered → show status
      if (existingRecipient) {
        const company = await prisma.company.findUnique({ where: { id: existingRecipient.companyId } });
        await client.replyMessage({
          replyToken: ev.replyToken,
          messages: [{ type: "text", text: `✅ 登録済みです\n事業所：${company?.name ?? "-"}\n\nヨミトク BASEから過去の情報を検索できます。` }],
        });
      } else {
        await client.replyMessage({
          replyToken: ev.replyToken,
          messages: [{ type: "text", text: `ヨミトクへようこそ！\n\n事業所の会社コードをこのチャットに送ると、LINE通知を受け取れるようになります。\n\n会社コードはヨミトクBASE（設定ページ）で確認できます。` }],
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
