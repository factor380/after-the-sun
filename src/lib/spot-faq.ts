import { matchingRegion } from "@/lib/regions";
import {
  normalizeAccessibility,
  normalizeParking,
  readAmenityNote,
} from "@/lib/spot-amenities";

export type SpotFaqItem = {
  question: string;
  answer: string;
};

type SpotFaqInput = {
  name: string;
  region?: string | null;
  parking?: string | null;
  parkingNote?: string | null;
  accessibility?: string | null;
  accessibilityNote?: string | null;
};

/**
 * FAQ answers use the same words already shown for amenities ("יש חניה",
 * "נגיש", "נגיש חלקית", "לא נגיש"). Parking "no" adds "במקום" so the
 * sentence stands alone. Nothing is invented when a field is empty.
 */
export function spotFaq(spot: SpotFaqInput): SpotFaqItem[] {
  const name = spot.name;
  const items: SpotFaqItem[] = [];

  const parking = normalizeParking(spot.parking);
  const parkingNote = readAmenityNote(spot.parkingNote);
  if (parking || parkingNote) {
    const value =
      parking === "yes"
        ? "יש חניה"
        : parking === "paid"
          ? "חניה בתשלום"
          : parking === "no"
            ? "אין חניה במקום"
            : null;
    const answer = joinAnswer(value, parkingNote);
    if (answer) items.push({ question: `איפה חונים ב${name}?`, answer });
  }

  const accessibility = normalizeAccessibility(spot.accessibility);
  const accessibilityNote = readAmenityNote(spot.accessibilityNote);
  if (accessibility || accessibilityNote) {
    const value =
      accessibility === "yes"
        ? "נגיש"
        : accessibility === "partial"
          ? "נגיש חלקית"
          : accessibility === "no"
            ? "לא נגיש"
            : null;
    const answer = joinAnswer(value, accessibilityNote);
    if (answer) items.push({ question: `האם ${name} נגיש?`, answer });
  }

  const region = typeof spot.region === "string" ? spot.region.trim() : "";
  if (region) {
    const match = matchingRegion(region);
    const answer = match
      ? `${name} נמצא ב${region}. עמוד האזור: ${match.name}.`
      : `${name} נמצא ב${region}.`;
    items.push({ question: `איפה נמצא ${name}?`, answer });
  }

  return items;
}

function joinAnswer(value: string | null, note: string | null): string | null {
  if (value && note) return `${value}. ${note}`;
  return value ?? note;
}
