import { describe, expect, it } from "vitest";
import { reorderRtl, rtlWordRuns } from "@/lib/og-rtl";

describe("reorderRtl", () => {
  it("reverses a Hebrew word into left-to-right visual order", () => {
    expect(reorderRtl("תצפיות")).toBe("תויפצת");
    expect(reorderRtl("בירושלים")).toBe("םילשוריב");
  });

  it("keeps digits and times in reading order inside Hebrew", () => {
    expect(reorderRtl("12 נקודות")).toBe("תודוקנ 12");
    expect(reorderRtl("12 נקודות")).not.toContain("21");
    expect(reorderRtl("6 תצפיות")).toBe("תויפצת 6");
    expect(reorderRtl("16:40")).toBe("16:40");
    expect(reorderRtl("33 מתוך 50")).toBe("50 ךותמ 33");
  });

  it("leaves the question mark at the end of the Hebrew phrase", () => {
    expect(reorderRtl("בירושלים?")).toBe("?םילשוריב");
    expect(reorderRtl("איפה רואים שקיעה בירושלים? 6 תצפיות")).toBe(
      "תויפצת 6 ?םילשוריב העיקש םיאור הפיא",
    );
  });

  it("does not reverse Latin or a pure number", () => {
    expect(reorderRtl("After the Sun")).toBe("After the Sun");
    expect(reorderRtl("12")).toBe("12");
  });

  it("splits words without reversing numbers inside each run", () => {
    expect(rtlWordRuns("12 נקודות")).toEqual(["12", "תודוקנ"]);
    expect(rtlWordRuns("גן הקיפוד, ירושלים")).toEqual(["ןג", ",דופיקה", "םילשורי"]);
    expect(rtlWordRuns("איפה רואים שקיעה בירושלים? 6 תצפיות מומלצות בעיר")).toEqual([
      "הפיא",
      "םיאור",
      "העיקש",
      "?םילשוריב",
      "6",
      "תויפצת",
      "תוצלמומ",
      "ריעב",
    ]);
  });
});
