import { describe, expect, it } from "vitest";
import { parseNewSpotDraft } from "@/lib/new-spot-draft";

const NOW = Date.parse("2026-10-18T12:00:00.000Z");

function payload(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    name: "חוף",
    description: "שקיעה על המים בערב שקט.",
    region: "אשקלון",
    lat: 31.67,
    lng: 34.55,
    confirmedLat: 31.67,
    confirmedLng: 34.55,
    photoUrl: "https://example.com/sunset.jpg",
    acceptedGuidelines: true,
    expectedPhotoCount: 1,
    savedAt: NOW - 60_000,
    ...overrides,
  });
}

describe("parseNewSpotDraft", () => {
  it("keeps a recent https draft", () => {
    const draft = parseNewSpotDraft(payload(), NOW);
    expect(draft?.name).toBe("חוף");
    expect(draft?.photoUrl).toBe("https://example.com/sunset.jpg");
    expect(draft?.acceptedGuidelines).toBe(true);
    expect(draft?.expectedPhotoCount).toBe(1);
  });

  it("drops stale, future, empty, and non-https values", () => {
    expect(parseNewSpotDraft(payload({ savedAt: NOW - 25 * 60 * 60 * 1000 }), NOW)).toBeNull();
    expect(parseNewSpotDraft(payload({ savedAt: NOW + 5 * 60_000 }), NOW)).toBeNull();
    expect(parseNewSpotDraft("not-json", NOW)).toBeNull();
    expect(
      parseNewSpotDraft(
        payload({
          name: "",
          description: "",
          region: "",
          lat: null,
          lng: null,
          confirmedLat: null,
          confirmedLng: null,
          photoUrl: "",
          expectedPhotoCount: 0,
        }),
        NOW,
      ),
    ).toBeNull();

    const unsafe = parseNewSpotDraft(
      payload({ photoUrl: "javascript:alert(1)" }),
      NOW,
    );
    expect(unsafe?.photoUrl).toBe("");
    expect(unsafe?.name).toBe("חוף");
  });

  it("rejects corrupt coordinates and clamps photo count", () => {
    expect(parseNewSpotDraft(payload({ lat: 120 }), NOW)).toBeNull();
    expect(parseNewSpotDraft(payload({ lng: "34" }), NOW)).toBeNull();
    const draft = parseNewSpotDraft(payload({ expectedPhotoCount: 9 }), NOW);
    expect(draft?.expectedPhotoCount).toBe(0);
  });
});
