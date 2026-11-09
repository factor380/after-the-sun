import { describe, expect, it } from "vitest";
import {
  buildNewSpotDraftFields,
  newSpotDraftHasVisibleContent,
  newSpotDraftInputHasContent,
  parseNewSpotDraft,
} from "@/lib/new-spot-draft";

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
    expect(draft?.parking).toBeNull();
    expect(draft?.parkingNote).toBe("");
    expect(draft?.accessibility).toBeNull();
    expect(draft?.accessibilityNote).toBe("");
    expect(draft?.contributorName).toBe("");
  });

  it("keeps a contributor name and a chosen location", () => {
    const fields = buildNewSpotDraftFields(
      {
        name: "תצפית הטיוטה",
        description: "תיאור שנשמר אחרי התחברות.",
        region: "יפו",
        lat: 32.08,
        lng: 34.78,
        confirmedLat: 32.08,
        confirmedLng: 34.78,
        photoUrl: "",
        acceptedGuidelines: false,
        parking: "yes",
        parkingNote: "",
        accessibility: null,
        accessibilityNote: "",
        contributorName: "  דנה כהן",
        photos: [],
      },
      NOW - 1000,
    );

    const draft = parseNewSpotDraft(JSON.stringify(fields), NOW);
    expect(draft?.name).toBe("תצפית הטיוטה");
    expect(draft?.description).toBe("תיאור שנשמר אחרי התחברות.");
    expect(draft?.region).toBe("יפו");
    expect(draft?.lat).toBe(32.08);
    expect(draft?.lng).toBe(34.78);
    expect(draft?.confirmedLat).toBe(32.08);
    expect(draft?.confirmedLng).toBe(34.78);
    expect(draft?.contributorName).toBe("  דנה כהן");
    expect(draft?.parking).toBe("yes");
  });

  it("keeps a draft that only has a contributor name", () => {
    const draft = parseNewSpotDraft(
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
        contributorName: "נועה",
      }),
      NOW,
    );
    expect(draft?.contributorName).toBe("נועה");
  });

  it("restores amenity answers and ignores unknown choices", () => {
    const draft = parseNewSpotDraft(
      payload({
        parking: "paid",
        parkingNote: "  חניון  ",
        accessibility: "partial",
        accessibilityNote: "שביל",
      }),
      NOW,
    );
    expect(draft?.parking).toBe("paid");
    expect(draft?.parkingNote).toBe("חניון");
    expect(draft?.accessibility).toBe("partial");
    expect(draft?.accessibilityNote).toBe("שביל");

    const unknown = parseNewSpotDraft(
      payload({ parking: "free", accessibility: "soon" }),
      NOW,
    );
    expect(unknown?.name).toBe("חוף");
    expect(unknown?.parking).toBeNull();
    expect(unknown?.accessibility).toBeNull();
  });

  it("drops whitespace-only text and still remembers a missing photo", () => {
    expect(
      parseNewSpotDraft(
        payload({
          name: "   ",
          description: " \n ",
          region: " ",
          lat: null,
          lng: null,
          confirmedLat: null,
          confirmedLng: null,
          photoUrl: "  ",
          expectedPhotoCount: 0,
          contributorName: "  ",
          parkingNote: "   ",
          accessibilityNote: " ",
        }),
        NOW,
      ),
    ).toBeNull();

    const missingPhoto = parseNewSpotDraft(
      payload({
        name: " ",
        description: "",
        region: "",
        lat: null,
        lng: null,
        confirmedLat: null,
        confirmedLng: null,
        photoUrl: "",
        expectedPhotoCount: 1,
        contributorName: " ",
      }),
      NOW,
    );
    expect(missingPhoto?.expectedPhotoCount).toBe(1);
    expect(missingPhoto && newSpotDraftHasVisibleContent(missingPhoto)).toBe(false);
    expect(
      newSpotDraftInputHasContent({
        name: "   ",
        description: "",
        region: "",
        lat: null,
        lng: null,
        confirmedLat: null,
        confirmedLng: null,
        photoUrl: "",
        acceptedGuidelines: false,
        parking: null,
        parkingNote: "",
        accessibility: null,
        accessibilityNote: "",
        contributorName: " ",
        photos: [],
      }),
    ).toBe(false);
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
