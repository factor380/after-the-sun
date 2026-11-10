import { describe, expect, it } from "vitest";
import { resolveAdminSpotCover } from "@/lib/admin-cover";

const COVER = "https://cdn.example/cover.jpg";
const NEXT = "https://cdn.example/next.jpg";
const LATER = "https://cdn.example/later.jpg";
const FRESH = "https://cdn.example/fresh.jpg";

const photos = [
  { id: "cover", url: COVER },
  { id: "next", url: NEXT },
  { id: "later", url: LATER },
];

describe("resolveAdminSpotCover", () => {
  it("keeps another gallery photo when the cover file is deleted", () => {
    const result = resolveAdminSpotCover({
      requestedPhotoUrl: COVER,
      existingPhotoUrl: COVER,
      photos,
      removePhotoIds: ["cover"],
    });

    expect(result.photoUrl).toBe(NEXT);
    expect(result.removedPhotoUrls).toEqual([COVER]);
  });

  it("ignores a repeated removal id and still keeps the oldest remaining photo", () => {
    const result = resolveAdminSpotCover({
      requestedPhotoUrl: COVER,
      existingPhotoUrl: COVER,
      photos,
      removePhotoIds: ["cover", "cover"],
    });

    expect(result.photoUrl).toBe(NEXT);
    expect(result.removedPhotoUrls).toEqual([COVER]);
  });

  it("clears the cover when its file is the last photo", () => {
    const result = resolveAdminSpotCover({
      requestedPhotoUrl: COVER,
      existingPhotoUrl: COVER,
      photos: [{ id: "cover", url: COVER }],
      removePhotoIds: ["cover"],
    });

    expect(result.photoUrl).toBeNull();
    expect(result.removedPhotoUrls).toEqual([COVER]);
  });

  it("keeps a new cover while the old cover file is deleted", () => {
    const result = resolveAdminSpotCover({
      requestedPhotoUrl: FRESH,
      existingPhotoUrl: COVER,
      photos: [{ id: "cover", url: COVER }],
      removePhotoIds: ["cover"],
    });

    expect(result.photoUrl).toBe(FRESH);
    expect(result.removedPhotoUrls).toEqual([COVER]);
  });

  it("does not keep a cover set to a photo that is also being deleted", () => {
    const result = resolveAdminSpotCover({
      requestedPhotoUrl: COVER,
      existingPhotoUrl: "https://cdn.example/standalone.jpg",
      photos,
      removePhotoIds: ["cover"],
    });

    expect(result.photoUrl).toBe(NEXT);
    expect(result.removedPhotoUrls).toEqual([
      COVER,
      "https://cdn.example/standalone.jpg",
    ]);
  });

  it("clears a cover set to the only photo being deleted, and drops the old file", () => {
    const result = resolveAdminSpotCover({
      requestedPhotoUrl: COVER,
      existingPhotoUrl: "https://cdn.example/standalone.jpg",
      photos: [{ id: "cover", url: COVER }],
      removePhotoIds: ["cover"],
    });

    expect(result.photoUrl).toBeNull();
    expect(result.removedPhotoUrls).toEqual([
      COVER,
      "https://cdn.example/standalone.jpg",
    ]);
  });

  it("leaves an explicit empty cover empty and keeps a gallery file that is still there", () => {
    const result = resolveAdminSpotCover({
      requestedPhotoUrl: null,
      existingPhotoUrl: COVER,
      photos,
      removePhotoIds: ["later"],
    });

    expect(result.photoUrl).toBeNull();
    expect(result.removedPhotoUrls).toEqual([LATER]);
  });

  it("does not delete a gallery photo that is still the cover", () => {
    const result = resolveAdminSpotCover({
      requestedPhotoUrl: COVER,
      existingPhotoUrl: COVER,
      photos,
      removePhotoIds: ["later"],
    });

    expect(result.photoUrl).toBe(COVER);
    expect(result.removedPhotoUrls).toEqual([LATER]);
  });

  it("does not delete a gallery file when a blank cover still matches it", () => {
    const result = resolveAdminSpotCover({
      requestedPhotoUrl: "  ",
      existingPhotoUrl: COVER,
      photos: [{ id: "cover", url: COVER }],
      removePhotoIds: [],
    });

    expect(result.photoUrl).toBeNull();
    expect(result.removedPhotoUrls).toEqual([]);
  });

  it("treats a blank requested cover as cleared and deletes a file the gallery does not keep", () => {
    const result = resolveAdminSpotCover({
      requestedPhotoUrl: "  ",
      existingPhotoUrl: COVER,
      photos: [{ id: "next", url: NEXT }],
      removePhotoIds: [],
    });

    expect(result.photoUrl).toBeNull();
    expect(result.removedPhotoUrls).toEqual([COVER]);
  });
});
