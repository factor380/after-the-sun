import type { Metadata } from "next";
import type { SpotSummary } from "@/types/spot";

export const SITE_NAME = "After the Sun";
export const SITE_TAGLINE = "נקודות שקיעה בישראל";
export const SITE_DESCRIPTION =
  "מפה קהילתית של נקודות שקיעה בישראל. גלו תצפיות, חופים ומקומות מומלצים לראות בהם שקיעה, ושתפו את הנקודה שלכם.";

const FALLBACK_SITE_URL = "https://after-the-sun.vercel.app";

function isLocalhost(url: string): boolean {
  try {
    const { hostname } = new URL(url.includes("://") ? url : `https://${url}`);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Public origin for canonical URLs, sitemap, and Open Graph. Never localhost. */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit && !isLocalhost(explicit)) {
    return explicit.includes("://") ? explicit : `https://${explicit}`;
  }
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(/\/$/, "");
  if (vercelProd && !isLocalhost(vercelProd)) {
    return vercelProd.includes("://") ? vercelProd : `https://${vercelProd}`;
  }
  return FALLBACK_SITE_URL;
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function truncateMeta(text: string, max = 160): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  return `${collapsed.slice(0, max - 1).trimEnd()}…`;
}

export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export const noIndexRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};

export const indexRobots: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

export function spotPageTitle(name: string, region: string | null): string {
  return region ? `${name} — שקיעה ב${region}` : name;
}

export function spotPageDescription(
  description: string,
  region: string | null,
): string {
  const base = description.replace(/\s+/g, " ").trim();
  const place = region
    ? `נקודת שקיעה ב${region}, ישראל`
    : "נקודת שקיעה בישראל";
  if (!base) return truncateMeta(`${place}.`);
  if (base.length >= 110) return truncateMeta(base);
  const ended = /[.!?…]$/.test(base) ? base : `${base}.`;
  return truncateMeta(`${ended} ${place}.`);
}

export function aboutPageJsonLd(input: { title: string; description: string }) {
  const url = absoluteUrl("/about");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        name: input.title,
        description: input.description,
        url,
        inLanguage: "he-IL",
        isPartOf: {
          "@type": "WebSite",
          name: SITE_NAME,
          url: getSiteUrl(),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE_NAME,
            item: getSiteUrl(),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: input.title,
            item: url,
          },
        ],
      },
    ],
  };
}

export function websiteJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: SITE_TAGLINE,
    url,
    description: SITE_DESCRIPTION,
    inLanguage: "he-IL",
  };
}

export function spotsItemListJsonLd(spots: SpotSummary[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: SITE_TAGLINE,
    numberOfItems: spots.length,
    itemListElement: spots.map((spot, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/spots/${spot.id}`),
      name: spot.name,
    })),
  };
}

export function spotJsonLd(spot: {
  id: string;
  name: string;
  description: string;
  region: string | null;
  lat: number;
  lng: number;
  photoUrl: string | null;
  photos?: { url: string }[];
}) {
  const url = absoluteUrl(`/spots/${spot.id}`);
  const images = [
    ...(spot.photoUrl ? [spot.photoUrl] : []),
    ...(spot.photos ?? []).map((photo) => photo.url),
  ].slice(0, 8);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristAttraction",
        "@id": `${url}#place`,
        name: spot.name,
        description: spot.description,
        url,
        inLanguage: "he-IL",
        isAccessibleForFree: true,
        touristType: "Sunset viewing",
        ...(images.length > 0 ? { image: images } : {}),
        geo: {
          "@type": "GeoCoordinates",
          latitude: spot.lat,
          longitude: spot.lng,
        },
        address: {
          "@type": "PostalAddress",
          addressCountry: "IL",
          ...(spot.region ? { addressRegion: spot.region } : {}),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE_NAME,
            item: getSiteUrl(),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: spot.name,
            item: url,
          },
        ],
      },
    ],
  };
}
