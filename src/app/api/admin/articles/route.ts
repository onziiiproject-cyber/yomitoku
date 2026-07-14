import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-secret") !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const source = req.nextUrl.searchParams.get("source");
  const docs = await prisma.siteDocument.findMany({
    where: {
      publishedAt: { not: null },
      ...(source ? { source } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: 10,
    select: {
      id: true, title: true, summary: true, tags: true,
      source: true, publishedAt: true, importance: true,
      structuredContent: true,
    },
  });
  return NextResponse.json({ docs });
}
