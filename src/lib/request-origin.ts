/**
 * Defense-in-depth CSRF check for cookie-authenticated mutating requests.
 * Allows same-origin Origin or Referer; rejects clear cross-site Origins.
 */
export function isSameOriginRequest(request: Request): boolean {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");

  if (origin) {
    try {
      return new URL(origin).origin === requestUrl.origin;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === requestUrl.origin;
    } catch {
      return false;
    }
  }

  // Non-browser clients (no Origin/Referer) — allow; SameSite cookies still apply
  return true;
}
