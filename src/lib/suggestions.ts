/** Hidden field. A non-empty value means the submit is treated as spam. */
export function isSuggestionHoneypot(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const website = (body as { website?: unknown }).website;
  return typeof website === "string" && website.trim().length > 0;
}
