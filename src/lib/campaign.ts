import { cache } from "react";
import { countSpots } from "@/services/spots";

export const CAMPAIGN_GOAL = 50;
/** Used only when the database cannot be read. */
export const CAMPAIGN_FALLBACK_COUNT = 33;

export const getCampaignSpotCount = cache(async (): Promise<number> => {
  try {
    const count = await countSpots();
    if (!Number.isFinite(count) || count < 0) return CAMPAIGN_FALLBACK_COUNT;
    return Math.floor(count);
  } catch {
    return CAMPAIGN_FALLBACK_COUNT;
  }
});

export function campaignTitle(count: number): string {
  if (count >= CAMPAIGN_GOAL) return `${count} נקודות שקיעה`;
  return `מ-${count} ל-${CAMPAIGN_GOAL} נקודות שקיעה`;
}

export function campaignDescription(count: number): string {
  return `מפה קהילתית של נקודות שקיעה בישראל. כרגע ${count} נקודות - עוזרים להגיע ל-${CAMPAIGN_GOAL} עד סוף אוקטובר. הוסיפו נקודה עם תמונה ותיאור קצר.`;
}

export function campaignLead(count: number): string {
  if (count >= CAMPAIGN_GOAL) {
    return `יש לנו כבר ${count} נקודות על המפה. היעד של ${CAMPAIGN_GOAL} עד סוף אוקטובר 2026 הושג - ועדיין אפשר להוסיף נקודה היום.`;
  }
  const remaining = CAMPAIGN_GOAL - count;
  const missing = remaining === 1 ? "חסרה נקודה אחת" : `חסרות ${remaining}`;
  return `יש לנו כבר ${count} נקודות על המפה. ${missing} כדי להגיע ל-${CAMPAIGN_GOAL} עד סוף אוקטובר 2026 - ואפשר לעזור בזה היום.`;
}

export function campaignWhyNow(count: number): string {
  if (count >= CAMPAIGN_GOAL) {
    return `יעד ${CAMPAIGN_GOAL} עד סוף אוקטובר 2026; כרגע ${count} - היעד הושג.`;
  }
  const remaining = CAMPAIGN_GOAL - count;
  const missing = remaining === 1 ? "חסרה נקודה אחת" : `חסרות ${remaining}`;
  return `יעד ${CAMPAIGN_GOAL} עד סוף אוקטובר 2026; כרגע ${count}, ${missing}.`;
}
