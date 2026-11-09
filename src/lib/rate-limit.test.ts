import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("allows requests up to the limit and then blocks", () => {
    const key = `limit-${crypto.randomUUID()}`;
    expect(rateLimit(key, 2, 60_000)).toBe(true);
    expect(rateLimit(key, 2, 60_000)).toBe(true);
    expect(rateLimit(key, 2, 60_000)).toBe(false);
  });

  it("starts a new window after the previous one ends", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-09T08:00:00.000Z"));
    const key = `window-${crypto.randomUUID()}`;

    expect(rateLimit(key, 1, 1_000)).toBe(true);
    expect(rateLimit(key, 1, 1_000)).toBe(false);

    vi.advanceTimersByTime(1_000);
    expect(rateLimit(key, 1, 1_000)).toBe(true);
  });

  it("keeps a separate count for each key", () => {
    const first = `a-${crypto.randomUUID()}`;
    const second = `b-${crypto.randomUUID()}`;
    expect(rateLimit(first, 1, 60_000)).toBe(true);
    expect(rateLimit(first, 1, 60_000)).toBe(false);
    expect(rateLimit(second, 1, 60_000)).toBe(true);
  });
});
