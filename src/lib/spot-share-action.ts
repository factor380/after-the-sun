import type { SpotSharePayload } from "@/lib/spot-share";

export type ShareTarget = {
  share?: (data: SpotSharePayload) => Promise<void>;
  canShare?: (data: SpotSharePayload) => boolean;
  clipboard?: { writeText: (value: string) => Promise<void> };
};

export type ShareResult = "shared" | "copied" | "cancelled";

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

/** True when this browser can open the native share sheet for the payload. */
export function webShareAvailable(target: ShareTarget, payload: SpotSharePayload): boolean {
  if (typeof target.share !== "function") return false;
  if (typeof target.canShare !== "function") return true;
  try {
    return target.canShare(payload);
  } catch {
    return false;
  }
}

/**
 * Opens the share sheet when the browser has one.
 * A cancelled sheet (`AbortError`) is ignored.
 * Otherwise copies the canonical URL.
 */
export async function shareOrCopySpot(
  payload: SpotSharePayload,
  target: ShareTarget,
): Promise<ShareResult> {
  if (webShareAvailable(target, payload) && target.share) {
    try {
      await target.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      });
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "cancelled";
      throw error;
    }
  }

  const writeText = target.clipboard?.writeText;
  if (typeof writeText !== "function") {
    throw new Error("Clipboard is unavailable");
  }
  await writeText(payload.url);
  return "copied";
}

/** Rebuilds a wa.me link so the href can only be https://wa.me/?text=… */
export function safeWhatsAppHref(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== "wa.me") return null;
  if (url.username || url.password || url.port) return null;
  if (url.pathname !== "/") return null;
  const text = url.searchParams.get("text");
  if (!text) return null;
  const safe = new URL("https://wa.me/");
  safe.searchParams.set("text", text);
  return safe.toString();
}
