import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function verifySignature(body: string, sig: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const expected = hmac.digest("base64");
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("x-line-signature") ?? "";

  if (!verifySignature(body, sig, process.env.LINE_CHANNEL_SECRET!)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(body);
  const events: Array<{ type: string; source?: { userId?: string } }> = payload.events ?? [];

  for (const ev of events) {
    if (ev.type === "unfollow" && ev.source?.userId) {
      await prisma.lineRecipient.updateMany({
        where: { lineUserId: ev.source.userId },
        data: { unfollowedAt: new Date() },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
