/**
 * Visual order for Hebrew Open Graph text.
 *
 * Satori paints glyphs left to right, and `direction: rtl` reverses every
 * character — including digits — so "12 נקודות" is drawn as "21". This applies
 * the Unicode bidirectional reorder (base direction RTL) and returns a string
 * that is already in left-to-right visual order. Digits and Latin stay in
 * reading order; only the RTL runs move.
 */

type Strong = "rtl" | "ltr" | "neutral";

const HEBREW = /[\u0590-\u05FF\uFB1D-\uFB4F]/;

function classify(char: string): Strong {
  if (HEBREW.test(char)) return "rtl";
  if (/[A-Za-z0-9]/.test(char)) return "ltr";
  return "neutral";
}

function strongAt(types: readonly Strong[], index: number, step: -1 | 1): "rtl" | "ltr" | null {
  for (let i = index; i >= 0 && i < types.length; i += step) {
    const type = types[i];
    if (type === "rtl" || type === "ltr") return type;
  }
  return null;
}

/** Neutrals between two matching strong types adopt that type; otherwise the RTL base. */
function resolveNeutrals(types: readonly Strong[]): Strong[] {
  const resolved = types.slice();
  let index = 0;
  while (index < resolved.length) {
    if (resolved[index] !== "neutral") {
      index += 1;
      continue;
    }
    const start = index;
    while (index < resolved.length && types[index] === "neutral") index += 1;
    const prev = strongAt(types, start - 1, -1);
    const next = strongAt(types, index, 1);
    const direction = prev && next && prev === next ? prev : "rtl";
    for (let cursor = start; cursor < index; cursor += 1) resolved[cursor] = direction;
  }
  return resolved;
}

function reverseRuns(order: number[], levels: readonly number[], level: number): number[] {
  const next = order.slice();
  let index = 0;
  while (index < next.length) {
    if ((levels[next[index] ?? 0] ?? 0) < level) {
      index += 1;
      continue;
    }
    let end = index + 1;
    while (end < next.length && (levels[next[end] ?? 0] ?? 0) >= level) end += 1;
    const run = next.slice(index, end).reverse();
    next.splice(index, end - index, ...run);
    index = end;
  }
  return next;
}

/** Left-to-right visual order for a logical string in an RTL paragraph. */
export function reorderRtl(text: string): string {
  const chars = Array.from(text);
  if (chars.length === 0) return "";
  const levels = resolveNeutrals(chars.map(classify)).map((type) => (type === "ltr" ? 2 : 1));
  let order = chars.map((_, index) => index);
  const maxLevel = Math.max(...levels);
  for (let level = maxLevel; level >= 1; level -= 1) {
    order = reverseRuns(order, levels, level);
  }
  return order.map((index) => chars[index] ?? "").join("");
}

/**
 * Words in logical order. Each word is in left-to-right visual order.
 * Lay them out with `flex-direction: row-reverse` so the first word sits on the right.
 * Do not also set CSS `direction: rtl` — Satori would reverse the runs again.
 */
export function rtlWordRuns(text: string): string[] {
  return text
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => reorderRtl(word));
}
