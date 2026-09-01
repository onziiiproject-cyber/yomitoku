import { prisma } from "@/lib/prisma";
import AdManager from "./AdManager";

// ビルド時の静的スナップショットにならないよう強制的に動的レンダリングする
export const dynamic = "force-dynamic";

export default async function AdminAdsPage() {
  const ads = await prisma.advertisement.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows = ads.map((a) => ({
    id: a.id,
    advertiserName: a.advertiserName,
    headline: a.headline,
    imageUrl: a.imageUrl,
    linkUrl: a.linkUrl,
    placement: a.placement,
    startAt: a.startAt ? a.startAt.toISOString() : null,
    endAt: a.endAt ? a.endAt.toISOString() : null,
    disabledAt: a.disabledAt ? a.disabledAt.toISOString() : null,
    impressions: a.impressions,
    clicks: a.clicks,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1F2E2A", margin: 0 }}>広告管理</h1>
      <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
        掲載中{ads.filter((a) => !a.disabledAt).length}件／全{ads.length}件
      </p>
      <AdManager initialAds={rows} />
    </div>
  );
}
