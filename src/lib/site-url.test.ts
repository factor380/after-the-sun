import { format as formatUrl } from "node:url";
import { describe, expect, it } from "vitest";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import {
  matchHas,
  prepareDestination,
} from "next/dist/shared/lib/router/utils/prepare-destination";
import { getRedirectStatus, modifyRouteRegex } from "next/dist/lib/redirect-status";
import nextConfig from "../../next.config";
import { LEGACY_JUDEA_SAMARIA_PATH } from "@/lib/regions";
import {
  DEFAULT_SITE_URL,
  LEGACY_PRODUCTION_HOST,
  legacyProductionRedirects,
} from "@/lib/site-url";

const PREVIEW_HOSTS = [
  "localhost",
  "localhost:3004",
  "127.0.0.1:3004",
  "after-the-sun.com",
  "www.after-the-sun.com",
  "after-the-sun-git-main-factor380.vercel.app",
  "after-the-sun-abc123-factor380.vercel.app",
  "after-the-sun-factor380.vercel.app",
  "preview-factor380.vercel.app",
  "after-the-sun.vercel.app.evil.example",
  "notafter-the-sun.vercel.app",
  "after-the-sunXvercelYapp",
];

function requestHost(host: string) {
  return { headers: { host } } as Parameters<typeof matchHas>[0];
}

describe("legacy production host redirect", () => {
  it("is a permanent redirect of only after-the-sun.vercel.app", async () => {
    const rules = legacyProductionRedirects();
    const redirects = await nextConfig.redirects!();

    expect(rules).toEqual([
      {
        source: "/",
        has: [{ type: "host", value: "after-the-sun\\.vercel\\.app" }],
        destination: `${DEFAULT_SITE_URL}/`,
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "after-the-sun\\.vercel\\.app" }],
        destination: `${DEFAULT_SITE_URL}/:path*`,
        permanent: true,
      },
    ]);
    expect(redirects.slice(0, 2)).toEqual(rules);
    expect(redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/50",
          destination: "/about",
          permanent: true,
        }),
        expect.objectContaining({
          source: LEGACY_JUDEA_SAMARIA_PATH,
          destination: "/regions",
          permanent: true,
        }),
      ]),
    );
    for (const rule of [...rules, ...redirects.slice(2)]) {
      expect(getRedirectStatus(rule)).toBe(308);
    }
  });

  it("keeps the path and query for that host and skips every other host", () => {
    const rules = legacyProductionRedirects();
    const hostRule = rules[0]!.has[0]!;

    for (const path of ["/", "/about", "/spots/abc", "/regions/jerusalem"]) {
      const rule = rules.find((entry) => {
        const matchPath = getPathMatch(entry.source, {
          strict: true,
          removeUnnamedParams: true,
          regexModifier: (regex) => modifyRouteRegex(regex, ["/_next"]),
        });
        return matchPath(path);
      });
      expect(rule, path).toBeDefined();
      if (!rule) continue;
      const params = getPathMatch(rule.source, {
        strict: true,
        removeUnnamedParams: true,
        regexModifier: (regex) => modifyRouteRegex(regex, ["/_next"]),
      })(path);
      expect(params, path).not.toBe(false);
      if (!params) continue;

      const matched = matchHas(requestHost(LEGACY_PRODUCTION_HOST), {}, rule.has, []);
      expect(matched).not.toBe(false);

      const { parsedDestination } = prepareDestination({
        appendParamsToQuery: false,
        destination: rule.destination,
        params: params as Record<string, string | string[]>,
        query: { next: "/spots/mine", q: "שקיעה" },
      });

      const location = formatUrl({
        protocol: parsedDestination.protocol,
        hostname: parsedDestination.hostname,
        pathname: parsedDestination.pathname,
        query: parsedDestination.query,
      });
      const target = new URL(location);
      expect(target.origin, path).toBe(DEFAULT_SITE_URL);
      expect(target.pathname, path).toBe(path);
      expect(target.searchParams.get("next"), path).toBe("/spots/mine");
      expect(target.searchParams.get("q"), path).toBe("שקיעה");
    }

    expect(
      matchHas(requestHost("After-The-Sun.vercel.app:443"), {}, [hostRule], []),
    ).not.toBe(false);

    for (const host of PREVIEW_HOSTS) {
      expect(matchHas(requestHost(host), {}, [hostRule], []), host).toBe(false);
    }
  });
});
