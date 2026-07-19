import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docId, category, body } = await req.json();
  if (!docId || !category?.trim()) {
    return NextResponse.json({ error: "docId and category required" }, { status: 400 });
  }
  if (body && body.trim().length > 500) {
    return NextResponse.json({ error: "500文字以内で入力してください" }, { status: 400 });
  }

  const report = await prisma.articleReport.create({
    data: {
      companyId: session.companyId,
      siteDocumentId: docId,
      category: category.trim(),
      body: body?.trim() || null,
    },
  });

  return NextResponse.json({ id: report.id });
}
