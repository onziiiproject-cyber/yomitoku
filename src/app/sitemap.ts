import type { MetadataRoute } from "next";

const SITE_URL = "https://yomitoku-base.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/register", "/legal/terms", "/legal/privacy", "/legal/commercial"];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "yearly",
    priority: route === "" ? 1 : 0.5,
  }));
}
