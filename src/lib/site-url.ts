/**
 * Public origin for canonical URLs, Open Graph, sitemap, robots, llms.txt,
 * and JSON-LD. One env var: `NEXT_PUBLIC_SITE_URL`. Localhost is ignored so a
 * local `.env` cannot publish localhost into Google. When the var is unset,
 * the origin is the production domain.
 */
export const DEFAULT_SITE_URL = "https://after-the-sun.com";

/** Production Vercel hostname. Preview hosts (`*-factor380*.vercel.app`) are not this. */
export const LEGACY_PRODUCTION_HOST = "after-the-sun.vercel.app";

/**
 * `has.value` is compiled as `^value$`. Escape dots so only this exact host matches.
 */
export const LEGACY_PRODUCTION_HOST_VALUE = "after-the-sun\\.vercel\\.app";

function isLocalhost(url: string): boolean {
  try {
    const { hostname } = new URL(url.includes("://") ? url : `https://${url}`);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Public origin. Never localhost. */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit && !isLocalhost(explicit)) {
    return explicit.includes("://") ? explicit : `https://${explicit}`;
  }
  return DEFAULT_SITE_URL;
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Permanent redirects from the old production host to the primary domain.
 * `/` is its own rule because `/:path*` compiles to an empty path on the
 * homepage, which drops the slash in front of the query string.
 * Next.js forwards the query string. The host condition does not match
 * preview deployments or localhost.
 */
export function legacyProductionRedirects() {
  const has = [
    {
      type: "host" as const,
      value: LEGACY_PRODUCTION_HOST_VALUE,
    },
  ];
  return [
    {
      source: "/",
      has,
      destination: `${DEFAULT_SITE_URL}/`,
      permanent: true as const,
    },
    {
      source: "/:path*",
      has,
      destination: `${DEFAULT_SITE_URL}/:path*`,
      permanent: true as const,
    },
  ];
}
