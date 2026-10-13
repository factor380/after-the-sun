/**
 * Public region landing pages.
 *
 * Spots store a free-text `region` (often a city or area, such as "תל אביב–יפו").
 * A spot is listed on the first region whose matchers hit that text. Coordinates
 * are not used, so a contributor's label is what decides the page.
 */

export type SunsetRegion = {
  slug: string;
  /** Short Hebrew name for nav links and the eyebrow. */
  name: string;
  /** Document title and H1. The layout template appends the site name. */
  title: string;
  description: string;
  /** Short intro. Describes how the list is built; no extra claims. */
  intro: string;
  /**
   * Hebrew phrases matched against the spot's region field.
   * A single word also matches the same word with a leading ה.
   */
  matchers: readonly string[];
};

export const SUNSET_REGIONS: readonly SunsetRegion[] = [
  {
    slug: "tel-aviv",
    name: "תל אביב–יפו",
    title: "נקודות שקיעה בתל אביב–יפו",
    description:
      "נקודות שקיעה בתל אביב–יפו על המפה הקהילתית After the Sun. מקומות שסומנו בעיר, עם קישור לעמוד של כל נקודה.",
    intro:
      "אלה נקודות השקיעה שסומנו בתל אביב–יפו על המפה. נקודה מופיעה כאן כשהאזור שנכתב בה כולל את תל אביב או יפו.",
    matchers: ["תל אביב", "יפו"],
  },
  {
    slug: "jerusalem",
    name: "ירושלים",
    title: "נקודות שקיעה בירושלים",
    description:
      "נקודות שקיעה בירושלים על המפה הקהילתית After the Sun. מקומות שסומנו בעיר, עם קישור לעמוד של כל נקודה.",
    intro:
      "אלה נקודות השקיעה שסומנו בירושלים על המפה. נקודה מופיעה כאן כשהאזור שנכתב בה כולל את ירושלים.",
    matchers: ["ירושלים"],
  },
  {
    slug: "haifa-north",
    name: "חיפה והצפון",
    title: "נקודות שקיעה בחיפה ובצפון",
    description:
      "נקודות שקיעה בחיפה, בגליל, בכנרת ובגולן על המפה הקהילתית After the Sun. רשימה מתעדכנת עם קישור לכל נקודה.",
    intro:
      "אלה נקודות השקיעה שסומנו בחיפה או בצפון על המפה. נקודה מופיעה כאן כשהאזור שנכתב בה מציין חיפה, גליל, כנרת, גולן, או יישוב צפוני אחר.",
    matchers: [
      "חיפה",
      "גליל",
      "כנרת",
      "גולן",
      "עכו",
      "נהריה",
      "נהרייה",
      "צפת",
      "טבריה",
      "ראש הנקרה",
      "קריית שמונה",
      "קרית שמונה",
    ],
  },
];

const PLACE_SEPARATORS = /[\s\-–—−־/|,·•]+/u;

export function regionPath(slug: string): string {
  return `/regions/${slug}`;
}

export function getRegionBySlug(slug: string): SunsetRegion | undefined {
  return SUNSET_REGIONS.find((region) => region.slug === slug);
}

/** The first configured region whose matchers hit `regionText`, if any. */
export function matchingRegion(regionText: string | null | undefined): SunsetRegion | undefined {
  const tokens = placeTokens(regionText);
  if (tokens.length === 0) return undefined;
  return SUNSET_REGIONS.find((region) =>
    region.matchers.some((matcher) => tokensIncludePhrase(tokens, matcher)),
  );
}

export function spotMatchesRegion(
  regionText: string | null | undefined,
  region: SunsetRegion,
): boolean {
  return matchingRegion(regionText)?.slug === region.slug;
}

export function filterSpotsForRegion<T extends { region: string | null }>(
  spots: readonly T[],
  region: SunsetRegion,
): T[] {
  return spots.filter((spot) => spotMatchesRegion(spot.region, region));
}

function placeTokens(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .normalize("NFKC")
    .split(PLACE_SEPARATORS)
    .map((token) =>
      token
        .replace(/[\u0591-\u05C7]/g, "")
        .replace(/["'״׳]/g, "")
        .trim(),
    )
    .filter(Boolean);
}

function tokensIncludePhrase(tokens: string[], phrase: string): boolean {
  const parts = placeTokens(phrase);
  if (parts.length === 0) return false;
  if (parts.length === 1) {
    const word = parts[0];
    return tokens.some((token) => token === word || token === `ה${word}`);
  }

  for (let index = 0; index <= tokens.length - parts.length; index += 1) {
    const matches = parts.every((word, offset) => {
      const token = tokens[index + offset];
      if (offset === 0) return token === word || token === `ה${word}`;
      return token === word;
    });
    if (matches) return true;
  }
  return false;
}
