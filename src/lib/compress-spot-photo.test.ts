import { afterEach, describe, expect, it, vi } from "vitest";
import {
  compressSpotPhoto,
  SPOT_PHOTO_LOAD_TIMEOUT_MS,
  SpotPhotoLoadTimeoutError,
  SpotPhotoTooLargeError,
  withTimeout,
} from "@/lib/compress-spot-photo";

describe("withTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("bounds a spot photo read and compress to 25 seconds", () => {
    expect(SPOT_PHOTO_LOAD_TIMEOUT_MS).toBe(25_000);
  });

  it("returns the value when the work finishes before the deadline", async () => {
    vi.useFakeTimers();
    const result = withTimeout(Promise.resolve("ready"), SPOT_PHOTO_LOAD_TIMEOUT_MS);
    await expect(result).resolves.toBe("ready");
    await vi.advanceTimersByTimeAsync(SPOT_PHOTO_LOAD_TIMEOUT_MS);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects with SpotPhotoLoadTimeoutError when the work outlasts the deadline", async () => {
    vi.useFakeTimers();
    const result = withTimeout(
      new Promise<string>(() => {}),
      SPOT_PHOTO_LOAD_TIMEOUT_MS,
    );
    const settled = expect(result).rejects.toBeInstanceOf(SpotPhotoLoadTimeoutError);
    await vi.advanceTimersByTimeAsync(SPOT_PHOTO_LOAD_TIMEOUT_MS - 1);
    await vi.advanceTimersByTimeAsync(1);
    await settled;
  });

  it("propagates a failure from the work and cancels the deadline", async () => {
    vi.useFakeTimers();
    const result = withTimeout(
      Promise.reject(new SpotPhotoTooLargeError()),
      SPOT_PHOTO_LOAD_TIMEOUT_MS,
    );
    await expect(result).rejects.toBeInstanceOf(SpotPhotoTooLargeError);
    await vi.advanceTimersByTimeAsync(SPOT_PHOTO_LOAD_TIMEOUT_MS);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ignores a late result after the deadline already won", async () => {
    vi.useFakeTimers();
    let resolveWork: (value: string) => void = () => {};
    const work = new Promise<string>((resolve) => {
      resolveWork = resolve;
    });
    const result = withTimeout(work, SPOT_PHOTO_LOAD_TIMEOUT_MS);
    const settled = result.then(
      () => "resolved",
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(SPOT_PHOTO_LOAD_TIMEOUT_MS);
    resolveWork("late");
    await expect(settled).resolves.toBeInstanceOf(SpotPhotoLoadTimeoutError);
  });
});

describe("compressSpotPhoto", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns the original file when the document is unavailable", async () => {
    const file = new File(["sunset"], "sunset.jpg", { type: "image/jpeg" });
    await expect(compressSpotPhoto(file, 20)).resolves.toBe(file);
  });

  it("gives up when arrayBuffer does not finish within the deadline", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("document", {
      createElement: () => {
        throw new Error("canvas should not run after a timed-out read");
      },
    });
    const file = new File(["sunset"], "sunset.jpg", { type: "image/jpeg" });
    vi.spyOn(file, "arrayBuffer").mockReturnValue(new Promise<ArrayBuffer>(() => {}));
    const result = compressSpotPhoto(file, SPOT_PHOTO_LOAD_TIMEOUT_MS);
    const settled = expect(result).rejects.toBeInstanceOf(SpotPhotoLoadTimeoutError);
    await vi.advanceTimersByTimeAsync(SPOT_PHOTO_LOAD_TIMEOUT_MS);
    await settled;
  });
});
