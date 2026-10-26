import { afterEach, describe, expect, it, vi } from "vitest";
import {
  compressSpotPhoto,
  SPOT_PHOTO_LOAD_TIMEOUT_MS,
  SpotPhotoLoadTimeoutError,
  SpotPhotoTooLargeError,
  withTimeout,
} from "@/lib/compress-spot-photo";
import { TARGET_SPOT_PHOTO_BYTES } from "@/lib/spot-photo";

class UnreadableFile extends File {
  override arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.reject(
      new DOMException(
        "The requested file could not be read, typically due to permission problems.",
        "NotReadableError",
      ),
    );
  }
}

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

describe("compressSpotPhoto small files", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("copies a small file into a new in-memory File", async () => {
    const bytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 1, 2, 3, 4]);
    const original = new File([bytes], "sunset.jpg", {
      type: "image/jpeg",
      lastModified: 1_700_000_000_000,
    });

    const result = await compressSpotPhoto(original);

    expect(result).not.toBe(original);
    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe("sunset.jpg");
    expect(result.type).toBe("image/jpeg");
    expect(result.lastModified).toBe(1_700_000_000_000);
    expect(result.size).toBe(bytes.byteLength);
    expect(new Uint8Array(await result.arrayBuffer())).toEqual(bytes);
  });

  it("materializes a file that is exactly the target size", async () => {
    const original = new File([new Uint8Array(TARGET_SPOT_PHOTO_BYTES)], "edge.jpg", {
      type: "image/jpeg",
      lastModified: 50,
    });

    const result = await compressSpotPhoto(original);

    expect(result).not.toBe(original);
    expect(result.size).toBe(TARGET_SPOT_PHOTO_BYTES);
    expect(result.name).toBe("edge.jpg");
    expect(result.type).toBe("image/jpeg");
  });

  it("throws when a small file cannot be read, instead of returning the original handle", async () => {
    const original = new UnreadableFile([Uint8Array.from([1, 2, 3])], "cloud.jpg", {
      type: "image/jpeg",
      lastModified: 42,
    });

    await expect(compressSpotPhoto(original)).rejects.toThrow(/could not be read/);
  });

  it("leaves an oversized file on its original handle when canvas is unavailable", async () => {
    expect(typeof document).toBe("undefined");
    const original = new File(
      [new Uint8Array(TARGET_SPOT_PHOTO_BYTES + 1)],
      "big.jpg",
      { type: "image/jpeg" },
    );

    const result = await compressSpotPhoto(original);

    expect(result).toBe(original);
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
