import { describe, expect, it } from "vitest";
import {
  DEFAULT_OG_ALT,
  absoluteUrl,
  defaultOgImage,
  getSiteUrl,
  jsonLdString,
  spotCoverImage,
  spotJsonLd,
} from "@/lib/seo";

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
