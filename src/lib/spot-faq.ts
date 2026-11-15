import { SUNSET_REGIONS, matchingRegion, regionPath } from "@/lib/regions";
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

type HebrewPrefix = "ב" | "ל" | "מ";

/**
 * ב and ל absorb a leading definite article: ב + החרמון = בחרמון.
 * מ keeps it: מ + החרמון = מהחרמון.
 * Words whose ה is a letter of the word (הר, הרצליה, הוד) stay whole.
 * Anything else that starts with ה is ambiguous, so ב/ל use a hyphen
 * instead of guessing בה or dropping the ה.
 */
const RADICAL_HE_WORDS = new Set([
  "הר",
  "הרי",
  "הרצליה",
  "הרצלייה",
  "הוד",
  "הדס",
  "הדסה",
  "הדר",
  "הראל",
  "הרטוב",
  "היכל",
  "הילטון",
  "הרודס",
  "הרודיון",
  "הלל",
  "הושע",
  "הגר",
]);

/** Place nouns that take ה as the article, in addition to region matchers. */
const COMMON_ARTICLE_STEMS = [
  "מרפסת",
  "חוף",
  "רחוב",
  "רכס",
  "רציף",
  "יער",
  "גן",
  "פארק",
  "טיילת",
  "נמל",
  "מצפה",
  "מצפור",
  "תצפית",
  "מאגר",
  "כפר",
  "שכונה",
  "מצוק",
  "בקעה",
  "עמק",
  "ים",
  "גבעה",
  "מעיין",
  "שמורה",
  "מבצר",
  "ארמון",
];

const MATCHER_SEPARATORS = /[\s\-–—−־/|,·•]+/u;
const ELIDING_PREFIXES = new Set<HebrewPrefix>(["ב", "ל"]);
const ENDS_WITH_TERMINAL = /(?:[.!?…׃]|\.{2,})$/u;

const ARTICLE_STEMS = new Set<string>([
  ...COMMON_ARTICLE_STEMS,
  ...SUNSET_REGIONS.flatMap((region) =>
    region.matchers.flatMap((matcher) =>
      matcher
        .normalize("NFKC")
        .split(MATCHER_SEPARATORS)
        .map((token) => token.replace(/["'״׳]/g, "").trim())
        .filter((token) => token.length >= 2),
    ),
  ),
]);

/**
 * Questions name the spot and stay gender-neutral.
 * Parking answers name the spot. Accessibility answers say "המקום",
 * because "בגמלא נגיש" does not read as a Hebrew sentence.
 * Empty fields add no question.
 */
export function spotFaq(spot: SpotFaqInput): SpotFaqItem[] {
  const name = spot.name.trim();
  const at = withHebrewPrefix("ב", name);
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
    const answer = composeAnswer(phrase ? `${at} ${phrase}` : null, parkingNote, at);
    if (answer) items.push({ question: `איפה חונים ${at}?`, answer });
  }

  const accessibility = normalizeAccessibility(spot.accessibility);
  const accessibilityNote = readAmenityNote(spot.accessibilityNote);
  if (accessibility || accessibilityNote) {
    const phrase =
      accessibility === "yes"
        ? "המקום נגיש"
        : accessibility === "partial"
          ? "המקום נגיש חלקית"
          : accessibility === "no"
            ? "המקום אינו נגיש"
            : null;
    const answer = composeAnswer(phrase, accessibilityNote, at);
    if (answer) items.push({ question: `מה הנגישות ${at}?`, answer });
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

/** Attach ב, ל, or מ to a place name without doubling a definite ה. */
export function withHebrewPrefix(prefix: HebrewPrefix, name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return prefix;
  const first = /^\S+/u.exec(trimmed)?.[0] ?? trimmed;
  const role = leadingHeRole(first);
  if (ELIDING_PREFIXES.has(prefix) && role === "article") {
    return `${prefix}${first.slice(1)}${trimmed.slice(first.length)}`;
  }
  if (ELIDING_PREFIXES.has(prefix) && role === "ambiguous") {
    return `${prefix}-${trimmed}`;
  }
  return `${prefix}${trimmed}`;
}

function leadingHeRole(word: string): "article" | "radical" | "ambiguous" | "none" {
  if (!word.startsWith("ה") || word.length < 2) return "none";
  if (RADICAL_HE_WORDS.has(word)) return "radical";
  const stem = word.slice(1);
  if (stem.length < 2) return "ambiguous";
  if (ARTICLE_STEMS.has(stem)) return "article";
  return "ambiguous";
}

function composeAnswer(
  lead: string | null,
  note: string | null,
  noteOnlyLead: string,
): string | null {
  const noted = punctuatedNote(note);
  const leadKey = lead ? sentenceKey(lead) : "";
  const noteKey = noted ? sentenceKey(noted) : "";
  const duplicate = Boolean(leadKey && noteKey && leadKey === noteKey);
  if (lead && noted && !duplicate) {
    return dedupeSentences(`${ensureTerminalPunctuation(lead)} ${noted}`);
  }
  if (lead) return dedupeSentences(ensureTerminalPunctuation(lead));
  if (noted) return dedupeSentences(`${noteOnlyLead}: ${noted}`);
  return null;
}

function punctuatedNote(note: string | null): string | null {
  if (!note) return null;
  const punctuated = ensureTerminalPunctuation(note);
  return sentenceKey(punctuated) ? punctuated : null;
}

function ensureTerminalPunctuation(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || ENDS_WITH_TERMINAL.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

function sentenceKey(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(?:[.!?…׃]|\.{2,})+$/u, "")
    .trim();
}

/**
 * Drop a later sentence that repeats an earlier one, including when the
 * repeated clause is the tail of the place sentence ("חניה בתשלום. חניה בתשלום").
 */
function dedupeSentences(value: string): string {
  const seen: string[] = [];
  const kept: string[] = [];
  for (const sentence of value.split(/(?<=[.!?…׃])\s+(?=\S)/u)) {
    const trimmed = sentence.trim();
    const key = sentenceKey(trimmed);
    if (!key) continue;
    const redundant = seen.some((previous) => previous === key || previous.endsWith(` ${key}`));
    if (redundant) continue;
    seen.push(key);
    kept.push(trimmed);
  }
  return kept.join(" ");
}

function locationFaq(name: string, region: string): SpotFaqItem | null {
  const match = matchingRegion(region);
  const marked = samePlaceName(name, region) ? "" : `האזור שסומן: ${region}.`;
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

function samePlaceName(name: string, region: string): boolean {
  const norm = (value: string) => value.normalize("NFKC").replace(/\s+/g, " ").trim();
  return norm(name) === norm(region);
}
