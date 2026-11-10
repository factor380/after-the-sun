import { describe, expect, it } from "vitest";
import { messageKeyForRequestFailure } from "@/lib/i18n/user-facing-error";
import { prepareSpotPhotoFile } from "@/lib/spot-photo-file";

const TINY_JPEG = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);

describe("prepareSpotPhotoFile", () => {
  it("accepts a jpeg and keeps the detected type", async () => {
    const file = new File([TINY_JPEG], "sunset.jpg", { type: "image/jpeg" });
    const prepared = await prepareSpotPhotoFile(file);
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.photo.mime).toBe("image/jpeg");
    expect(prepared.photo.extension).toBe("jpg");
    expect(prepared.photo.bytes[0]).toBe(0xff);
  });

  it("rejects a file whose bytes are not an image", async () => {
    const file = new File([new TextEncoder().encode("not a photo")], "sunset.jpg", {
      type: "image/jpeg",
    });
    const prepared = await prepareSpotPhotoFile(file);
    expect(prepared.ok).toBe(false);
    if (prepared.ok) return;
    expect(prepared.status).toBe(400);
  });

  it("rejects HEIC before it can be stored", async () => {
    const file = new File([TINY_JPEG], "IMG.HEIC", { type: "image/heic" });
    const prepared = await prepareSpotPhotoFile(file);
    expect(prepared.ok).toBe(false);
    if (prepared.ok) return;
    expect(prepared.status).toBe(400);
  });
});

describe("photo upload errors stay in Hebrew and block a silent save", () => {
  it("maps a missing anonymous storage key to the not-sent message", () => {
    expect(
      messageKeyForRequestFailure(
        503,
        "Photo storage is not configured",
        "photoBlockedSubmit",
      ),
    ).toBe("photoStorageMissing");
  });

  it("uses the blocked-submit copy for any other upload failure", () => {
    expect(messageKeyForRequestFailure(502, "Failed to upload photo", "photoBlockedSubmit")).toBe(
      "photoBlockedSubmit",
    );
  });
});
