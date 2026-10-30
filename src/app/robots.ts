import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

const PRIVATE_PATHS = [
  "/login",
  "/auth/",
  "/spots/new",
  "/spots/mine",
  "/spots/*/edit",
  "/api/",
];

/**
 * Named groups replace the `*` group for that bot, so each AI crawler
 * repeats the same allow and disallow list. `/llms.txt` stays allowed.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "ClaudeBot",
];

function crawlRule(userAgent: string | string[]): {
  userAgent: string | string[];
  allow: string[];
  disallow: string[];
} {
  return {
    userAgent,
    allow: ["/", "/llms.txt"],
    disallow: [...PRIVATE_PATHS],
  };
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [crawlRule("*"), crawlRule(AI_CRAWLERS)],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
