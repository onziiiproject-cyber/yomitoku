import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "No token" }, { status: 400 });

  // Verify token with LINE
  const lineRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!lineRes.ok) {
    return NextResponse.json({ error: "Invalid LINE token" }, { status: 401 });
  }

  const { userId } = await lineRes.json();

  // Check active subscription
  const recipient = await prisma.lineRecipient.findUnique({
    where: { lineUserId: userId },
    include: { company: true },
  });

  if (!recipient || recipient.unfollowedAt || recipient.company.status !== "ACTIVE") {
    return NextResponse.json({ error: "Not a subscriber" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, userId });
}
