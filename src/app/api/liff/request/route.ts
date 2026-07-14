import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendFeatureRequestNotification } from "@/lib/resend";

async function getRecipientFromToken(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const accessToken = auth.slice(7);

  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) return null;

  const { userId, displayName } = await profileRes.json();
  const recipient = await prisma.lineRecipient.findUnique({
    where: { lineUserId: userId },
    include: { company: true },
  });
  return recipient ? { ...recipient, displayName: displayName ?? recipient.displayName ?? "不明" } : null;
}

export async function POST(req: NextRequest) {
  const recipient = await getRecipientFromToken(req);
  if (!recipient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, body } = await req.json() as { title: string; body: string };
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "タイトルと内容を入力してください" }, { status: 400 });
  }

  await sendFeatureRequestNotification({
    displayName: recipient.displayName,
    companyName: recipient.company.name,
    title: title.trim(),
    body: body.trim(),
  });

  return NextResponse.json({ ok: true });
}
