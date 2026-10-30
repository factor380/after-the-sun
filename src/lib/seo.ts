import type { Metadata } from "next";
import type { SpotSummary } from "@/types/spot";

export const SITE_NAME = "After the Sun";
export const SITE_TAGLINE = "נקודות שקיעה בישראל";
export const SITE_DESCRIPTION =
  "מפה קהילתית של נקודות שקיעה בישראל. גלו תצפיות, חופים ומקומות מומלצים לראות בהם שקיעה, ושתפו את הנקודה שלכם.";

/** Generated card at `src/app/opengraph-image.tsx`, served as `/opengraph-image`. */
export const DEFAULT_OG_PATH = "/opengraph-image";
export const DEFAULT_OG_SIZE = { width: 1200, height: 630 } as const;
export const DEFAULT_OG_ALT = `${SITE_NAME} - sunset spots in Israel`;
export const DEFAULT_OG_TYPE = "image/png";

export type ShareImage = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  type?: string;
};

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

/** Absolute URL of the home page Open Graph card. */
export function defaultOgImage(): ShareImage {
  return {
    url: absoluteUrl(DEFAULT_OG_PATH),
    alt: DEFAULT_OG_ALT,
    width: DEFAULT_OG_SIZE.width,
    height: DEFAULT_OG_SIZE.height,
    type: DEFAULT_OG_TYPE,
  };
}

function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

/** Public https URL safe to put in meta tags and JSON-LD. */
function publicHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.toLowerCase().startsWith("https://")) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (!url.hostname || isLocalHostname(url.hostname)) return null;
    return trimmed;
  } catch {
    return null;
  }
}

/** Cover photo, then community photos, https only, de-duplicated, capped at 8. */
function spotHttpsImageUrls(spot: {
  photoUrl: string | null;
  photos?: { url: string }[];
}): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  const candidates = [
    spot.photoUrl,
    ...(spot.photos ?? []).map((photo) => photo.url),
  ];

  for (const candidate of candidates) {
    const url = publicHttpsUrl(candidate);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
    if (urls.length === 8) break;
  }

  return urls;
}

/**
 * Image used for og:image and twitter:image.
 * A real photo wins; otherwise the site default card.
 */
export function spotCoverImage(spot: {
  name: string;
  photoUrl: string | null;
  photos?: { url: string }[];
}): ShareImage {
  const [cover] = spotHttpsImageUrls(spot);
  if (cover) return { url: cover, alt: spot.name };
  return defaultOgImage();
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

export function regionPageJsonLd(input: {
  title: string;
  description: string;
  path: string;
  /** Null when the spot query failed, so the page does not claim an empty list. */
  spots: SpotSummary[] | null;
}) {
  const url = absoluteUrl(input.path);
  const graph: Record<string, unknown>[] = [];

  if (input.spots !== null) {
    graph.push({
      "@type": "ItemList",
      "@id": `${url}#spots`,
      name: input.title,
      description: input.description,
      url,
      inLanguage: "he-IL",
      numberOfItems: input.spots.length,
      itemListElement: input.spots.map((spot, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/spots/${spot.id}`),
        name: spot.name,
      })),
    });
  }

  graph.push({
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
  });

  return {
    "@context": "https://schema.org",
    "@graph": graph,
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

export function guideArticleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified: string;
  regionName: string;
  regionPath: string;
  places: readonly { name: string; path: string; image?: string | null }[];
  faqs: readonly { question: string; answer: string }[];
}) {
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: input.title,
        description: input.description,
        inLanguage: "he-IL",
        datePublished: input.datePublished,
        dateModified: input.dateModified,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        url,
        author: {
          "@type": "Organization",
          name: SITE_NAME,
          url: getSiteUrl(),
        },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: getSiteUrl(),
        },
        isPartOf: {
          "@type": "WebSite",
          name: SITE_NAME,
          url: getSiteUrl(),
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        url,
        inLanguage: "he-IL",
        mainEntity: input.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
      {
        "@type": "ItemList",
        "@id": `${url}#places`,
        name: input.title,
        numberOfItems: input.places.length,
        itemListElement: input.places.map((place, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(place.path),
          item: {
            "@type": "Place",
            name: place.name,
            url: absoluteUrl(place.path),
            ...(place.image ? { image: place.image } : {}),
          },
        })),
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
            name: input.regionName,
            item: absoluteUrl(input.regionPath),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: input.title,
            item: url,
          },
        ],
      },
    ],
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
  const photos = spotHttpsImageUrls(spot);
  const image = photos.length > 0 ? photos : [defaultOgImage().url];

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
        image,
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
