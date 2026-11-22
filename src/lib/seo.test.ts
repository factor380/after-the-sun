import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMetadata as adminEditMetadata } from "@/app/admin/spots/[id]/page";
import { metadata as adminSpotsMetadata } from "@/app/admin/spots/page";
import { metadata as adminSuggestionsMetadata } from "@/app/admin/suggestions/page";
import { metadata as loginMetadata } from "@/app/login/page";
import { generateMetadata as editSpotMetadata } from "@/app/spots/[slug]/edit/page";
import { metadata as mineMetadata } from "@/app/spots/mine/page";
import { metadata as newSpotMetadata } from "@/app/spots/new/page";
import { dictionary } from "@/lib/i18n/dictionaries";
import {
  ABOUT_PAGE_TITLE,
  DEFAULT_OG_ALT,
  HOME_TITLE,
  SITE_NAME,
  SITE_TAGLINE,
  aboutPageJsonLd,
  absoluteUrl,
  defaultOgImage,
  getSiteUrl,
  guideArticleJsonLd,
  jsonLdString,
  pageSocialMetadata,
  regionPageJsonLd,
  regionsIndexJsonLd,
  spotCoverImage,
  spotJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { DEFAULT_SITE_URL } from "@/lib/site-url";

const PHOTO = "https://cdn.example.com/sunset.jpg";
const SECOND = "https://cdn.example.com/dunes.jpg";

function place(overrides?: {
  photoUrl?: string | null;
  photos?: { url: string }[];
  name?: string;
  parking?: string | null;
  parkingNote?: string | null;
  accessibility?: string | null;
  accessibilityNote?: string | null;
}) {
  return {
    id: "spot-1",
    slug: "spot-1",
    name: overrides?.name ?? "חוף אמת המים",
    description: "קשתות רומיות פוגשות את הים.",
    region: "קיסריה",
    lat: 32.5085,
    lng: 34.8925,
    photoUrl: overrides?.photoUrl ?? null,
    photos: overrides?.photos,
    parking: overrides?.parking,
    parkingNote: overrides?.parkingNote,
    accessibility: overrides?.accessibility,
    accessibilityNote: overrides?.accessibilityNote,
  };
}

describe("search result titles", () => {
  it("leads the home title with the Hebrew phrase and keeps the brand under 60 characters", () => {
    expect(HOME_TITLE).toBe("נקודות שקיעה בישראל | After the Sun");
    expect(HOME_TITLE).toBe(`${SITE_TAGLINE} | ${SITE_NAME}`);
    expect(HOME_TITLE.startsWith(SITE_TAGLINE)).toBe(true);
    expect(HOME_TITLE.endsWith(SITE_NAME)).toBe(true);
    expect(HOME_TITLE.length).toBeLessThanOrEqual(60);
  });

  it("keeps the about title stable, Hebrew-first, and free of a live spot count", () => {
    const branded = `${ABOUT_PAGE_TITLE} | ${SITE_NAME}`;

    expect(ABOUT_PAGE_TITLE).toBe("אודות – מפה קהילתית של נקודות שקיעה בישראל");
    expect(ABOUT_PAGE_TITLE.startsWith("אודות")).toBe(true);
    expect(branded.length).toBeLessThanOrEqual(60);
    expect(branded).not.toMatch(/\d/);
    expect(branded).not.toContain("מ-");
    expect(branded).not.toContain("ל-75");
  });

  it("keeps the WebSite name as the brand and the Hebrew phrase as alternateName", () => {
    const website = websiteJsonLd() as { name: string; alternateName: string };

    expect(website.name).toBe(SITE_NAME);
    expect(website.alternateName).toBe(SITE_TAGLINE);
    expect(website.name).not.toBe(HOME_TITLE);
  });
});

describe("pageSocialMetadata", () => {
  it("gives the add-spot page its own title, description, and canonical url", () => {
    const share = pageSocialMetadata({
      title: dictionary.shareSpotTitle,
      description: dictionary.shareSpotSubtitle,
      path: "/spots/new",
    });
    const brandedTitle = `${dictionary.shareSpotTitle} | ${SITE_NAME}`;
    const image = defaultOgImage();

    expect(dictionary.shareSpotTitle).toBe("שיתוף נקודת שקיעה");
    expect(brandedTitle).toBe("שיתוף נקודת שקיעה | After the Sun");
    expect(brandedTitle).not.toBe(HOME_TITLE);
    expect(share.openGraph).toMatchObject({
      title: brandedTitle,
      description: dictionary.shareSpotSubtitle,
      url: "https://after-the-sun.com/spots/new",
      siteName: SITE_NAME,
      locale: "he_IL",
      type: "website",
      images: [image],
    });
    expect(share.twitter).toEqual({
      card: "summary_large_image",
      title: brandedTitle,
      description: dictionary.shareSpotSubtitle,
      images: [image],
    });
    expect(JSON.stringify(share)).not.toContain("localhost");
    expect(share.openGraph?.url).toBe(absoluteUrl("/spots/new"));
  });

  it("keeps a dynamic edit path on that spot and still uses the default card", () => {
    const share = pageSocialMetadata({
      title: dictionary.editSpotTitle,
      description: dictionary.editSpotSubtitle,
      path: "/spots/spot-1/edit",
    });

    expect(share.openGraph?.title).toBe("עריכת נקודה | After the Sun");
    expect(share.openGraph?.url).toBe("https://after-the-sun.com/spots/spot-1/edit");
    expect(share.twitter?.title).toBe("עריכת נקודה | After the Sun");
    expect(share.openGraph?.images).toEqual([defaultOgImage()]);
  });

  it("is what the private pages export, and those pages stay noindex", async () => {
    const image = defaultOgImage();
    const cases: {
      path: string;
      title: string;
      description: string;
      metadata: { robots?: unknown; openGraph?: unknown; twitter?: unknown };
    }[] = [
      {
        path: "/spots/new",
        title: dictionary.shareSpotTitle,
        description: dictionary.shareSpotSubtitle,
        metadata: newSpotMetadata,
      },
      {
        path: "/spots/mine",
        title: dictionary.mySpotsTitle,
        description: dictionary.mySpotsSubtitle,
        metadata: mineMetadata,
      },
      {
        path: "/login",
        title: dictionary.signInTitle,
        description: dictionary.signInSubtitle,
        metadata: loginMetadata,
      },
      {
        path: "/admin/spots",
        title: dictionary.adminSpotsTitle,
        description: dictionary.adminSpotsDescription,
        metadata: adminSpotsMetadata,
      },
      {
        path: "/admin/suggestions",
        title: dictionary.adminSuggestionsTitle,
        description: dictionary.adminSuggestionsDescription,
        metadata: adminSuggestionsMetadata,
      },
      {
        path: "/spots/spot-1/edit",
        title: dictionary.editSpotTitle,
        description: dictionary.editSpotSubtitle,
        metadata: await editSpotMetadata({ params: Promise.resolve({ slug: "spot-1" }) }),
      },
      {
        path: "/admin/spots/spot-1",
        title: dictionary.adminEditSpotTitle,
        description: dictionary.adminEditSpotSubtitle,
        metadata: await adminEditMetadata({
          params: Promise.resolve({ id: "spot-1" }),
        }),
      },
    ];

    for (const page of cases) {
      const share = pageSocialMetadata({
        title: page.title,
        description: page.description,
        path: page.path,
      });
      expect(page.metadata.robots, page.path).toMatchObject({
        index: false,
        follow: false,
      });
      expect(page.metadata.openGraph, page.path).toEqual(share.openGraph);
      expect(page.metadata.twitter, page.path).toEqual(share.twitter);
      expect(page.metadata.openGraph, page.path).toMatchObject({
        title: `${page.title} | ${SITE_NAME}`,
        url: absoluteUrl(page.path),
        images: [image],
      });
      expect(JSON.stringify(page.metadata.openGraph), page.path).not.toContain(HOME_TITLE);
    }
  });
});

describe("defaultOgImage", () => {
  it("points at the home page card with absolute https size and alt", () => {
    const image = defaultOgImage();

    expect(image.url).toBe(`${getSiteUrl()}/opengraph-image`);
    expect(image.url).toBe(absoluteUrl("/opengraph-image"));
    expect(image.url.startsWith("https://")).toBe(true);
    expect(image.url).not.toContain("localhost");
    expect(image.width).toBe(1200);
    expect(image.height).toBe(630);
    expect(image.alt).toBe(DEFAULT_OG_ALT);
    expect(image.alt).toBe("After the Sun - sunset spots in Israel");
    expect(image.type).toBe("image/png");
  });
});

describe("spotCoverImage", () => {
  it("uses an https cover photo and keeps the spot name as alt", () => {
    const image = spotCoverImage(place({ photoUrl: `  ${PHOTO}  ` }));

    expect(image).toEqual({ url: PHOTO, alt: "חוף אמת המים" });
  });

  it("uses the first community photo when the cover is missing", () => {
    const image = spotCoverImage(
      place({ photoUrl: null, photos: [{ url: SECOND }] }),
    );

    expect(image.url).toBe(SECOND);
    expect(image.alt).toBe("חוף אמת המים");
  });

  it("falls back to the site default when there is no public photo", () => {
    const fallback = defaultOgImage();

    expect(spotCoverImage(place())).toEqual(fallback);
    expect(spotCoverImage(place({ photoUrl: "" }))).toEqual(fallback);
    expect(spotCoverImage(place({ photoUrl: "http://cdn.example.com/a.jpg" }))).toEqual(
      fallback,
    );
    expect(spotCoverImage(place({ photoUrl: "javascript:alert(1)" }))).toEqual(fallback);
    expect(
      spotCoverImage(place({ photoUrl: "https://user:pass@cdn.example.com/a.jpg" })),
    ).toEqual(fallback);
    expect(spotCoverImage(place({ photoUrl: "https://localhost/a.jpg" }))).toEqual(
      fallback,
    );
    expect(spotCoverImage(place({ photoUrl: "https://127.0.0.1/a.jpg" }))).toEqual(
      fallback,
    );
  });

  it("skips an unsafe cover and uses the next https photo", () => {
    const image = spotCoverImage(
      place({
        photoUrl: "http://cdn.example.com/a.jpg",
        photos: [{ url: SECOND }],
      }),
    );

    expect(image.url).toBe(SECOND);
  });
});

describe("spotJsonLd images", () => {
  it("uses the default card when the spot has no photo", () => {
    const data = spotJsonLd(place()) as {
      "@graph": { "@type": string; image?: string[] }[];
    };
    const attraction = data["@graph"][0];

    expect(attraction["@type"]).toBe("TouristAttraction");
    expect(attraction.image).toEqual([defaultOgImage().url]);
    expect(attraction).not.toHaveProperty("amenityFeature");
    expect(jsonLdString(data)).not.toContain("localhost");
  });

  it("adds parking and wheelchair features without changing isAccessibleForFree", () => {
    const data = spotJsonLd(
      place({
        parking: "paid",
        parkingNote: "חניון <script>",
        accessibility: "yes",
      }),
    ) as {
      "@graph": {
        isAccessibleForFree?: boolean;
        amenityFeature?: { name: string; value: boolean | string; description?: string }[];
      }[];
    };
    const attraction = data["@graph"][0];

    expect(attraction?.isAccessibleForFree).toBe(true);
    expect(attraction?.amenityFeature).toEqual([
      {
        "@type": "LocationFeatureSpecification",
        name: "Parking",
        value: "Paid",
        description: "חניון <script>",
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "Wheelchair accessible",
        value: true,
      },
    ]);

    const serialized = jsonLdString(data);
    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c");
    expect(serialized).toContain('"isAccessibleForFree":true');
  });

  it("keeps https photos and drops unsafe or duplicate urls", () => {
    const photos = Array.from({ length: 8 }, (_, index) => ({
      url: `https://cdn.example.com/${index}.jpg`,
    }));
    const data = spotJsonLd(
      place({
        photoUrl: PHOTO,
        photos: [{ url: PHOTO }, { url: "http://cdn.example.com/nope.jpg" }, ...photos],
      }),
    ) as { "@graph": { image?: string[] }[] };

    expect(data["@graph"][0]?.image).toEqual([
      PHOTO,
      ...photos.slice(0, 7).map((photo) => photo.url),
    ]);
  });
});

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to the production domain and ignores other host env vars", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "after-the-sun.vercel.app");
    vi.stubEnv("VERCEL_URL", "after-the-sun-git-preview-factor380.vercel.app");

    expect(DEFAULT_SITE_URL).toBe("https://after-the-sun.com");
    expect(getSiteUrl()).toBe("https://after-the-sun.com");
    expect(absoluteUrl("/")).toBe("https://after-the-sun.com");
    expect(absoluteUrl("/about")).toBe("https://after-the-sun.com/about");
    expect(absoluteUrl("spots/spot-1")).toBe("https://after-the-sun.com/spots/spot-1");
  });

  it("reads NEXT_PUBLIC_SITE_URL and strips a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.example.com/");

    expect(getSiteUrl()).toBe("https://staging.example.com");
    expect(absoluteUrl("/regions/tel-aviv")).toBe(
      "https://staging.example.com/regions/tel-aviv",
    );
  });

  it("adds https when the env var is a bare host", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "after-the-sun.com");

    expect(getSiteUrl()).toBe("https://after-the-sun.com");
  });

  it("ignores localhost so canonicals stay on the production domain", () => {
    for (const value of [
      "http://localhost:3004",
      "http://127.0.0.1:3004",
      "localhost:3004",
    ]) {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", value);
      expect(getSiteUrl(), value).toBe("https://after-the-sun.com");
    }
  });

  it("uses the production origin in WebSite, Organization, Article, and Place JSON-LD", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "after-the-sun.vercel.app");

    const website = websiteJsonLd() as { "@type": string; url: string };
    expect(website["@type"]).toBe("WebSite");
    expect(website.url).toBe("https://after-the-sun.com");

    const about = jsonLdString(
      aboutPageJsonLd({ title: "אודות", description: "על המיזם." }),
    );
    expect(about).toContain("https://after-the-sun.com/about");
    expect(about).not.toContain("vercel.app");
    expect(about).not.toContain("localhost");

    const spot = jsonLdString(spotJsonLd(place()));
    expect(spot).toContain("https://after-the-sun.com/spots/spot-1");
    expect(spot).not.toContain("vercel.app");

    const region = jsonLdString(
      regionPageJsonLd({
        title: "תל אביב",
        description: "נקודות שקיעה.",
        path: "/regions/tel-aviv",
        spots: [],
      }),
    );
    expect(region).toContain("https://after-the-sun.com/regions/tel-aviv");
    expect(region).not.toContain("vercel.app");

    const regionsIndex = jsonLdString(
      regionsIndexJsonLd({
        title: "איפה רואים שקיעה בישראל לפי אזור",
        description: "שקיעה בישראל לפי אזור.",
        regions: [{ name: "תל אביב <script>", path: "/regions/tel-aviv" }],
      }),
    );
    expect(regionsIndex).toContain('"@type":"CollectionPage"');
    expect(regionsIndex).toContain('"@type":"ItemList"');
    expect(regionsIndex).toContain("https://after-the-sun.com/regions");
    expect(regionsIndex).toContain("\\u003c");
    expect(regionsIndex).not.toContain("<");
    expect(regionsIndex).not.toContain("vercel.app");
    expect(regionsIndex).not.toContain("localhost");

    const article = jsonLdString(
      guideArticleJsonLd({
        title: "מדריך",
        description: "תיאור",
        path: "/guides/jerusalem-sunset",
        datePublished: "2026-10-01",
        dateModified: "2026-10-02",
        regionName: "ירושלים",
        regionPath: "/regions/jerusalem",
        places: [{ name: "גן", path: "/spots/spot-1" }],
        faqs: [{ question: "שאלה", answer: "תשובה" }],
      }),
    );
    expect(article).toContain('"@type":"Article"');
    expect(article).toContain('"@type":"Organization"');
    expect(article).toContain('"@type":"Place"');
    expect(article).toContain("https://after-the-sun.com/guides/jerusalem-sunset");
    expect(article).toContain("https://after-the-sun.com/spots/spot-1");
    expect(article).not.toContain("vercel.app");
    expect(article).not.toContain("localhost");
  });
});
