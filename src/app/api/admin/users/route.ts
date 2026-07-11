import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [events, recipients] = await Promise.all([
    prisma.webhookEvent.findMany({
      where: { source: "LINE" },
      orderBy: { receivedAt: "desc" },
      take: 10,
    }),
    prisma.lineRecipient.findMany({
      orderBy: { followedAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({ events, recipients });
}

// Create test company + link a LINE user
export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lineUserId, displayName } = await req.json();

  // Find or create test company
  let company = await prisma.company.findFirst({ where: { email: "test@yomitoku.test" } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "テスト事業所",
        contactName: "テスト担当者",
        email: "test@yomitoku.test",
        status: "ACTIVE",
      },
    });
  } else {
    company = await prisma.company.update({ where: { id: company.id }, data: { status: "ACTIVE" } });
  }

  // Upsert LINE recipient
  const recipient = await prisma.lineRecipient.upsert({
    where: { lineUserId },
    create: {
      lineUserId,
      displayName: displayName ?? "テストユーザー",
      companyId: company.id,
    },
    update: {
      displayName: displayName ?? "テストユーザー",
      unfollowedAt: null,
      companyId: company.id,
    },
  });

  return NextResponse.json({ ok: true, company, recipient });
}
