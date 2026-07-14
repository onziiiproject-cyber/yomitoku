import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { commentId } = await req.json();
  if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

  const existing = await prisma.commentLike.findUnique({
    where: { companyId_commentId: { companyId: session.companyId, commentId } },
  });

  if (existing) {
    await prisma.commentLike.delete({
      where: { companyId_commentId: { companyId: session.companyId, commentId } },
    });
  } else {
    await prisma.commentLike.create({
      data: { companyId: session.companyId, commentId },
    });
  }

  const count = await prisma.commentLike.count({ where: { commentId } });
  return NextResponse.json({ liked: !existing, count });
}
