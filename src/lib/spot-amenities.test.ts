import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  SpotAmenityIcons,
  SpotAmenityNotes,
} from "@/components/spots/SpotAmenities";
import {
  spotAmenityDetails,
  spotAmenityFeatures,
  spotAmenityIcons,
  spotAmenityNotes,
} from "@/lib/spot-amenities";

describe("spotAmenityIcons", () => {
  it("shows parking for yes and paid, with a distinct paid label", () => {
    expect(spotAmenityIcons({ parking: "yes" })).toEqual([
      { kind: "parking", symbol: "🅿️", label: "יש חניה" },
    ]);
    expect(spotAmenityIcons({ parking: "paid" })).toEqual([
      { kind: "parking", symbol: "🅿️", label: "יש חניה בתשלום" },
    ]);
  });

  it("shows wheelchair access for yes and partial, with a distinct partial label", () => {
    expect(spotAmenityIcons({ accessibility: "yes" })).toEqual([
      { kind: "accessibility", symbol: "♿", label: "נגיש לכיסא גלגלים" },
    ]);
    expect(spotAmenityIcons({ accessibility: "partial" })).toEqual([
      { kind: "accessibility", symbol: "♿", label: "נגיש חלקית לכיסא גלגלים" },
    ]);
  });

  it("shows both icons when both answers qualify", () => {
    expect(
      spotAmenityIcons({ parking: "paid", accessibility: "partial" }).map(
        (icon) => icon.kind,
      ),
    ).toEqual(["parking", "accessibility"]);
  });

  it("shows nothing for no, empty, or unknown values", () => {
    expect(spotAmenityIcons({ parking: "no", accessibility: "no" })).toEqual([]);
    expect(spotAmenityIcons({ parking: null, accessibility: null })).toEqual([]);
    expect(spotAmenityIcons({})).toEqual([]);
    expect(
      spotAmenityIcons({ parking: "free", accessibility: "maybe" }),
    ).toEqual([]);
  });
});

describe("spotAmenityDetails", () => {
  it("returns a cleaned note with the label that matches the answer", () => {
    expect(
      spotAmenityNotes({
        parking: "paid",
        parkingNote: "  חניון\nליד הכניסה  ",
        accessibility: "partial",
        accessibilityNote: "יש מדרגה אחת",
      }),
    ).toEqual([
      { kind: "parking", label: "יש חניה בתשלום", note: "חניון ליד הכניסה" },
      {
        kind: "accessibility",
        label: "נגיש חלקית לכיסא גלגלים",
        note: "יש מדרגה אחת",
      },
    ]);
  });

  it("shows a visible label for paid or partial access even without a note", () => {
    expect(
      spotAmenityDetails({ parking: "paid", accessibility: "partial" }),
    ).toEqual([
      { kind: "parking", label: "יש חניה בתשלום", note: null },
      { kind: "accessibility", label: "נגיש חלקית לכיסא גלגלים", note: null },
    ]);
  });

  it("keeps a note for an answer of no without inventing an icon", () => {
    expect(
      spotAmenityNotes({ parking: "no", parkingNote: "הרחוב צר" }),
    ).toEqual([{ kind: "parking", label: "אין חניה", note: "הרחוב צר" }]);
    expect(spotAmenityIcons({ parking: "no" })).toEqual([]);
    expect(spotAmenityDetails({ parking: "no", accessibility: "no" })).toEqual([]);
  });

  it("drops blank notes and empty answers", () => {
    expect(
      spotAmenityNotes({
        parking: "yes",
        parkingNote: "   ",
        accessibility: "yes",
        accessibilityNote: null,
      }),
    ).toEqual([]);
    expect(spotAmenityDetails({})).toEqual([]);
  });
});

describe("spotAmenityFeatures", () => {
  it("maps yes, paid, partial, and no onto LocationFeatureSpecification", () => {
    expect(
      spotAmenityFeatures({
        parking: "paid",
        parkingNote: "חניון בתשלום",
        accessibility: "partial",
      }),
    ).toEqual([
      {
        "@type": "LocationFeatureSpecification",
        name: "Parking",
        value: "Paid",
        description: "חניון בתשלום",
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "Wheelchair accessible",
        value: "Partial",
      },
    ]);

    expect(spotAmenityFeatures({ parking: "yes", accessibility: "no" })).toEqual([
      {
        "@type": "LocationFeatureSpecification",
        name: "Parking",
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "Wheelchair accessible",
        value: false,
      },
    ]);
  });

  it("omits features when the answer is empty or unknown", () => {
    expect(spotAmenityFeatures({})).toEqual([]);
    expect(spotAmenityFeatures({ parking: null, accessibility: "soon" })).toEqual(
      [],
    );
  });
});

describe("amenity markup", () => {
  it("exposes Hebrew labels and hides no or empty answers", () => {
    const shown = renderToStaticMarkup(
      createElement(SpotAmenityIcons, {
        parking: "paid",
        accessibility: "partial",
      }),
    );

    expect(shown).toContain('aria-label="יש חניה בתשלום"');
    expect(shown).toContain('title="יש חניה בתשלום"');
    expect(shown).toContain('aria-label="נגיש חלקית לכיסא גלגלים"');
    expect(shown).toContain("🅿️");
    expect(shown).toContain("♿");
    expect(shown).toContain('aria-hidden="true"');

    const decorative = renderToStaticMarkup(
      createElement(SpotAmenityIcons, {
        parking: "yes",
        accessibility: "yes",
        labelled: false,
      }),
    );
    expect(decorative).toContain("🅿️");
    expect(decorative).not.toContain("aria-label");

    expect(
      renderToStaticMarkup(
        createElement(SpotAmenityIcons, { parking: "no", accessibility: null }),
      ),
    ).toBe("");
    expect(renderToStaticMarkup(createElement(SpotAmenityIcons, {}))).toBe("");
  });

  it("renders spot-page notes as text", () => {
    const html = renderToStaticMarkup(
      createElement(SpotAmenityNotes, {
        spot: {
          parking: "yes",
          parkingNote: "חניון חינם",
          accessibility: "no",
          accessibilityNote: "יש מדרגות",
        },
      }),
    );

    expect(html).toContain("יש חניה");
    expect(html).toContain("חניון חינם");
    expect(html).toContain("לא נגיש לכיסא גלגלים");
    expect(html).toContain("יש מדרגות");
    expect(html).not.toContain("<script");
  });
});
