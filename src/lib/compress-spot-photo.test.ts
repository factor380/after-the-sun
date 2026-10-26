import { describe, expect, it } from "vitest";
import { compressSpotPhoto } from "@/lib/compress-spot-photo";
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

describe("compressSpotPhoto small files", () => {
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
});
