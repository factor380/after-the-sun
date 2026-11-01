import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_OG_ALT,
  aboutPageJsonLd,
  absoluteUrl,
  defaultOgImage,
  getSiteUrl,
  guideArticleJsonLd,
  jsonLdString,
  regionPageJsonLd,
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
}) {
  return {
    id: "spot-1",
    name: overrides?.name ?? "חוף אמת המים",
    description: "קשתות רומיות פוגשות את הים.",
    region: "קיסריה",
    lat: 32.5085,
    lng: 34.8925,
    photoUrl: overrides?.photoUrl ?? null,
    photos: overrides?.photos,
  };
}

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
    expect(jsonLdString(data)).not.toContain("localhost");
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
