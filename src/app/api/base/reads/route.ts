import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docId } = await req.json();
  if (!docId) return NextResponse.json({ error: "docId required" }, { status: 400 });

  const existing = await prisma.articleRead.findUnique({
    where: { companyId_siteDocumentId: { companyId: session.companyId, siteDocumentId: docId } },
  });

  if (existing) {
    await prisma.articleRead.delete({
      where: { companyId_siteDocumentId: { companyId: session.companyId, siteDocumentId: docId } },
    });
  } else {
    await prisma.articleRead.create({
      data: { companyId: session.companyId, siteDocumentId: docId },
    });
  }

  const count = await prisma.articleRead.count({ where: { siteDocumentId: docId } });
  return NextResponse.json({ read: !existing, count });
}
