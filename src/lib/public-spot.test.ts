import { describe, expect, it } from "vitest";
import { toPublicSpot } from "@/lib/public-spot";

const base = {
  id: "spot-1",
  name: "חוף",
  description: "שקיעה על המים בערב שקט.",
  lat: 31.67,
  lng: 34.55,
  region: "אשקלון",
  photoUrl: null,
  createdById: "user-1",
  createdAt: new Date("2026-11-02T00:00:00.000Z"),
};

describe("toPublicSpot amenities", () => {
  it("copies known answers and drops unknown or blank notes", () => {
    const spot = toPublicSpot({
      ...base,
      parking: "paid",
      parkingNote: "  חניון  ",
      accessibility: "nope",
      accessibilityNote: "   ",
    });

    expect(spot.parking).toBe("paid");
    expect(spot.parkingNote).toBe("חניון");
    expect(spot.accessibility).toBeNull();
    expect(spot.accessibilityNote).toBeNull();
  });

  it("treats a record without the columns as unanswered", () => {
    const spot = toPublicSpot(base);

    expect(spot.parking).toBeNull();
    expect(spot.parkingNote).toBeNull();
    expect(spot.accessibility).toBeNull();
    expect(spot.accessibilityNote).toBeNull();
  });
});
