export const E2E_SEED_USER_ID = "00000000-0000-4000-8000-000000000001";

export type E2ESeedSpot = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  /** Free-text region. The first matching region page lists the spot. Null stays off every page. */
  region: string | null;
  parking?: "yes" | "paid" | "no" | null;
  parkingNote?: string | null;
  accessibility?: "yes" | "partial" | "no" | null;
  accessibilityNote?: string | null;
};

/**
 * One spot for every public region page, plus the live labels "צפון" and
 * "הרי הגלבוע", and one spot with no amenities and no region.
 * Coordinates sit inside Israel.
 * None of these rows carry a photo, so spot pages use the shared PNG card.
 */
export const E2E_SEED_SPOTS: readonly E2ESeedSpot[] = [
  {
    id: "e2e-tel-aviv",
    name: "נמל יפו",
    description: "שקיעה מעל הנמל העתיק, עם סירות ורציפי אבן.",
    lat: 32.0525,
    lng: 34.7511,
    region: "תל אביב–יפו",
    parking: "yes",
    parkingNote: "חניה ליד הנמל",
    accessibility: "partial",
    accessibilityNote: "שביל סלול עד הרציף",
  },
  {
    id: "e2e-jerusalem",
    name: "טיילת ארמון הנציב",
    description: "תצפית דרומית על מדבר יהודה בשעת בין־ערביים.",
    lat: 31.7683,
    lng: 35.2137,
    region: "ירושלים",
  },
  {
    id: "e2e-haifa",
    name: "טיילת בת גלים",
    description: "הקצה המערבי של חיפה, עם המפרץ בשקיעה.",
    lat: 32.8322,
    lng: 34.9724,
    region: "חיפה",
  },
  {
    id: "e2e-south",
    name: "חוף הצפון אילת",
    description: "שקיעה קצרה על מפרץ אילת בחורף, ארוכה בקיץ.",
    lat: 29.5581,
    lng: 34.9515,
    region: "אילת",
  },
  {
    id: "e2e-judea",
    name: "תצפית גוש עציון",
    description: "רכס פתוח למערב מעל גוש עציון בשעת השקיעה.",
    lat: 31.65,
    lng: 35.12,
    region: "גוש עציון",
  },
  {
    id: "e2e-samaria",
    name: "תצפית שומרון",
    description: "גבעה פתוחה בשומרון עם אופק מערבי רחב.",
    lat: 32.104,
    lng: 35.174,
    region: "שומרון",
  },
  {
    id: "e2e-sharon",
    name: "פארק הצוק נתניה",
    description: "צוקי כורכר מול הים התיכון בשעת הזהב.",
    lat: 32.3285,
    lng: 34.8515,
    region: "נתניה",
  },
  {
    id: "e2e-tzfon",
    name: "תצפית בדיקת צפון",
    description: "נקודה שסומנה עם האזור צפון.",
    lat: 32.9278,
    lng: 35.0818,
    region: "צפון",
  },
  {
    id: "e2e-gilboa",
    name: "מצפה בדיקת גלבוע",
    description: "נקודה שסומנה עם האזור הרי הגלבוע.",
    lat: 32.482,
    lng: 35.421,
    region: "הרי הגלבוע",
  },
  {
    id: "e2e-no-faq",
    name: "נקודה בלי פרטים",
    description: "נקודה בלי חניה, בלי נגישות ובלי אזור.",
    lat: 31.7,
    lng: 34.75,
    region: null,
    parking: null,
    parkingNote: null,
    accessibility: null,
    accessibilityNote: null,
  },
];
