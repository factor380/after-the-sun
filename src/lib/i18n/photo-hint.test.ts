import { describe, expect, it } from "vitest";
import { dictionary } from "@/lib/i18n/dictionaries";
import { PHOTO_HINT } from "@/lib/i18n/photo-hint";

const LTR_ISOLATE = "\u2066";
const POP_ISOLATE = "\u2069";

describe("PHOTO_HINT", () => {
  it("keeps each Latin chunk in an LTR isolate so RTL does not reorder it", () => {
    expect(PHOTO_HINT).toBe(
      `${LTR_ISOLATE}JPEG, PNG${POP_ISOLATE} או ${LTR_ISOLATE}WebP${POP_ISOLATE} · עד ${LTR_ISOLATE}~12MB${POP_ISOLATE} לפני דחיסה אוטומטית`,
    );
  });

  it("still reads as the Hebrew file hint once the isolates are ignored", () => {
    const readable = PHOTO_HINT.replace(/[\u2066\u2069]/g, "");
    expect(dictionary.photoHint).toBe(PHOTO_HINT);
    expect(readable).toBe("JPEG, PNG או WebP · עד ~12MB לפני דחיסה אוטומטית");
    expect(readable).not.toContain("\u2014");
  });
});
