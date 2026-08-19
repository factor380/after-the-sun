import type { MetadataRoute } from "next";

const BASE_URL = "https://after-the-sun.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/auth/", "/spots/new", "/spots/mine", "/api/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
