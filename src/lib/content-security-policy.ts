/**
 * Google Identity Services sources.
 * Kept free of `@/` imports so `next.config.ts` can load this file.
 * https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid#content_security_policy
 */
export const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
export const GOOGLE_IDENTITY_GSI_PREFIX = "https://accounts.google.com/gsi/";
export const GOOGLE_IDENTITY_STYLE_SRC = "https://accounts.google.com/gsi/style";

/** Static CSP. Next.js sets `self.__next_r` inline, so scripts allow unsafe-inline. */
export function contentSecurityPolicy(isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${GOOGLE_IDENTITY_SCRIPT_SRC}${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline' ${GOOGLE_IDENTITY_STYLE_SRC}`,
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.tile.openstreetmap.org ${GOOGLE_IDENTITY_GSI_PREFIX}${isDev ? " ws: wss:" : ""}`,
    `frame-src 'self' ${GOOGLE_IDENTITY_GSI_PREFIX}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
