import { describe, expect, it } from "vitest";
import { dictionary } from "@/lib/i18n/dictionaries";
import {
  isAcceptableSpotPhotoFile,
  SPOT_PHOTO_INPUT_ACCEPT,
  spotPhotoPickRoom,
} from "@/lib/spot-photo";

describe("spot photo picks", () => {
  it("includes extensions so Android Chrome can show its system chooser", () => {
    expect(SPOT_PHOTO_INPUT_ACCEPT).toBe("image/*,.jpg,.jpeg,.png,.webp");
  });

  it("accepts jpeg, png, and webp MIME types", () => {
    expect(isAcceptableSpotPhotoFile({ type: "image/jpeg", name: "a.jpg" })).toBe(true);
    expect(isAcceptableSpotPhotoFile({ type: "image/png", name: "a.png" })).toBe(true);
    expect(isAcceptableSpotPhotoFile({ type: "image/webp", name: "a.webp" })).toBe(true);
    expect(
      isAcceptableSpotPhotoFile({ type: "image/jpeg;charset=binary", name: "a.bin" }),
    ).toBe(true);
  });

  it("allows an empty type when the extension is jpg, jpeg, png, or webp", () => {
    expect(isAcceptableSpotPhotoFile({ type: "", name: "sunset.jpg" })).toBe(true);
    expect(isAcceptableSpotPhotoFile({ type: "", name: "sunset.JPEG" })).toBe(true);
    expect(isAcceptableSpotPhotoFile({ type: "", name: "sunset.jpeg" })).toBe(true);
    expect(isAcceptableSpotPhotoFile({ type: "", name: "sunset.png" })).toBe(true);
    expect(isAcceptableSpotPhotoFile({ type: "", name: "sunset.webp" })).toBe(true);
    expect(isAcceptableSpotPhotoFile({ type: "   ", name: "DCIM/sunset.JPG" })).toBe(
      true,
    );
  });

  it("rejects HEIC and other unsupported types with the same rule as the form", () => {
    expect(isAcceptableSpotPhotoFile({ type: "image/heic", name: "a.heic" })).toBe(
      false,
    );
    expect(
      isAcceptableSpotPhotoFile({ type: "image/heic-sequence", name: "a.heic" }),
    ).toBe(false);
    expect(isAcceptableSpotPhotoFile({ type: "image/heif", name: "a.heif" })).toBe(
      false,
    );
    expect(isAcceptableSpotPhotoFile({ type: "image/heic", name: "a.jpg" })).toBe(
      false,
    );
    expect(isAcceptableSpotPhotoFile({ type: "", name: "a.heic" })).toBe(false);
    expect(isAcceptableSpotPhotoFile({ type: "", name: "a.HEIC" })).toBe(false);
    expect(isAcceptableSpotPhotoFile({ type: "", name: "a.gif" })).toBe(false);
    expect(isAcceptableSpotPhotoFile({ type: "image/gif", name: "a.gif" })).toBe(
      false,
    );
    expect(isAcceptableSpotPhotoFile({ type: "", name: "a" })).toBe(false);
    expect(dictionary.photoInvalidType).toBe(
      "סוג קובץ לא נתמך. בחרו JPEG, PNG או WebP.",
    );
  });

  it("counts room from the current photos before a new pick is stored", () => {
    expect(spotPhotoPickRoom(0, 2, false)).toBe(2);
    expect(spotPhotoPickRoom(1, 2, false)).toBe(1);
    expect(spotPhotoPickRoom(2, 2, false)).toBe(0);
    expect(spotPhotoPickRoom(1, 1, true)).toBe(1);
  });

  it("has the loading and failure copy shown on the add-spot form", () => {
    expect(dictionary.photoLoading).toBe("טוען תמונה…");
    expect(dictionary.photoLoadFailed).toBe(
      "התמונה לא נטענה. נסו שוב, או בחרו תמונה ששמורה בטלפון.",
    );
  });
});
