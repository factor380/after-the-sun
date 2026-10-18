import { describe, expect, it } from "vitest";
import { jsonLdString, regionPageJsonLd } from "@/lib/seo";
import {
  SUNSET_REGIONS,
  filterSpotsForRegion,
  getRegionBySlug,
  matchingRegion,
  regionPath,
} from "@/lib/regions";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Region labels from the live map, one entry per spot. */
const LIVE_REGION_LABELS = [
  "נווה דניאל",
  "תל אביב",
  "הרצליה",
  "גוש עציון בת עין",
  "גולן",
  "ירושלים",
  "נתניה",
  "מרכז שומרון",
  "כנרת - מזרח",
  "כפר ורדים, גליל מערבי",
  "ירושלים שכונת רמות",
  "אשקלון",
  "עוטף עזה",
  "גוש עציון",
  "ירושלים",
  "אילת",
  "ירושלים",
  "חיפה",
  "דימונה",
  "גוש עציון",
  "ירושלים",
  "עמק חפר",
  "אלקנה",
  "שומרון",
  "ירושלים",
  "בנימין",
  "עתניאל",
  "גוש עציון",
  "גליל מערבי",
  "אילת",
  "תל אביב–יפו",
  "נתניה",
  "אשקלון",
  "תל אביב",
  "חיפה",
  "קיסריה",
  "רמות מנשה",
  "מישור החוף הדרומי",
];

