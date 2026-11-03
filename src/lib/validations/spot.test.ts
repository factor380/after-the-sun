import { describe, expect, it } from "vitest";
import { createReportSchema } from "./report";
import { assertIsraelCoordinates, createSpotSchema, updateSpotSchema } from "./spot";

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

  it("accepts a missing idempotency key and a UUID", () => {
    expect(createSpotSchema.safeParse(spot).success).toBe(true);
    expect(
      createSpotSchema.safeParse({
        ...spot,
        clientRequestId: "550e8400-e29b-41d4-a716-446655440000",
      }).success,
    ).toBe(true);
  });

  it("rejects an idempotency key that is not a UUID", () => {
    expect(
      createSpotSchema.safeParse({ ...spot, clientRequestId: "submit-1" })
        .success,
    ).toBe(false);
  });

  it("accepts optional parking and accessibility answers", () => {
    const parsed = createSpotSchema.safeParse({
      ...spot,
      parking: "paid",
      parkingNote: "  חניון בתשלום  ",
      accessibility: "partial",
      accessibilityNote: "",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.parking).toBe("paid");
    expect(parsed.data.parkingNote).toBe("חניון בתשלום");
    expect(parsed.data.accessibility).toBe("partial");
    expect(parsed.data.accessibilityNote).toBeNull();
  });

  it("treats a missing amenity answer as omitted and rejects unknown values", () => {
    const parsed = createSpotSchema.safeParse(spot);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.parking).toBeUndefined();
    expect(parsed.data.accessibility).toBeUndefined();

    expect(createSpotSchema.safeParse({ ...spot, parking: "free" }).success).toBe(
      false,
    );
    expect(
      createSpotSchema.safeParse({ ...spot, accessibility: "soon" }).success,
    ).toBe(false);
    expect(
      createSpotSchema.safeParse({
        ...spot,
        parkingNote: "א".repeat(201),
      }).success,
    ).toBe(false);
  });

  it("lets an edit change only the amenity fields", () => {
    const parsed = updateSpotSchema.safeParse({
      parking: null,
      accessibility: "yes",
      accessibilityNote: "שביל סלול",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.parking).toBeNull();
    expect(parsed.data.accessibility).toBe("yes");
    expect(parsed.data.accessibilityNote).toBe("שביל סלול");
    expect(parsed.data.name).toBeUndefined();
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
