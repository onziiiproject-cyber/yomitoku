import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function verifyUser(token: string): Promise<string | null> {
  const lineRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!lineRes.ok) return null;

  const { userId } = await lineRes.json();
  const recipient = await prisma.lineRecipient.findUnique({
    where: { lineUserId: userId },
    include: { company: true },
  });

  if (!recipient || recipient.unfollowedAt || recipient.company.status !== "ACTIVE") {
    return null;
  }
  return userId;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await verifyUser(token);
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const tags = url.searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const perPage = 20;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    summary: { not: null },
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ];
  }

  if (tags.length > 0) {
    where.tags = { hasSome: tags };
  }

  if (year) {
    const y = parseInt(year);
    const m = month ? parseInt(month) - 1 : 0;
    const endM = month ? parseInt(month) : 12;
    where.createdAt = {
      gte: new Date(y, m, 1),
      lt: new Date(month ? y : y + 1, endM % 12, 1),
    };
  }

  const [docs, total] = await Promise.all([
    prisma.siteDocument.findMany({
      where,
      select: {
        id: true,
        title: true,
        summary: true,
        tags: true,
        importance: true,
        publishedAt: true,
        url: true,
        source: true,
        createdAt: true,
      },
      orderBy: [
        { importance: "desc" },
        { publishedAt: "desc" },
      ],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.siteDocument.count({ where }),
  ]);

  return NextResponse.json({ docs, total, page, perPage });
}
