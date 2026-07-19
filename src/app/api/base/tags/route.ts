import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userTags = await prisma.userTag.findMany({
    where: { userId: session.userId },
    include: { tag: true },
  });

  return NextResponse.json({ selectedKeys: userTags.map((ut) => ut.tag.key) });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tagKeys } = (await req.json()) as { tagKeys: string[] };
  if (!Array.isArray(tagKeys)) {
    return NextResponse.json({ error: "tagKeys must be an array" }, { status: 400 });
  }

  const tags = await prisma.tag.findMany({ where: { key: { in: tagKeys } } });

  await prisma.userTag.deleteMany({ where: { userId: session.userId } });
  if (tags.length > 0) {
    await prisma.userTag.createMany({
      data: tags.map((t) => ({ userId: session.userId!, tagId: t.id })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ ok: true, savedCount: tags.length });
}
