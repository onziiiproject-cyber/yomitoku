import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = "https://yomitoku-base.com";

// 記事はDBを都度クエリするので、ビルド時1回きりの静的生成のままだとデプロイ後に
// 追加された記事が反映されない。1時間ごとに再生成させて追従させる。
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/base", "/register", "/legal/terms", "/legal/privacy", "/legal/commercial"];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/base" ? "daily" : "yearly",
    priority: route === "" ? 1 : route === "/base" ? 0.9 : 0.5,
  }));

  const articles = await prisma.siteDocument.findMany({
    where: { summary: { not: null }, publishedAt: { not: null } },
    select: { id: true, publishedAt: true, processedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  const articleEntries: MetadataRoute.Sitemap = articles.map((doc) => ({
    url: `${SITE_URL}/base/articles/${doc.id}`,
    lastModified: doc.processedAt ?? doc.publishedAt!,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticEntries, ...articleEntries];
}
