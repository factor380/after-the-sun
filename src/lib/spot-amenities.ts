import {
  ACCESSIBILITY_VALUES,
  AMENITY_NOTE_MAX,
  PARKING_VALUES,
  type Accessibility,
  type Parking,
} from "@/types/spot";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export type AmenityIcon = {
  kind: "parking" | "accessibility";
  symbol: "🅿️" | "♿";
  label: string;
};

export type AmenityNote = {
  kind: "parking" | "accessibility";
  label: string;
  note: string;
};

export type AmenityDetail = {
  kind: "parking" | "accessibility";
  label: string;
  note: string | null;
};

export type AmenityFeature = {
  "@type": "LocationFeatureSpecification";
  name: "Parking" | "Wheelchair accessible";
  value: boolean | "Paid" | "Partial";
  description?: string;
};

type AmenityInput = {
  parking?: string | null;
  parkingNote?: string | null;
  accessibility?: string | null;
  accessibilityNote?: string | null;
};

/** Collapse control characters and surrounding space. Does not enforce length. */
export function cleanAmenityNote(value: string): string {
  return value.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim();
}

/** Read path: empty and non-strings become null, and over-long text is capped. */
export function readAmenityNote(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = cleanAmenityNote(value);
  if (!cleaned) return null;
  return cleaned.slice(0, AMENITY_NOTE_MAX);
}

export function normalizeParking(value: unknown): Parking | null {
  return typeof value === "string" &&
    (PARKING_VALUES as readonly string[]).includes(value)
    ? (value as Parking)
    : null;
}

export function normalizeAccessibility(value: unknown): Accessibility | null {
  return typeof value === "string" &&
    (ACCESSIBILITY_VALUES as readonly string[]).includes(value)
    ? (value as Accessibility)
    : null;
}

function parkingLabel(value: Parking | null): string {
  if (value === "paid") return "יש חניה בתשלום";
  if (value === "no") return "אין חניה";
  if (value === "yes") return "יש חניה";
  return "חניה";
}

function accessibilityLabel(value: Accessibility | null): string {
  if (value === "partial") return "נגיש חלקית לכיסא גלגלים";
  if (value === "no") return "לא נגיש לכיסא גלגלים";
  if (value === "yes") return "נגיש לכיסא גלגלים";
  return "נגישות";
}

/**
 * Icons next to a spot name. `no` and empty stay hidden.
 * Paid parking and partial access keep the same symbol, with a distinct label.
 */
export function spotAmenityIcons(spot: AmenityInput): AmenityIcon[] {
  const icons: AmenityIcon[] = [];
  const parking = normalizeParking(spot.parking);
  if (parking === "yes" || parking === "paid") {
    icons.push({
      kind: "parking",
      symbol: "🅿️",
      label: parkingLabel(parking),
    });
  }

  const accessibility = normalizeAccessibility(spot.accessibility);
  if (accessibility === "yes" || accessibility === "partial") {
    icons.push({
      kind: "accessibility",
      symbol: "♿",
      label: accessibilityLabel(accessibility),
    });
  }

  return icons;
}

/**
 * Spot-page text. Icon answers always get a visible label, so paid parking
 * and partial access are clear without a hover tooltip. A note is included
 * when the contributor wrote one, including an answer of `no`.
 */
export function spotAmenityDetails(spot: AmenityInput): AmenityDetail[] {
  const details: AmenityDetail[] = [];
  const parking = normalizeParking(spot.parking);
  const parkingNote = readAmenityNote(spot.parkingNote);
  if (parking === "yes" || parking === "paid" || parkingNote) {
    details.push({
      kind: "parking",
      label: parkingLabel(parking),
      note: parkingNote,
    });
  }

  const accessibility = normalizeAccessibility(spot.accessibility);
  const accessibilityNote = readAmenityNote(spot.accessibilityNote);
  if (accessibility === "yes" || accessibility === "partial" || accessibilityNote) {
    details.push({
      kind: "accessibility",
      label: accessibilityLabel(accessibility),
      note: accessibilityNote,
    });
  }

  return details;
}

/** Notes only, for callers that should stay quiet when the contributor left the field blank. */
export function spotAmenityNotes(spot: AmenityInput): AmenityNote[] {
  return spotAmenityDetails(spot).flatMap((detail) =>
    detail.note
      ? [{ kind: detail.kind, label: detail.label, note: detail.note }]
      : [],
  );
}

/**
 * Place.amenityFeature values. `isAccessibleForFree` stays a separate fact
 * about visiting the spot, so paid parking does not change it.
 * Unknown or empty answers are omitted.
 */
export function spotAmenityFeatures(spot: AmenityInput): AmenityFeature[] {
  const features: AmenityFeature[] = [];
  const parking = normalizeParking(spot.parking);
  if (parking) {
    const note = readAmenityNote(spot.parkingNote);
    features.push({
      "@type": "LocationFeatureSpecification",
      name: "Parking",
      value: parking === "yes" ? true : parking === "no" ? false : "Paid",
      ...(note ? { description: note } : {}),
    });
  }

  const accessibility = normalizeAccessibility(spot.accessibility);
  if (accessibility) {
    const note = readAmenityNote(spot.accessibilityNote);
    features.push({
      "@type": "LocationFeatureSpecification",
      name: "Wheelchair accessible",
      value:
        accessibility === "yes"
          ? true
          : accessibility === "no"
            ? false
            : "Partial",
      ...(note ? { description: note } : {}),
    });
  }

  return features;
}
