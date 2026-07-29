/**
 * Allow only same-origin relative paths for post-auth redirects.
 * Rejects protocol-relative URLs, schemes, backslashes, and "@host" tricks.
 */
export function safeRedirectPath(next: string | null | undefined): string {
  if (!next) return "/";

  let path = next;
  try {
    path = decodeURIComponent(next);
  } catch {
    return "/";
  }

  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/\\") ||
    path.includes("://") ||
    path.includes("\\") ||
    path.includes("@")
  ) {
    return "/";
  }

  // Path + optional query/hash with safe characters only
  if (!/^\/[\w\-./]*(\?[\w\-./=&%]*)?(#[\w\-./]*)?$/.test(path)) {
    return "/";
  }

  return path;
}
