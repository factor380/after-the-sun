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
      // Carmel coast (חוף הכרמל, חוף דור), not the southern coastal plain.
      "כרמל",
      "דור",
    ],
  },
  {
    slug: "south-shfela",
    name: "הדרום והשפלה",
    title: "נקודות שקיעה בדרום ובשפלה",
    description:
      "נקודות שקיעה בדרום, בשפלה, בנגב, באילת ובים המלח על המפה הקהילתית After the Sun. רשימה עם קישור לכל נקודה.",
    intro:
      "אלה נקודות השקיעה שסומנו בדרום או בשפלה על המפה. נקודה מופיעה כאן כשהאזור שנכתב בה מציין דרום, שפלה, נגב, אילת, אשקלון, דימונה, או יישוב אחר באזור.",
    // "מישור החוף" / "חוף הדרומי" keep the southern coastal plain here.
    // A bare "חוף" is not a matcher: Sharon and Carmel coasts name their own places.
    // Yehuda is tested first (see regionsInMatchOrder) so "דרום הר חברון" is not caught by "דרום".
    // מטה יהודה, שפלת יהודה, and הרי יהודה are the foothills and hills west of Jerusalem
    // (with בית שמש), not the Judea settlements page.
    matchers: [
      "דרום",
      "שפלה",
      "אילת",
      "אשקלון",
      "אשדוד",
      "באר שבע",
      "נגב",
      "ערבה",
      "מצפה רמון",
      "ים המלח",
      "קריית גת",
      "קרית גת",
      "שפירא",
      "רחובות",
      "בית שמש",
      "מודיעין",
      "לכיש",
      "מישור החוף",
      "חוף הדרומי",
      "מטה יהודה",
      "שפלת יהודה",
      "הרי יהודה",
      "דימונה",
      "עוטף עזה",
    ],
  },
  {
    slug: "judea",
    name: "יהודה",
    title: "נקודות שקיעה ביהודה",
    description:
      "נקודות שקיעה ביהודה, בגוש עציון ובהר חברון על המפה הקהילתית After the Sun. רשימה עם קישור לכל נקודה.",
    intro:
      "אלה נקודות השקיעה שסומנו ביהודה על המפה. נקודה מופיעה כאן כשהאזור שנכתב בה מציין גוש עציון, הר חברון, אפרת, תקוע, עתניאל, או יישוב אחר ביהודה.",
    matchers: [
      "גוש עציון",
      "עציון",
      "נווה דניאל",
      "בת עין",
      "כרמי צור",
      "כפר עציון",
      "אפרת",
      "תקוע",
      "דרום הר חברון",
      "הר חברון",
      "עתניאל",
      "קריית ארבע",
      "קרית ארבע",
      "יהודה",
    ],
  },
  {
    slug: "samaria",
    name: "שומרון ובנימין",
    title: "נקודות שקיעה בשומרון ובבנימין",
    description:
      "נקודות שקיעה בשומרון ובבנימין על המפה הקהילתית After the Sun. רשימה עם קישור לכל נקודה.",
    intro:
      "אלה נקודות השקיעה שסומנו בשומרון או בבנימין על המפה. נקודה מופיעה כאן כשהאזור שנכתב בה מציין שומרון, בנימין, אריאל, עפרה, אלקנה, או יישוב אחר באזור.",
    matchers: [
      "שומרון",
      "בנימין",
      "עפרה",
      "אלקנה",
      "אריאל",
      "מרכז שומרון",
      "קרני שומרון",
      "בית אל",
    ],
  },
  {
    slug: "sharon-coast",
    name: "השרון והחוף",
    title: "נקודות שקיעה בשרון ובחוף",
    description:
      "נקודות שקיעה בנתניה, בהרצליה, בקיסריה ובעמק חפר על המפה הקהילתית After the Sun. רשימה עם קישור לכל נקודה.",
    intro:
      "אלה נקודות השקיעה שסומנו בשרון או בחוף הסמוך על המפה. נקודה מופיעה כאן כשהאזור שנכתב בה מציין נתניה, הרצליה, קיסריה, עמק חפר, רמות מנשה, או יישוב אחר בשרון.",
    matchers: [
      "נתניה",
      "הרצליה",
      "הרצלייה",
      "קיסריה",
      "עמק חפר",
      "שרון",
      "רמות מנשה",
      "דליה",
      "כפר סבא",
      "רעננה",
      "חדרה",
      "זכרון",
      // Even Yehuda is a Sharon town; "פולג" is the Netanya beach.
      "אבן יהודה",
      "פולג",
    ],
  },
];

