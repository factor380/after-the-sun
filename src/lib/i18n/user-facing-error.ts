import type { MessageKey } from "@/lib/i18n/dictionaries";

const SERVER_ERROR_KEYS: Record<string, MessageKey> = {
  DUPLICATE: "photoAddDuplicate",
  SPOT_LIMIT: "photoAddSpotLimit",
  USER_LIMIT: "photoAddUserLimit",
  "Location must be within Israel bounds": "locationOutsideIsrael",
};

export function messageKeyForRequestFailure(
  status: number,
  serverError: unknown,
  fallback: MessageKey,
): MessageKey {
  if (typeof serverError === "string" && serverError in SERVER_ERROR_KEYS) {
    return SERVER_ERROR_KEYS[serverError];
  }
  if (status === 401) return "needSignIn";
  if (status === 403) return "notAllowed";
  if (status === 429) return "tooManyRequests";
  return fallback;
}
