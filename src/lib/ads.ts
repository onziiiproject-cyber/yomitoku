import { prisma } from "./prisma";
import type { AdPlacement } from "@/generated/prisma/client";

export interface ActiveAd {
  id: string;
  imageUrl: string;
  linkUrl: string;
}

// 指定placementの掲載中広告から1件選ぶ（複数あれば均等ランダム）。
// 表示のたびにimpressionsを+1するが、失敗しても表示自体は止めない（fire-and-forget）。
export async function getActiveAd(placement: AdPlacement): Promise<ActiveAd | null> {
  const now = new Date();
  const ads = await prisma.advertisement.findMany({
    where: {
      placement,
      disabledAt: null,
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    },
    select: { id: true, imageUrl: true, linkUrl: true },
  });
  if (ads.length === 0) return null;

  const chosen = ads[Math.floor(Math.random() * ads.length)];
  prisma.advertisement.update({ where: { id: chosen.id }, data: { impressions: { increment: 1 } } }).catch(() => {});
  return chosen;
}

// フィード用: 指定件数ぶんまとめて取得し、足りない分は使い回して埋める。
// 広告主が複数いる時に同じ枠に毎回同じ1社だけが出続けないようにする。
export async function getFeedAds(count: number): Promise<ActiveAd[]> {
  if (count <= 0) return [];
  const now = new Date();
  const ads = await prisma.advertisement.findMany({
    where: {
      placement: "FEED",
      disabledAt: null,
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    },
    select: { id: true, imageUrl: true, linkUrl: true },
  });
  if (ads.length === 0) return [];

  const shuffled = [...ads].sort(() => Math.random() - 0.5);
  const picked: ActiveAd[] = [];
  for (let i = 0; i < count; i++) picked.push(shuffled[i % shuffled.length]);

  const ids = [...new Set(picked.map((a) => a.id))];
  prisma.advertisement.updateMany({ where: { id: { in: ids } }, data: { impressions: { increment: 1 } } }).catch(() => {});

  return picked;
}
