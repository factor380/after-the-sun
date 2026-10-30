import { beforeEach, describe, expect, it, vi } from "vitest";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { JERUSALEM_SUNSET_GUIDE } from "@/lib/guides/jerusalem-sunset";
import { SUNSET_REGIONS, publicRegionPages, regionPath } from "@/lib/regions";
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/seo";
import { LLMS_TXT_SUMMARY, buildLlmsTxt, type LlmsSpot } from "@/lib/llms-txt";

vi.mock("@/services/spots", () => ({
  listSpots: vi.fn(),
}));

import { GET, dynamic, revalidate } from "@/app/llms.txt/route";
import { listSpots } from "@/services/spots";

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "ClaudeBot",
];

const PRIVATE_PATHS = [
  "/login",
  "/auth/",
  "/spots/new",
  "/spots/mine",
  "/spots/*/edit",
  "/api/",
];

const LINK_LINE = /^- \[[^\]]+\]\(https:\/\/[^)\s]+\): \S.*$/;

function pageSection(text: string): string {
  const spotsAt = text.indexOf("\n## Spots\n");
  return spotsAt === -1 ? text : text.slice(0, spotsAt);
}

function linkLines(text: string): string[] {
  return text.split("\n").filter((line) => line.startsWith("- "));
}

describe("buildLlmsTxt", () => {
  const text = buildLlmsTxt();

  it("opens with the site name and a Hebrew plus English summary", () => {
    const lines = text.split("\n");

    expect(lines[0]).toBe(`# ${SITE_NAME}`);
    expect(lines[1]).toBe("");
    expect(lines[2]).toBe(`> ${LLMS_TXT_SUMMARY}`);
    expect(lines[2]).toBe(
      "> A Hebrew community map of sunset-viewing spots in Israel.",
    );
    expect(lines[3]).toBe(`> ${SITE_DESCRIPTION}`);
    expect(text.startsWith(`# ${SITE_NAME}\n`)).toBe(true);
    expect(text.indexOf("\n## ")).toBeGreaterThan(text.indexOf(SITE_DESCRIPTION));
  });

  it("links the public pages, all region pages, the Jerusalem guide, and the sitemap", () => {
    const origin = getSiteUrl();
    const pages = pageSection(text);
    const lines = linkLines(pages);

    expect(lines).toHaveLength(2 + publicRegionPages().length + 2);
    expect(SUNSET_REGIONS).toHaveLength(7);
    expect(publicRegionPages()).toHaveLength(SUNSET_REGIONS.length + 1);
    expect(lines.every((line) => LINK_LINE.test(line))).toBe(true);

    expect(pages).toContain(`](${origin}):`);
    expect(pages).toContain(`](${origin}/about):`);
    for (const page of publicRegionPages()) {
      expect(pages).toContain(`](${origin}${page.path}):`);
    }
    expect(pages).toContain(`](${origin}${regionPath("judea-samaria")}):`);
    expect(pages).toContain("העמוד המשותף ליהודה ושומרון חולק לשתי רשימות: יהודה, ושומרון ובנימין.");
    expect(pages).toContain(`](${origin}${JERUSALEM_SUNSET_GUIDE.path}):`);
    expect(pages).toContain(`](${origin}/sitemap.xml):`);
    expect(pages).toContain("המפה הקהילתית של נקודות השקיעה בישראל.");
    expect(pages).toContain("אלה נקודות השקיעה שסומנו בתל אביב–יפו על המפה.");
    expect(pages).toContain("מדריך לתצפיות שקיעה בירושלים שפונות מערבה, עם קישור לעמוד של כל נקודה.");
  });

  it("lists every region URL the sitemap lists", async () => {
    vi.mocked(listSpots).mockRejectedValue(new Error("database unavailable"));
    const entries = await sitemap();
    const urls = new Set(entries.map((entry) => entry.url));
    const origin = getSiteUrl();

    for (const page of publicRegionPages()) {
      const url = `${origin}${page.path}`;
      expect(urls.has(url), page.path).toBe(true);
      expect(pageSection(text)).toContain(`](${url}):`);
    }
  });

  it("does not state a fixed spot count or link private pages", () => {
    expect(text).not.toMatch(/\d/);
    expect(text).not.toContain("/spots/new");
    expect(text).not.toContain("/login");
    expect(text).not.toContain("/api/");
    expect(text).not.toContain("## Spots");
  });

  it("lists published spots with their page URLs and a one-line note", () => {
    const spots: LlmsSpot[] = [
      {
        id: "spot-coast",
        name: "חוף הילטון",
        description: "תצפית פתוחה לים.\nשורה שנייה",
        region: "תל אביב",
      },
      {
        id: "spot-hill",
        name: "הר] הצופים",
        description: "",
        region: "ירושלים",
      },
    ];

    const body = buildLlmsTxt(spots);
    const origin = getSiteUrl();
    const spotLines = linkLines(body.slice(body.indexOf("## Spots")));

    expect(spotLines).toEqual([
      `- [חוף הילטון](${origin}/spots/spot-coast): תל אביב. תצפית פתוחה לים. שורה שנייה`,
      `- [הר הצופים](${origin}/spots/spot-hill): נקודת שקיעה בירושלים.`,
    ]);
    expect(spotLines.every((line) => LINK_LINE.test(line))).toBe(true);
    expect(body).not.toMatch(/\d+\s+נקודות/);
    expect(body).not.toMatch(/\b\d+\s+spots\b/i);
  });

  it("drops an id that could escape the link, and keeps a long note on one line", () => {
    const long = "נוף ".repeat(80);
    const body = buildLlmsTxt([
      {
        id: "../admin",
        name: "לא בטוח",
        description: "לא אמור להופיע",
        region: null,
      },
      {
        id: "spot-long",
        name: "תצפית ארוכה",
        description: long,
        region: null,
      },
    ]);

    expect(body).not.toContain("../admin");
    expect(body).not.toContain("לא בטוח");
    const line = linkLines(body.slice(body.indexOf("## Spots")))[0];
    expect(line).toContain("/spots/spot-long");
    expect(line.endsWith("…")).toBe(true);
    expect(line).not.toContain("\n");
  });
});

