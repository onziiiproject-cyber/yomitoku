import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docId, body } = await req.json();
  if (!docId || !body?.trim()) return NextResponse.json({ error: "docId and body required" }, { status: 400 });
  if (body.trim().length > 500) return NextResponse.json({ error: "500文字以内で入力してください" }, { status: 400 });

  const comment = await prisma.articleComment.create({
    data: { companyId: session.companyId, siteDocumentId: docId, body: body.trim() },
    include: { company: { select: { name: true } } },
  });

  return NextResponse.json({
    id: comment.id,
    body: comment.body,
    companyName: comment.company.name,
    createdAt: comment.createdAt,
  });
}
