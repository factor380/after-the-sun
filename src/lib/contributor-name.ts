const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

/** Public credit line. Empty, oversized, and control-character names are dropped. */
export function cleanContributorName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.slice(0, 80);
}
