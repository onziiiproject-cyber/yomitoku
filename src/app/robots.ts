import type { MetadataRoute } from "next";

const SITE_URL = "https://yomitoku-base.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/base/login", "/base/settings", "/base/favorites"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
