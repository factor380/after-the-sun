import { matchingRegion, regionPath } from "@/lib/regions";
import {
  normalizeAccessibility,
  normalizeParking,
  readAmenityNote,
} from "@/lib/spot-amenities";

export type SpotFaqLink = {
  href: string;
  name: string;
};

export type SpotFaqItem = {
  question: string;
  /** Plain text. JSON-LD uses this string unchanged. */
  answer: string;
  /**
   * Region page name inside `answer`. The visible FAQ links `name`.
   * JSON-LD keeps the same words with no URL.
   */
  regionLink?: SpotFaqLink;
};

export type SpotFaqSegment = {
  text: string;
  href?: string;
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
 * Answers name the spot so they still make sense when quoted alone.
 * Questions stay gender-neutral. Empty fields add no question.
 */
export function spotFaq(spot: SpotFaqInput): SpotFaqItem[] {
  const name = spot.name;
  const items: SpotFaqItem[] = [];

  const parking = normalizeParking(spot.parking);
  const parkingNote = readAmenityNote(spot.parkingNote);
  if (parking || parkingNote) {
    const phrase =
      parking === "yes"
        ? "יש חניה"
        : parking === "paid"
          ? "חניה בתשלום"
          : parking === "no"
            ? "אין חניה במקום"
            : null;
    const answer = namedFact(name, phrase, parkingNote);
    if (answer) items.push({ question: `איפה חונים ב${name}?`, answer });
  }

  const accessibility = normalizeAccessibility(spot.accessibility);
  const accessibilityNote = readAmenityNote(spot.accessibilityNote);
  if (accessibility || accessibilityNote) {
    const phrase =
      accessibility === "yes"
        ? "נגיש"
        : accessibility === "partial"
          ? "נגיש חלקית"
          : accessibility === "no"
            ? "לא נגיש"
            : null;
    const answer = namedFact(name, phrase, accessibilityNote);
    if (answer) items.push({ question: `מה הנגישות ב${name}?`, answer });
  }

  const region = typeof spot.region === "string" ? spot.region.trim() : "";
  if (region) {
    const location = locationFaq(name, region);
    if (location) items.push(location);
  }

  return items;
}

/** Split `answer` so the region page name can be a link without changing the words. */
export function faqAnswerSegments(item: SpotFaqItem): SpotFaqSegment[] {
  const link = item.regionLink;
  if (!link) return [{ text: item.answer }];
  const at = item.answer.lastIndexOf(link.name);
  if (at < 0) return [{ text: item.answer }];
  const segments: SpotFaqSegment[] = [];
  const before = item.answer.slice(0, at);
  const after = item.answer.slice(at + link.name.length);
  if (before) segments.push({ text: before });
  segments.push({ text: link.name, href: link.href });
  if (after) segments.push({ text: after });
  return segments;
}

function namedFact(name: string, phrase: string | null, note: string | null): string | null {
  if (phrase && note) return `ב${name} ${phrase}. ${note}`;
  if (phrase) return `ב${name} ${phrase}.`;
  if (note) return `ב${name}: ${note}`;
  return null;
}

function locationFaq(name: string, region: string): SpotFaqItem | null {
  const match = matchingRegion(region);
  const sameAsName = region === name.trim();
  const marked = sameAsName ? "" : `האזור שסומן: ${region}.`;
  if (!match) {
    return marked ? { question: `איפה נמצאת הנקודה ${name}?`, answer: marked } : null;
  }

  const page = `הנקודה מופיעה בעמוד האזור ${match.name}.`;
  const answer = marked ? `${marked} ${page}` : page;
  return {
    question: `איפה נמצאת הנקודה ${name}?`,
    answer,
    regionLink: { href: regionPath(match.slug), name: match.name },
  };
}
