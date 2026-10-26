import { describe, expect, it, vi } from "vitest";
import { dictionary } from "@/lib/i18n/dictionaries";
import {
  NETWORK_RETRY_DELAY_MS,
  NetworkFetchError,
  fetchWithNetworkRetry,
  isNetworkFetchError,
  readResponseJson,
  submitErrorText,
} from "@/lib/fetch-with-network-retry";

const t = (key: keyof typeof dictionary) => dictionary[key];

describe("fetchWithNetworkRetry", () => {
  it("retries a network TypeError once, then returns the second response", async () => {
    const events: string[] = [];
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      events.push(`fetch:${init?.method ?? "GET"}`);
      if (events.length === 1) {
        throw new TypeError("Failed to fetch");
      }
      return new Response(JSON.stringify({ id: "spot-1" }), { status: 201 });
    });
    const sleep = vi.fn(async (ms: number) => {
      events.push(`sleep:${ms}`);
    });

    const res = await fetchWithNetworkRetry(
      "/api/spots",
      { method: "POST", body: "{}" },
      { fetchImpl, sleep },
    );

    expect(res.status).toBe(201);
    expect(events).toEqual(["fetch:POST", `sleep:${NETWORK_RETRY_DELAY_MS}`, "fetch:POST"]);
    expect(NETWORK_RETRY_DELAY_MS).toBe(800);
    expect(fetchImpl).toHaveBeenNthCalledWith(1, "/api/spots", {
      method: "POST",
      body: "{}",
    });
    expect(fetchImpl).toHaveBeenNthCalledWith(2, "/api/spots", {
      method: "POST",
      body: "{}",
    });
  });

  it("does not retry an HTTP error response", async () => {
    const fetchImpl = vi.fn(async () => new Response("<html>413</html>", { status: 413 }));
    const sleep = vi.fn();

    const res = await fetchWithNetworkRetry(
      "/api/spots",
      { method: "POST", body: "{}" },
      { fetchImpl, sleep },
    );

    expect(res.status).toBe(413);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(await readResponseJson(res)).toBeNull();
  });

  it("does not retry a non-network rejection", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new DOMException("The user aborted a request.", "AbortError");
    });
    const sleep = vi.fn();

    await expect(
      fetchWithNetworkRetry("/api/spots", { method: "POST" }, { fetchImpl, sleep }),
    ).rejects.toThrow(/aborted/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("wraps a second network failure so the raw fetch message does not leak", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const sleep = vi.fn(async () => {});

    const error = await fetchWithNetworkRetry(
      "/api/spots/upload",
      { method: "POST" },
      { fetchImpl, sleep },
    ).then(
      () => {
        throw new Error("expected rejection");
      },
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(NetworkFetchError);
    expect(error).toBeInstanceOf(Error);
    if (!(error instanceof Error)) throw new Error("expected Error");
    expect(error.message).not.toContain("Failed to fetch");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });
});

describe("isNetworkFetchError", () => {
  it("matches a fetch TypeError and ignores HTTP-style and parse errors", () => {
    expect(isNetworkFetchError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isNetworkFetchError(new TypeError("Load failed"))).toBe(true);
    expect(isNetworkFetchError(new Error("Failed to fetch"))).toBe(false);
    expect(isNetworkFetchError(new SyntaxError("Unexpected token <"))).toBe(false);
  });
});

describe("readResponseJson", () => {
  it("returns JSON objects and null for empty or HTML bodies", async () => {
    const json = new Response(JSON.stringify({ error: "Unauthorized", id: "abc" }), {
      status: 401,
    });
    expect(await readResponseJson(json)).toEqual({
      error: "Unauthorized",
      id: "abc",
    });

    expect(await readResponseJson(new Response("", { status: 504 }))).toBeNull();
    expect(
      await readResponseJson(
        new Response("<html><body>An error occurred</body></html>", { status: 504 }),
      ),
    ).toBeNull();
  });
});

describe("submitErrorText", () => {
  it("maps network failures to the Hebrew message and hides Failed to fetch", () => {
    const fromTypeError = submitErrorText(
      new TypeError("Failed to fetch"),
      t,
      "saveFailed",
    );
    const fromWrapper = submitErrorText(new NetworkFetchError(), t, "photoUploadFailed");

    expect(fromTypeError).toBe(dictionary.networkInterrupted);
    expect(fromWrapper).toBe(dictionary.networkInterrupted);
    expect(fromTypeError).not.toContain("Failed to fetch");
    expect(fromWrapper).not.toContain("Failed to fetch");
    expect(dictionary.networkInterrupted).toBe(
      "החיבור נקטע בזמן השליחה. בדקו את החיבור ונסו שוב.",
    );
  });

  it("maps other raw fetch failure strings and keeps translated errors", () => {
    expect(submitErrorText(new TypeError("Load failed"), t, "saveFailed")).toBe(
      dictionary.networkInterrupted,
    );
    expect(
      submitErrorText(
        new Error("NetworkError when attempting to fetch resource."),
        t,
        "saveFailed",
      ),
    ).toBe(dictionary.networkInterrupted);
    expect(submitErrorText(new Error(dictionary.photoUploadFailed), t, "saveFailed")).toBe(
      dictionary.photoUploadFailed,
    );
  });

  it("maps a JSON SyntaxError to the localized fallback", () => {
    const message = submitErrorText(
      new SyntaxError("Unexpected token < in JSON at position 0"),
      t,
      "photoUploadFailed",
    );
    expect(message).toBe(dictionary.photoUploadFailed);
    expect(message).not.toContain("Unexpected token");
  });

  it("uses the fallback when the thrown value is not an Error", () => {
    expect(submitErrorText("Failed to fetch", t, "saveFailed")).toBe(dictionary.saveFailed);
  });
});
