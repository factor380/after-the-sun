import { describe, expect, it } from "vitest";
import { canDeleteSpotPhoto, isRecordOwner } from "@/lib/spot-ownership";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const OTHER_ID = "00000000-0000-4000-8000-000000000002";

describe("isRecordOwner", () => {
  it("is false for an anonymous visitor on a spot with no creator", () => {
    expect(isRecordOwner(null, null)).toBe(false);
    expect(isRecordOwner(undefined, null)).toBe(false);
    expect(isRecordOwner(undefined, undefined)).toBe(false);
  });

  it("is false for a signed-in user on a spot with no creator", () => {
    expect(isRecordOwner(USER_ID, null)).toBe(false);
    expect(isRecordOwner(USER_ID, undefined)).toBe(false);
  });

  it("is false when the visitor is anonymous and the spot has a creator", () => {
    expect(isRecordOwner(null, USER_ID)).toBe(false);
    expect(isRecordOwner("", USER_ID)).toBe(false);
  });

  it("is true only when the signed-in user is that creator", () => {
    expect(isRecordOwner(USER_ID, USER_ID)).toBe(true);
    expect(isRecordOwner(USER_ID, OTHER_ID)).toBe(false);
  });
});

describe("canDeleteSpotPhoto", () => {
  const community = {
    id: "photo-1",
    uploadedById: OTHER_ID,
  };

  it("hides delete for an anonymous visitor when the spot has no creator", () => {
    expect(
      canDeleteSpotPhoto(null, null, { id: "photo-1", uploadedById: null }),
    ).toBe(false);
  });

  it("hides delete for a signed-in user who did not upload the photo on an unclaimed spot", () => {
    expect(canDeleteSpotPhoto(USER_ID, null, community)).toBe(false);
  });

  it("lets the uploader delete their photo when the spot has no creator", () => {
    expect(
      canDeleteSpotPhoto(USER_ID, null, { id: "photo-1", uploadedById: USER_ID }),
    ).toBe(true);
  });

  it("lets the creator delete a community photo and never the cover", () => {
    expect(canDeleteSpotPhoto(USER_ID, USER_ID, community)).toBe(true);
    expect(
      canDeleteSpotPhoto(USER_ID, USER_ID, { id: null, uploadedById: null }),
    ).toBe(false);
  });
});