describe("sunset regions", () => {
  it("publishes stable, indexable slugs", () => {
    expect(SUNSET_REGIONS.map((region) => region.slug)).toEqual([
      "tel-aviv",
      "jerusalem",
      "haifa-north",
      "south-shfela",
      "judea",
      "samaria",
      "sharon-coast",
    ]);
    expect(new Set(SUNSET_REGIONS.map((region) => region.slug)).size).toBe(
      SUNSET_REGIONS.length,
    );
    for (const region of SUNSET_REGIONS) {
      expect(region.slug).toMatch(SLUG);
      expect(regionPath(region.slug)).toBe(`/regions/${region.slug}`);
      expect(region.title.includes("After the Sun")).toBe(false);
      expect(region.description.length).toBeLessThanOrEqual(160);
      expect(region.description.length).toBeGreaterThan(40);
      expect(region.intro.length).toBeGreaterThan(20);
    }
    expect(new Set(SUNSET_REGIONS.map((region) => region.title)).size).toBe(
      SUNSET_REGIONS.length,
    );
    expect(new Set(SUNSET_REGIONS.map((region) => region.description)).size).toBe(
      SUNSET_REGIONS.length,
    );
  });

  it("groups the live region labels onto one page each", () => {
    const spots = LIVE_REGION_LABELS.map((region, index) => ({
      id: String(index),
      region,
    }));

    expect(filterSpotsForRegion(spots, SUNSET_REGIONS[0]).map((spot) => spot.region)).toEqual([
      "תל אביב",
      "תל אביב–יפו",
      "תל אביב",
    ]);
    expect(filterSpotsForRegion(spots, SUNSET_REGIONS[1])).toHaveLength(6);
    expect(filterSpotsForRegion(spots, SUNSET_REGIONS[2]).map((spot) => spot.region)).toEqual([
      "גולן",
      "כנרת - מזרח",
      "כפר ורדים, גליל מערבי",
      "חיפה",
      "גליל מערבי",
      "חיפה",
    ]);

    expect(filterSpotsForRegion(spots, SUNSET_REGIONS[3]).map((spot) => spot.region)).toEqual([
      "אשקלון",
      "עוטף עזה",
      "אילת",
      "דימונה",
      "אילת",
      "אשקלון",
      "מישור החוף הדרומי",
    ]);
    expect(filterSpotsForRegion(spots, SUNSET_REGIONS[4]).map((spot) => spot.region)).toEqual([
      "נווה דניאל",
      "גוש עציון בת עין",
      "גוש עציון",
      "גוש עציון",
      "עתניאל",
      "גוש עציון",
    ]);
    expect(filterSpotsForRegion(spots, SUNSET_REGIONS[5]).map((spot) => spot.region)).toEqual([
      "מרכז שומרון",
      "אלקנה",
      "שומרון",
      "בנימין",
    ]);
    expect(filterSpotsForRegion(spots, SUNSET_REGIONS[6]).map((spot) => spot.region)).toEqual([
      "הרצליה",
      "נתניה",
      "עמק חפר",
      "נתניה",
      "קיסריה",
      "רמות מנשה",
    ]);

    const assigned = spots.filter((spot) => matchingRegion(spot.region));
    expect(assigned).toHaveLength(spots.length);
    const counts = SUNSET_REGIONS.map((region) => filterSpotsForRegion(spots, region).length);
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(spots.length);
    expect(new Set(assigned.map((spot) => spot.id)).size).toBe(assigned.length);
  });

  it("treats dashes, the definite article, and empty labels consistently", () => {
    expect(matchingRegion("תל אביב-יפו")?.slug).toBe("tel-aviv");
    expect(matchingRegion("תל־אביב")?.slug).toBe("tel-aviv");
    expect(matchingRegion("יפו")?.slug).toBe("tel-aviv");
    expect(matchingRegion("הגולן")?.slug).toBe("haifa-north");
    expect(matchingRegion("רמת הגולן")?.slug).toBe("haifa-north");
    expect(matchingRegion("ראש הנקרה")?.slug).toBe("haifa-north");
    expect(matchingRegion("תל אביב ירושלים")?.slug).toBe("tel-aviv");
    expect(matchingRegion("תל אביב חוף")?.slug).toBe("tel-aviv");
    expect(matchingRegion("ירושלים דרום")?.slug).toBe("jerusalem");
    expect(matchingRegion("חיפה דרום")?.slug).toBe("haifa-north");
    expect(matchingRegion("הרצליה")?.slug).toBe("sharon-coast");
    expect(matchingRegion("הרצלייה")?.slug).toBe("sharon-coast");
    expect(matchingRegion("השרון")?.slug).toBe("sharon-coast");
    expect(matchingRegion("אילת")?.slug).toBe("south-shfela");
    expect(matchingRegion("השפלה")?.slug).toBe("south-shfela");
    expect(matchingRegion("באר שבע")?.slug).toBe("south-shfela");
    expect(matchingRegion("ים המלח")?.slug).toBe("south-shfela");
    expect(matchingRegion("מודיעין-מכבים-רעות")?.slug).toBe("south-shfela");
    expect(matchingRegion("קרית גת")?.slug).toBe("south-shfela");
    expect(matchingRegion("מישור החוף הדרומי")?.slug).toBe("south-shfela");
    expect(matchingRegion("הדרומי")).toBeUndefined();
    expect(matchingRegion("דימונה")?.slug).toBe("south-shfela");
    expect(matchingRegion("עוטף עזה")?.slug).toBe("south-shfela");
    expect(matchingRegion("רמות מנשה")?.slug).toBe("sharon-coast");
    expect(matchingRegion("גוש עציון")?.slug).toBe("judea");
    expect(matchingRegion("השומרון")?.slug).toBe("samaria");
    expect(matchingRegion("מרכז שומרון")?.slug).toBe("samaria");
    expect(matchingRegion("גוש עציון בת עין")?.slug).toBe("judea");
    expect(matchingRegion("הר חברון")?.slug).toBe("judea");
    expect(matchingRegion("דרום הר חברון")?.slug).toBe("judea");
    expect(matchingRegion("דרום")?.slug).toBe("south-shfela");
    expect(matchingRegion("אשקלון דרום")?.slug).toBe("south-shfela");
    expect(matchingRegion("אפרת")?.slug).toBe("judea");
    expect(matchingRegion("תקוע")?.slug).toBe("judea");
    expect(matchingRegion("קריית ארבע")?.slug).toBe("judea");
    expect(matchingRegion("קרית ארבע")?.slug).toBe("judea");
    expect(matchingRegion("אריאל")?.slug).toBe("samaria");
    expect(matchingRegion("עפרה")?.slug).toBe("samaria");
    expect(matchingRegion("קרני שומרון")?.slug).toBe("samaria");
    expect(matchingRegion("בית אל")?.slug).toBe("samaria");
    expect(matchingRegion("בית שמש")?.slug).toBe("south-shfela");
    expect(matchingRegion("קיסריה")?.slug).toBe("sharon-coast");
    expect(matchingRegion("זכרון יעקב")?.slug).toBe("sharon-coast");
    expect(matchingRegion("אפק")).toBeUndefined();
    expect(matchingRegion("ירושלים גוש עציון")?.slug).toBe("jerusalem");
    expect(matchingRegion("תל אביב הרצליה")?.slug).toBe("tel-aviv");
    expect(matchingRegion("שומרון נתניה")?.slug).toBe("samaria");
    expect(getRegionBySlug("judea-samaria")).toBeUndefined();
    expect(matchingRegion(null)).toBeUndefined();
    expect(matchingRegion("   ")).toBeUndefined();
    expect(getRegionBySlug("nope")).toBeUndefined();
  });

  it("builds ItemList and BreadcrumbList JSON-LD without raw <", () => {
    const data = regionPageJsonLd({
      title: "נקודות שקיעה בתל אביב–יפו",
      description: "תיאור",
      path: "/regions/tel-aviv",
      spots: [
        {
          id: "spot-1",
          name: "חוף <script>",
          description: "",
          lat: 32,
          lng: 34,
          region: "תל אביב",
          photoUrl: null,
          photoCount: 0,
          createdAt: "2026-10-01T00:00:00.000Z",
        },
      ],
    }) as unknown as {
      "@graph": { "@type": string; itemListElement?: { url?: string; name?: string }[] }[];
    };

    const types = data["@graph"].map((node) => node["@type"]);
    expect(types).toEqual(["ItemList", "BreadcrumbList"]);
    const list = data["@graph"][0];
    expect(list.itemListElement?.[0]?.name).toBe("חוף <script>");
    expect(list.itemListElement?.[0]?.url).toContain("/spots/spot-1");
    const serialized = jsonLdString(data);
    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c");
    expect(serialized).not.toContain("localhost");
  });

  it("omits ItemList when the spot query failed", () => {
    const data = regionPageJsonLd({
      title: "נקודות שקיעה בירושלים",
      description: "תיאור",
      path: "/regions/jerusalem",
      spots: null,
    }) as unknown as { "@graph": { "@type": string }[] };

    expect(data["@graph"].map((node) => node["@type"])).toEqual(["BreadcrumbList"]);
  });
});
