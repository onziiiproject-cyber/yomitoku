import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// POST /api/base/favorites  { docId }  → { favorited: boolean }
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docId } = await req.json() as { docId: string };
  if (!docId) return NextResponse.json({ error: "docId required" }, { status: 400 });

  const existing = await prisma.favorite.findUnique({
    where: { companyId_siteDocumentId: { companyId: session.companyId, siteDocumentId: docId } },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { companyId_siteDocumentId: { companyId: session.companyId, siteDocumentId: docId } },
    });
    return NextResponse.json({ favorited: false });
  } else {
    await prisma.favorite.create({
      data: { companyId: session.companyId, siteDocumentId: docId },
    });
    return NextResponse.json({ favorited: true });
  }
}

// GET /api/base/favorites  → { ids: string[] }
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ids: [] });

  const favs = await prisma.favorite.findMany({
    where: { companyId: session.companyId },
    select: { siteDocumentId: true },
  });
  return NextResponse.json({ ids: favs.map((f) => f.siteDocumentId) });
}
