import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 広告バナー・カードのリンク先はすべてこのエンドポイント経由にし、クリック数を計測してから
// 実際のリンク先へ302リダイレクトする。
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ad = await prisma.advertisement.findUnique({ where: { id }, select: { linkUrl: true } });
  if (!ad) return NextResponse.redirect(new URL("/base", req.url));

  await prisma.advertisement.update({ where: { id }, data: { clicks: { increment: 1 } } }).catch(() => {});
  return NextResponse.redirect(ad.linkUrl);
}