const PLACE_SEPARATORS = /[\s\-–—−־/|,·•]+/u;

/**
 * "יהודה" still means the Judea page, except after a word that names a different
 * place: Even Yehuda (Sharon), or the Mateh Yehuda / Shephelah / Judean hills
 * labels that belong with Beit Shemesh on the south page.
 */
const SINGLE_WORD_PREVIOUS_BLOCK: Readonly<Record<string, ReadonlySet<string>>> = {
  יהודה: new Set(["אבן", "מטה", "שפלת", "הרי"]),
};

/**
 * Split hub. It is not one of `SUNSET_REGIONS`: spots stay on יהודה or שומרון.
 * The sitemap and llms.txt both list it through `publicRegionPages()`.
 */
export const JUDEA_SAMARIA_HUB = {
  path: "/regions/judea-samaria",
  title: "נקודות שקיעה ביהודה ובשומרון",
  description:
    "העמוד המשותף ליהודה ושומרון חולק לשתי רשימות: יהודה, ושומרון ובנימין. בחרו את האזור כדי לראות את נקודות השקיעה.",
} as const;

export type PublicRegionPage = {
  path: string;
  /** Spot-matching region. Null for the Judea and Samaria hub. */
  slug: string | null;
  title: string;
  description: string;
};

/** Every public region URL. Sitemap and llms.txt both use this list. */
export function publicRegionPages(): PublicRegionPage[] {
  return [
    ...SUNSET_REGIONS.map((region) => ({
      path: regionPath(region.slug),
      slug: region.slug,
      title: region.title,
      description: region.intro,
    })),
    {
      path: JUDEA_SAMARIA_HUB.path,
      slug: null,
      title: JUDEA_SAMARIA_HUB.title,
      description: JUDEA_SAMARIA_HUB.description,
    },
  ];
}

export function regionPath(slug: string): string {
  return `/regions/${slug}`;
}

export function getRegionBySlug(slug: string): SunsetRegion | undefined {
  return SUNSET_REGIONS.find((region) => region.slug === slug);
}

/**
 * Drawer and page order follow `SUNSET_REGIONS`. Yehuda and Shomron are
 * tested before the south page so "דרום הר חברון" is not taken by "דרום".
 * A label that only says "דרום" still reaches the south page.
 */
function regionsInMatchOrder(): SunsetRegion[] {
  const ahead = new Set(["judea", "samaria"]);
  const early = SUNSET_REGIONS.filter((region) => ahead.has(region.slug));
  const rest = SUNSET_REGIONS.filter((region) => !ahead.has(region.slug));
  const southAt = rest.findIndex((region) => region.slug === "south-shfela");
  if (southAt < 0) return [...SUNSET_REGIONS];
  return [...rest.slice(0, southAt), ...early, ...rest.slice(southAt)];
}

/** The first matching region in match order, if any. */
export function matchingRegion(regionText: string | null | undefined): SunsetRegion | undefined {
  const tokens = placeTokens(regionText);
  if (tokens.length === 0) return undefined;
  return regionsInMatchOrder().find((region) =>
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
    const blockedBy = SINGLE_WORD_PREVIOUS_BLOCK[word];
    return tokens.some((token, index) => {
      if (token !== word && token !== `ה${word}`) return false;
      if (!blockedBy || index === 0) return true;
      return !blockedBy.has(tokens[index - 1]);
    });
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
