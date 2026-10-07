import { describe, expect, it } from "vitest";
import { createReportSchema } from "./report";
import { assertIsraelCoordinates, createSpotSchema } from "./spot";

const spot = {
  name: "חוף הילטון",
  description: "תצפית פתוחה לים בשעת השקיעה.",
  lat: 32.09,
  lng: 34.77,
  acceptedGuidelines: true as const,
};

describe("createSpotSchema", () => {
  it("accepts a spot inside the field limits", () => {
    expect(createSpotSchema.safeParse(spot).success).toBe(true);
  });

  it("rejects a name that is too short", () => {
    expect(createSpotSchema.safeParse({ ...spot, name: "א" }).success).toBe(
      false,
    );
  });

  it("rejects a photo URL that is not https", () => {
    expect(
      createSpotSchema.safeParse({
        ...spot,
        photoUrl: "http://example.com/photo.jpg",
      }).success,
    ).toBe(false);
  });

  it("requires the guidelines confirmation", () => {
    expect(
      createSpotSchema.safeParse({ ...spot, acceptedGuidelines: false })
        .success,
    ).toBe(false);
  });
});

describe("assertIsraelCoordinates", () => {
  it("accepts a point in Tel Aviv", () => {
    expect(() => assertIsraelCoordinates(32.09, 34.77)).not.toThrow();
  });

  it("rejects a point outside Israel", () => {
    expect(() => assertIsraelCoordinates(48.85, 2.35)).toThrow(/Israel/);
  });
});

describe("createReportSchema", () => {
  it("accepts a known reason", () => {
    expect(createReportSchema.safeParse({ reason: "spam" }).success).toBe(
      true,
    );
  });

  it("rejects an unknown reason", () => {
    expect(createReportSchema.safeParse({ reason: "boring" }).success).toBe(
      false,
    );
  });
});
