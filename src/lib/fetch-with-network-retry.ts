import type { MessageKey } from "@/lib/i18n/dictionaries";

/** One retry after a dropped fetch. Long enough for a flaky mobile radio. */
export const NETWORK_RETRY_DELAY_MS = 800;

const RAW_FETCH_FAILURE_MESSAGES = new Set([
  "Failed to fetch",
  "Load failed",
  "Network request failed",
  "NetworkError when attempting to fetch resource.",
]);

/**
 * `fetch` rejected before any HTTP response. Status codes are not this case:
 * a 4xx/5xx still resolves with a Response.
 */
export function isNetworkFetchError(error: unknown): boolean {
  return error instanceof TypeError;
}

export class NetworkFetchError extends Error {
  constructor(cause?: unknown) {
    super("NETWORK_FETCH_FAILED", cause === undefined ? undefined : { cause });
    this.name = "NetworkFetchError";
  }
}

type FetchImpl = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

type FetchRetryOptions = {
  delayMs?: number;
  fetchImpl?: FetchImpl;
  sleep?: (ms: number) => Promise<void>;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Call fetch, and if it rejects with a network TypeError, wait and try once
 * more. A resolved response is never retried — including 4xx/5xx — so a
 * create that the server already answered is not sent again.
 *
 * `init` is reused for the second attempt. Pass a string or FormData body,
 * not a one-shot stream.
 *
 * If the server committed the first POST and the response was lost, the
 * retry can still create a duplicate. That is indistinguishable from a
 * failure before the request was sent.
 */
export async function fetchWithNetworkRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: FetchRetryOptions,
): Promise<Response> {
  const doFetch = options?.fetchImpl ?? fetch;
  const sleep = options?.sleep ?? delay;
  const delayMs = options?.delayMs ?? NETWORK_RETRY_DELAY_MS;

  try {
    return await doFetch(input, init);
  } catch (error) {
    if (!isNetworkFetchError(error)) throw error;
    await sleep(delayMs);
    try {
      return await doFetch(input, init);
    } catch (retryError) {
      if (!isNetworkFetchError(retryError)) throw retryError;
      throw new NetworkFetchError(retryError);
    }
  }
}

/** Parse a response body. HTML or other non-JSON (413/504 pages) becomes null. */
export async function readResponseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function isWrappedNetworkFailure(error: unknown): boolean {
  return (
    error instanceof NetworkFetchError ||
    (error instanceof Error && error.name === "NetworkFetchError")
  );
}

function hasRawFetchFailureMessage(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return RAW_FETCH_FAILURE_MESSAGES.has(error.message.trim());
}

/**
 * Text for a failed spot submit. Network failures use `networkInterrupted`.
 * A JSON parse error uses `fallback` (upload vs save) instead of the raw
 * SyntaxError. Messages already translated by the form are preserved.
 */
export function submitErrorText(
  error: unknown,
  translate: (key: MessageKey) => string,
  fallback: MessageKey,
): string {
  if (isWrappedNetworkFailure(error) || hasRawFetchFailureMessage(error)) {
    return translate("networkInterrupted");
  }
  if (error instanceof SyntaxError) return translate(fallback);
  if (error instanceof Error && error.message.trim()) return error.message;
  return translate(fallback);
}
