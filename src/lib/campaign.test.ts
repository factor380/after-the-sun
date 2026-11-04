import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_DEADLINE_LABEL,
  CAMPAIGN_GOAL,
  campaignDescription,
  campaignLead,
  campaignShareSubtitle,
  campaignTitle,
  campaignWhyNow,
} from "@/lib/campaign";

describe("campaign goal", () => {
  it("aims at 75 published spots by the end of 2026", () => {
    expect(CAMPAIGN_GOAL).toBe(75);
    expect(CAMPAIGN_DEADLINE_LABEL).toBe("עד סוף 2026");
  });

  it("builds the title, description, and share line from the live count", () => {
    expect(campaignTitle(49)).toBe("מ-49 ל-75 נקודות שקיעה");
    expect(campaignDescription(49)).toBe(
      "מפה קהילתית של נקודות שקיעה בישראל. כרגע 49 נקודות - עוזרים להגיע ל-75 עד סוף 2026. הוסיפו נקודה עם תמונה ותיאור קצר.",
    );
    expect(campaignShareSubtitle(49)).toBe("49 מתוך 75 עד סוף 2026");
    expect(campaignLead(49)).toContain("חסרות 26");
    expect(campaignLead(49)).toContain("עד סוף 2026");
    expect(campaignLead(74)).toContain("חסרה נקודה אחת");
    expect(campaignWhyNow(49)).toBe("יעד 75 עד סוף 2026; כרגע 49, חסרות 26.");
  });

  it("keeps inviting spots after the goal is met, without the old October deadline", () => {
    const joined = [
      campaignTitle(75),
      campaignTitle(80),
      campaignDescription(75),
      campaignLead(75),
      campaignLead(80),
      campaignWhyNow(75),
      campaignShareSubtitle(80),
    ].join("\n");

    expect(campaignTitle(75)).toBe("75 נקודות שקיעה");
    expect(campaignLead(75)).toContain("היעד של 75 עד סוף 2026 הושג");
    expect(joined).not.toContain("אוקטובר");
    expect(joined).not.toContain("ל-50");
    expect(joined).not.toContain("\u2014");
  });
});
