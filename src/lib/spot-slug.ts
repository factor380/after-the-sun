import { SPOT_SLUG_LEXICON } from "@/lib/spot-slug-lexicon";

/** Public spot paths stay short enough for a single URL segment. */
export const SPOT_SLUG_MAX_LENGTH = 60;

/**
 * First-segment routes that are not spots.
 * A generated slug never uses these, so `/spots/new` and `/spots/mine` stay reachable.
 */
export const RESERVED_SPOT_SLUGS = new Set(["new", "mine"]);

/**
 * Consonant map for Hebrew words that are not in the lexicon.
 * The SQL backfill uses the same pairs.
 */
export const SPOT_SLUG_CONSONANTS: Readonly<Record<string, string>> = {
  ב: "b",
  ג: "g",
  ד: "d",
  ה: "h",
  ז: "z",
  ח: "ch",
  ט: "t",
  כ: "k",
  ך: "k",
  ל: "l",
  מ: "m",
  ם: "m",
  נ: "n",
  ן: "n",
  ס: "s",
  פ: "p",
  ף: "f",
  צ: "tz",
  ץ: "tz",
  ק: "k",
  ר: "r",
  ש: "sh",
  ת: "t",
};

/** A leading letter that is a prefix, when the remainder is a known word. */
const HEBREW_PREFIXES: readonly { letter: string; latin: string }[] = [
  { letter: "ה", latin: "ha" },
  { letter: "ב", latin: "be" },
  { letter: "ו", latin: "ve" },
];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSpotSlug(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= SPOT_SLUG_MAX_LENGTH &&
    SLUG_PATTERN.test(value) &&
    !RESERVED_SPOT_SLUGS.has(value)
  );
}

/** Canonical public path. Rejects anything that is not a stored slug. */
export function spotPublicPath(slug: string): string {
  if (!isSpotSlug(slug)) {
    throw new Error("Invalid spot slug");
  }
  return `/spots/${slug}`;
}

