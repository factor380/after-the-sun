/** Left-to-right isolate. Keeps a Latin chunk in reading order inside RTL text. */
const LTR_ISOLATE = "\u2066";
/** Ends the isolate opened by {@link LTR_ISOLATE}. */
const POP_ISOLATE = "\u2069";

function ltr(value: string): string {
  return `${LTR_ISOLATE}${value}${POP_ISOLATE}`;
}

/**
 * Helper under the add-spot file input.
 * "JPEG, PNG", "WebP", and "~12MB" are LTR isolates. Without them the RTL
 * paragraph pulls the comma, the middle dot, and the tilde to the wrong side.
 */
export const PHOTO_HINT = `${ltr("JPEG, PNG")} או ${ltr("WebP")} · עד ${ltr("~12MB")} לפני דחיסה אוטומטית`;
