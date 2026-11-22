import { dictionary } from "@/lib/i18n/dictionaries";
import { SITE_NAME } from "@/lib/seo";
import { isSpotSlug, spotPublicPath } from "@/lib/spot-slug";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

export type SpotSharePayload = {
  /** Spot name. Passed to `navigator.share` as `title`. */
  title: string;
  /** Short Hebrew line, for example "נקודת שקיעה: נמל יפו | After the Sun". */
  text: string;
  /** Canonical spot URL. No query string. */
  url: string;
};

function cleanShareName(name: string): string {
  return name
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function isCanonicalSpotUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.origin !== getSiteUrl()) return false;
  if (url.username || url.password || url.search || url.hash) return false;
  const slug = url.pathname.slice("/spots/".length);
  return url.pathname.startsWith("/spots/") && isSpotSlug(slug);
}

/**
 * Title, Hebrew text, and canonical URL for one spot.
 * Returns null when the slug is not a public path segment or the name is empty.
 */
export function buildSpotShare(input: { slug: string; name: string }): SpotSharePayload | null {
  const slug = input.slug.trim();
  if (!isSpotSlug(slug)) return null;
  const title = cleanShareName(input.name);
  if (!title) return null;

  const url = absoluteUrl(spotPublicPath(slug));
  if (!isCanonicalSpotUrl(url)) return null;

  // A template inserts the name as text, so `$&` in a name stays literal.
  const text = `${dictionary.shareSpotLead}: ${title} | ${SITE_NAME}`;

  return { title, text, url };
}

/** `https://wa.me/?text=` with the Hebrew line and the canonical URL. */
export function whatsAppShareHref(payload: SpotSharePayload): string {
  if (!isCanonicalSpotUrl(payload.url)) {
    throw new Error("Share URL is not a canonical spot URL");
  }
  const href = new URL("https://wa.me/");
  href.searchParams.set("text", `${payload.text}\n${payload.url}`);
  return href.toString();
}