describe("GET /llms.txt", () => {
  beforeEach(() => {
    vi.mocked(listSpots).mockReset();
    vi.unstubAllEnvs();
  });

  it("serves text/plain and refreshes on the public page interval", async () => {
    vi.mocked(listSpots).mockResolvedValue([
      {
        id: "spot-1",
        name: "חוף אמת המים",
        description: "קשתות רומיות פוגשות את הים.",
        region: "קיסריה",
        lat: 32.5,
        lng: 34.8,
        photoUrl: null,
        createdById: "user-1",
        createdAt: new Date("2026-10-01T00:00:00.000Z"),
        updatedAt: new Date("2026-10-01T00:00:00.000Z"),
        photos: [],
        _count: { photos: 0 },
      },
    ] as unknown as Awaited<ReturnType<typeof listSpots>>);

    const response = await GET();

    expect(dynamic).toBe("force-static");
    expect(revalidate).toBe(600);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    const body = await response.text();
    expect(body).toContain(`](${getSiteUrl()}/spots/spot-1):`);
    expect(body).toContain("קשתות רומיות פוגשות את הים.");
  });

  it("falls back to the page list when the database is unavailable at build", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", PHASE_PRODUCTION_BUILD);
    vi.mocked(listSpots).mockRejectedValue(new Error("database unavailable"));

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(body).toContain(`](${getSiteUrl()}/about):`);
    expect(body).not.toContain("## Spots");
    expect(body).not.toMatch(/\d/);
  });

  it("does not replace a cached file when the database fails in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "");
    vi.mocked(listSpots).mockRejectedValue(new Error("database unavailable"));

    await expect(GET()).rejects.toThrow("database unavailable");
  });
});

describe("robots.txt", () => {
  it("allows AI crawlers and does not block llms.txt", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

    for (const agent of ["*", ...AI_CRAWLERS]) {
      const rule = rules.find((entry) => {
        const agents = Array.isArray(entry.userAgent)
          ? entry.userAgent
          : [entry.userAgent];
        return agents.includes(agent);
      });
      expect(rule, agent).toBeDefined();
      const allow = [rule?.allow].flat().filter((value) => value !== undefined);
      const disallow = [rule?.disallow].flat().filter((value) => value !== undefined);
      expect(allow).toEqual(expect.arrayContaining(["/", "/llms.txt"]));
      expect(disallow).toEqual(expect.arrayContaining(PRIVATE_PATHS));
      expect(disallow).not.toContain("/llms.txt");
      expect(disallow).not.toContain("/");
    }
  });
});
