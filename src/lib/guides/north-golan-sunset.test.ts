import { describe, expect, it } from "vitest";
import {
  BEFORE_PARAGRAPHS,
  CLOSING_AFTER,
  CLOSING_BEFORE,
  NORTH_GOLAN_SUNSET_FAQS,
  NORTH_GOLAN_SUNSET_GUIDE,
  NORTH_GOLAN_SUNSET_PLACES,
  START_PARAGRAPHS,
  START_REGION_AFTER,
  START_REGION_BEFORE,
} from "@/lib/guides/north-golan-sunset";
import { getRegionBySlug } from "@/lib/regions";
import { absoluteUrl, guideArticleJsonLd, jsonLdString } from "@/lib/seo";

const DRAFT_NOTES = [
  "טיוטה לאישור",
  "כותרת מוצעת",
  "נתיב מוצע",
  "תיאור מטא",
  "הצעת נתונים מובנים",
  "הערות לבנימין",
  "/regions/golan",
];

describe("north and golan sunset guide", () => {
  it("uses the approved title, description, and Haifa and North region", () => {
    expect(NORTH_GOLAN_SUNSET_GUIDE.path).toBe("/guides/north-golan-sunset");
    expect(NORTH_GOLAN_SUNSET_GUIDE.title).toBe(
      "איפה לראות שקיעה בצפון ובגולן: מהים בחיפה ועד הכנרת",
    );
    expect(NORTH_GOLAN_SUNSET_GUIDE.description).toBe(
      "מחפשים שקיעה בצפון ובגולן? תצפיות בחיפה, בגליל ובכנרת, עם קישורים לנקודות, מידע על חניה ונגישות והסתייגויות שחשוב להכיר לפני שיוצאים.",
    );
    expect(NORTH_GOLAN_SUNSET_GUIDE.description.length).toBeLessThanOrEqual(160);
    expect(NORTH_GOLAN_SUNSET_GUIDE.regionPath).toBe("/regions/haifa-north");
    expect(getRegionBySlug(NORTH_GOLAN_SUNSET_GUIDE.regionSlug)?.slug).toBe("haifa-north");
    expect(NORTH_GOLAN_SUNSET_GUIDE.addSpotPath).toBe("/spots/new");
    expect(NORTH_GOLAN_SUNSET_GUIDE.datePublished).toBe("2026-11-08");
    expect(NORTH_GOLAN_SUNSET_GUIDE.dateModified).toBe("2026-11-08");
  });

  it("links the seven approved spots and leaves draft notes out of the copy", () => {
    expect(NORTH_GOLAN_SUNSET_PLACES.map((place) => place.path)).toEqual([
      "/spots/cmtajdt7p0001ky04pox5p0c4",
      "/spots/cmw26384x0001l3089z8n5ucd",
      "/spots/cmulk5siq0001l804b5qkcbzz",
      "/spots/cmukzlf8v0001l504bj3reujw",
      "/spots/cmrw0xspi0004v3w0jrlv239l",
      "/spots/cmrw0xspi0003v3w0r5x8qsfd",
      "/spots/cmw409fqv0001l208wa4a5m28",
    ]);
    expect(NORTH_GOLAN_SUNSET_PLACES.map((place) => place.name)).toEqual([
      "תצפית סטלה מאריס",
      "תצפית כנרת מנדל",
      "חוף סוסיתא",
      "מצפור גיא",
      "חוף אכזיב",
      "טיילת בת גלים",
      "גמלא",
    ]);

    const copy = [
      NORTH_GOLAN_SUNSET_GUIDE.title,
      NORTH_GOLAN_SUNSET_GUIDE.description,
      ...START_PARAGRAPHS,
      START_REGION_BEFORE,
      NORTH_GOLAN_SUNSET_GUIDE.regionLinkLabel,
      START_REGION_AFTER,
      ...BEFORE_PARAGRAPHS,
      ...NORTH_GOLAN_SUNSET_PLACES.flatMap((place) => [
        place.heading,
        place.linkLabel,
        ...place.facts.map((fact) => `${fact.label}: ${fact.text}`),
      ]),
      ...NORTH_GOLAN_SUNSET_FAQS.flatMap((faq) => [faq.question, faq.answer]),
      CLOSING_BEFORE,
      NORTH_GOLAN_SUNSET_GUIDE.addSpotLabel,
      CLOSING_AFTER,
    ].join("\n");

    for (const note of DRAFT_NOTES) {
      expect(copy, note).not.toContain(note);
    }
    expect(copy).not.toContain("[לא מאומת]");
  });

  it("builds Article and FAQPage JSON-LD that matches the visible FAQ", () => {
    const data = guideArticleJsonLd({
      title: NORTH_GOLAN_SUNSET_GUIDE.title,
      description: NORTH_GOLAN_SUNSET_GUIDE.description,
      path: NORTH_GOLAN_SUNSET_GUIDE.path,
      datePublished: NORTH_GOLAN_SUNSET_GUIDE.datePublished,
      dateModified: NORTH_GOLAN_SUNSET_GUIDE.dateModified,
      regionName: NORTH_GOLAN_SUNSET_GUIDE.regionName,
      regionPath: NORTH_GOLAN_SUNSET_GUIDE.regionPath,
      places: NORTH_GOLAN_SUNSET_PLACES,
      faqs: NORTH_GOLAN_SUNSET_FAQS,
    }) as {
      "@graph": {
        "@type": string;
        "@id"?: string;
        headline?: string;
        description?: string;
        datePublished?: string;
        dateModified?: string;
        image?: { url: string };
        mainEntity?: { name: string; acceptedAnswer: { text: string } }[];
        numberOfItems?: number;
        itemListElement?: {
          name?: string;
          item?: { "@type": string; name: string; url: string } | string;
          url?: string;
        }[];
      }[];
    };

    expect(data["@graph"].map((node) => node["@type"])).toEqual([
      "Article",
      "FAQPage",
      "ItemList",
      "BreadcrumbList",
    ]);

    const article = data["@graph"][0];
    expect(article?.headline).toBe(NORTH_GOLAN_SUNSET_GUIDE.title);
    expect(article?.description).toBe(NORTH_GOLAN_SUNSET_GUIDE.description);
    expect(article?.["@id"]).toBe(absoluteUrl(`${NORTH_GOLAN_SUNSET_GUIDE.path}#article`));
    expect(article?.datePublished).toBe("2026-11-08");
    expect(article?.dateModified).toBe("2026-11-08");
    expect(article?.image?.url).toBe(
      absoluteUrl(`${NORTH_GOLAN_SUNSET_GUIDE.path}/opengraph-image`),
    );
    expect(article?.image?.url).not.toContain("localhost");

    const faq = data["@graph"][1];
    expect(faq?.["@id"]).toBe(absoluteUrl(`${NORTH_GOLAN_SUNSET_GUIDE.path}#faq`));
    expect(faq?.mainEntity?.map((item) => item.name)).toEqual(
      NORTH_GOLAN_SUNSET_FAQS.map((item) => item.question),
    );
    expect(faq?.mainEntity?.map((item) => item.acceptedAnswer.text)).toEqual(
      NORTH_GOLAN_SUNSET_FAQS.map((item) => item.answer),
    );

    const list = data["@graph"][2];
    expect(list?.numberOfItems).toBe(7);
    list?.itemListElement?.forEach((entry, index) => {
      const place = NORTH_GOLAN_SUNSET_PLACES[index];
      expect(entry.item).toMatchObject({
        "@type": "Place",
        name: place?.name,
      });
      expect(entry.url).toContain(place?.path);
      expect(entry.url).not.toContain("localhost");
    });

    const crumbs = data["@graph"][3]?.itemListElement ?? [];
    expect(crumbs.map((crumb) => crumb.name)).toEqual([
      "After the Sun",
      NORTH_GOLAN_SUNSET_GUIDE.regionName,
      NORTH_GOLAN_SUNSET_GUIDE.title,
    ]);
    expect(crumbs[1]?.item).toBe(absoluteUrl("/regions/haifa-north"));

    const serialized = jsonLdString(data);
    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain("localhost");
    expect(serialized).not.toContain("/regions/golan");
  });
});