function normalizeSpotText(value: string): string {
  return value
    .replace(/[־–—-]/g, " ")
    .replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, "")
    .replace(/[\u05F3\u05F4'"]/g, "");
}

function tokenize(value: string): string[] {
  return normalizeSpotText(value)
    .split(/[^0-9A-Za-z\u05D0-\u05EA]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function stemToken(token: string): string | null {
  const known = SPOT_SLUG_LEXICON[token];
  if (known) return known;
  if (/^[A-Za-z0-9]+$/.test(token)) return token.toLowerCase();
  if (token.length < 2) return null;

  const prefix = HEBREW_PREFIXES.find((entry) => token.startsWith(entry.letter));
  if (!prefix) return null;
  const stemmed = stemToken(token.slice(prefix.letter.length));
  if (!stemmed) return null;
  return `${prefix.latin}-${stemmed}`;
}

function appendConsonant(current: string, mapped: string): string {
  if (current.length > 0 && /[^aeiou]$/.test(current)) {
    return `${current}a${mapped}`;
  }
  return current + mapped;
}

/** Readable fallback for a Hebrew word that is not in the lexicon. */
export function transliterateUnknownHebrew(token: string): string {
  const chars = [...normalizeSpotText(token)];
  let out = "";
  for (let index = 0; index < chars.length; index += 1) {
    const ch = chars[index] ?? "";
    const next = chars[index + 1] ?? "";
    if (ch === "ו" && next === "ו") {
      out = appendConsonant(out, "v");
      index += 1;
      continue;
    }
    if (ch === "י" && next === "י") {
      out = appendConsonant(out, "y");
      index += 1;
      continue;
    }
    if (ch === "ו") {
      out += "o";
      continue;
    }
    if (ch === "י") {
      out += "i";
      continue;
    }
    if (ch === "א" || ch === "ע") {
      if (!/[aeiou]$/.test(out)) out += "a";
      continue;
    }
    if (/^[A-Za-z0-9]$/.test(ch)) {
      out += ch.toLowerCase();
      continue;
    }
    const mapped = SPOT_SLUG_CONSONANTS[ch];
    if (mapped) out = appendConsonant(out, mapped);
  }
  return out;
}

function transliterateToken(token: string): string {
  return stemToken(token) ?? transliterateUnknownHebrew(token);
}

/** Collapse to lowercase ASCII hyphen-words and cap the length. */
export function fitSpotSlug(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (cleaned.length <= SPOT_SLUG_MAX_LENGTH) return cleaned;
  const cut = cleaned.slice(0, SPOT_SLUG_MAX_LENGTH);
  const hyphen = cut.lastIndexOf("-");
  const trimmed = (hyphen > 20 ? cut.slice(0, hyphen) : cut).replace(/-+$/g, "");
  return trimmed;
}

function slugFromText(value: string): string {
  const parts = tokenize(value)
    .map((token) => transliterateToken(token))
    .filter((part) => part.length > 0);
  return fitSpotSlug(parts.join("-"));
}

function shortSpotId(id: string): string {
  const compact = id.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!compact) return "";
  return compact.slice(-6);
}

function trimSlugStem(value: string, max: number): string {
  const cut = value.slice(0, Math.max(0, max)).replace(/-+$/g, "");
  return cut || "spot";
}

/**
 * Preferred slug for a name, before collision suffixes.
 * An empty transliteration becomes `region-shortid`, or `spot-shortid`.
 */
export function spotSlugFromName(
  name: string,
  context?: { region?: string | null; id?: string },
): string {
  const slug = slugFromText(name);
  if (slug) return slug;

  const regionSlug = context?.region ? slugFromText(context.region) : "";
  const shortId = shortSpotId(context?.id ?? "");
  if (!shortId) return regionSlug || "spot";

  const suffix = `-${shortId}`;
  const stem = regionSlug
    ? trimSlugStem(regionSlug, SPOT_SLUG_MAX_LENGTH - suffix.length)
    : "spot";
  return fitSpotSlug(`${stem}${suffix}`) || `spot-${shortId}`;
}

/** `occurrence` 1 is the base. Later ones are `base-2`, `base-3`, and so on. */
export function spotSlugCandidate(base: string, occurrence: number): string {
  const root = fitSpotSlug(base) || "spot";
  if (occurrence <= 1) return root;
  const suffix = `-${occurrence}`;
  const stem = trimSlugStem(root, SPOT_SLUG_MAX_LENGTH - suffix.length);
  return `${stem}${suffix}`;
}

/** Assign a unique slug to each spot in order. Earlier rows keep the unsuffixed form. */
export function assignSpotSlugs<
  T extends { name: string; region?: string | null; id?: string },
>(spots: readonly T[]): (T & { slug: string })[] {
  const taken = new Set<string>();
  return spots.map((spot) => {
    const base = spotSlugFromName(spot.name, {
      region: spot.region ?? null,
      id: spot.id ?? "",
    });
    const slug = allocateSpotSlug(base, (candidate) => taken.has(candidate));
    taken.add(slug);
    return { ...spot, slug };
  });
}

/**
 * First free slug. Reserved route names are treated as already taken.
 * `isTaken` is asked in order, so the oldest spot can keep the unsuffixed slug.
 */
export function allocateSpotSlug(
  base: string,
  isTaken: (candidate: string) => boolean,
): string {
  for (let occurrence = 1; occurrence < 500; occurrence += 1) {
    const candidate = spotSlugCandidate(base, occurrence);
    if (RESERVED_SPOT_SLUGS.has(candidate)) continue;
    if (!isTaken(candidate)) return candidate;
  }
  throw new Error("Could not allocate a spot slug");
}

/**
 * The slug chosen at creation. A later name is ignored on purpose:
 * renaming a spot must not change its public URL.
 */
export function keepSpotSlug(currentSlug: string, nextName: string): string {
  void nextName;
  return currentSlug;
}
