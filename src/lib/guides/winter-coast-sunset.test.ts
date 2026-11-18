import { describe, expect, it } from "vitest";
import {
  BEFORE_PARAGRAPHS,
  CLOSING_AFTER,
  CLOSING_BEFORE,
  START_PARAGRAPHS,
  START_REGIONS_AFTER,
  START_REGIONS_BEFORE,
  WINTER_COAST_REGIONS,
  WINTER_COAST_SUNSET_FAQS,
  WINTER_COAST_SUNSET_GUIDE,
  WINTER_COAST_SUNSET_PLACES,
} from "@/lib/guides/winter-coast-sunset";
import { getRegionBySlug } from "@/lib/regions";
import { absoluteUrl, guideArticleJsonLd, jsonLdString } from "@/lib/seo";

const DRAFT_NOTES = [
  "טיוטה לאישור",
  "כותרת מוצעת",
  "נתיב מוצע",
  "תיאור מטא",
  "הצעת נתונים מובנים",
  "הערות לבנימין",
  "זו טיוטה בלבד",
];

describe("winter coast sunset guide", () => {
  it("uses the approved title, description, and coast regions", () => {
    expect(WINTER_COAST_SUNSET_GUIDE.path).toBe("/guides/winter-coast-sunset");
    expect(WINTER_COAST_SUNSET_GUIDE.title).toBe(
      "שקיעות חורף על הים: איפה לראות שקיעה בחוף הים בחורף",
    );
    expect(WINTER_COAST_SUNSET_GUIDE.description).toBe(
      "מחפשים שקיעה בחוף הים בחורף? חופים וטיילות מיפו עד אכזיב, עם שעת שקיעה מוקדמת, קישורים לנקודות ומידע על חניה ונגישות.",
    );
    expect(WINTER_COAST_SUNSET_GUIDE.description.length).toBeLessThanOrEqual(160);
    expect(WINTER_COAST_SUNSET_GUIDE.regionPath).toBe("/regions/tel-aviv");
    expect(WINTER_COAST_SUNSET_GUIDE.regionName).toBe(getRegionBySlug("tel-aviv")?.name);
    expect(WINTER_COAST_SUNSET_GUIDE.regionSlugs).toEqual([
      "tel-aviv",
      "sharon-coast",
      "haifa-north",
      "south-shfela",
    ]);
    expect(WINTER_COAST_REGIONS.map((region) => region.slug)).toEqual([
      ...WINTER_COAST_SUNSET_GUIDE.regionSlugs,
    ]);
    for (const region of WINTER_COAST_REGIONS) {
      expect(getRegionBySlug(region.slug)?.slug).toBe(region.slug);
      expect(region.path).toBe(`/regions/${region.slug}`);
    }
    expect(WINTER_COAST_SUNSET_GUIDE.addSpotPath).toBe("/spots/new");
    expect(WINTER_COAST_SUNSET_GUIDE.datePublished).toBe("2026-11-17");
    expect(WINTER_COAST_SUNSET_GUIDE.dateModified).toBe("2026-11-17");
  });

  it("links the twelve approved spots and leaves draft notes out of the copy", () => {
    expect(WINTER_COAST_SUNSET_PLACES.map((place) => place.path)).toEqual([
      "/spots/cmrw0xspi0004v3w0jrlv239l",
      "/spots/cmrw0xspi0003v3w0r5x8qsfd",
      "/spots/cmrw0xspi0002v3w0y9gcz6oz",
      "/spots/cmrw0xspi0005v3w0d03edxoi",
      "/spots/cmuq28jeb0001la049t20g6l4",
      "/spots/cmuvfmzwm0001kz04jzgawy6w",
      "/spots/cmuvg4u0i0001lf04pjwyyizt",
      "/spots/cmrw0xspi0001v3w0154giub8",
      "/spots/cmrw0xspi0000v3w0xcs3qn42",
      "/spots/cmuf9k8gd0003gq04zwfc3zem",
      "/spots/cmrw0xspi0009v3w0rlsyhstp",
      "/spots/cmtj27v2o0001l10499h38efk",
    ]);
    expect(WINTER_COAST_SUNSET_PLACES.map((place) => place.name)).toEqual([
      "חוף אכזיב",
      "טיילת בת גלים",
      "חוף אמת המים בקיסריה",
      "טיילת המצוק נתניה",
      "טיילת ניצה",
      "מרינה הרצליה",
      "חוף הילטון",
      "חוף גורדון",
      "נמל יפו",
      "טיילת אשקלון",
      "מרינה אשקלון",
      "טיילת אילת",
    ]);

    const copy = [
      WINTER_COAST_SUNSET_GUIDE.title,
      WINTER_COAST_SUNSET_GUIDE.description,
      ...START_PARAGRAPHS,
      START_REGIONS_BEFORE,
      ...WINTER_COAST_REGIONS.map((region) => region.label),
      START_REGIONS_AFTER,
      ...BEFORE_PARAGRAPHS,
      ...WINTER_COAST_SUNSET_PLACES.flatMap((place) => [
        place.heading,
        place.linkLabel,
        place.lead ?? "",
        ...place.facts.map((fact) => `${fact.label}: ${fact.text}`),
      ]),
      ...WINTER_COAST_SUNSET_FAQS.flatMap((faq) => [faq.question, faq.answer]),
      CLOSING_BEFORE,
      WINTER_COAST_SUNSET_GUIDE.addSpotLabel,
      CLOSING_AFTER,
    ].join("\n");

    for (const note of DRAFT_NOTES) {
      expect(copy, note).not.toContain(note);
    }
    expect(copy).not.toContain("[לא מאומת]");
    expect(copy).not.toContain("schema.org");
  });

  it("builds Article and FAQPage JSON-LD that matches the visible FAQ", () => {
    const data = guideArticleJsonLd({
      title: WINTER_COAST_SUNSET_GUIDE.title,
      description: WINTER_COAST_SUNSET_GUIDE.description,
      path: WINTER_COAST_SUNSET_GUIDE.path,
      datePublished: WINTER_COAST_SUNSET_GUIDE.datePublished,
      dateModified: WINTER_COAST_SUNSET_GUIDE.dateModified,
      regionName: WINTER_COAST_SUNSET_GUIDE.regionName,
      regionPath: WINTER_COAST_SUNSET_GUIDE.regionPath,
      places: WINTER_COAST_SUNSET_PLACES,
      faqs: WINTER_COAST_SUNSET_FAQS,
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
    expect(article?.headline).toBe(WINTER_COAST_SUNSET_GUIDE.title);
    expect(article?.description).toBe(WINTER_COAST_SUNSET_GUIDE.description);
    expect(article?.["@id"]).toBe(absoluteUrl(`${WINTER_COAST_SUNSET_GUIDE.path}#article`));
    expect(article?.datePublished).toBe("2026-11-17");
    expect(article?.dateModified).toBe("2026-11-17");
    expect(article?.image?.url).toBe(
      absoluteUrl(`${WINTER_COAST_SUNSET_GUIDE.path}/opengraph-image`),
    );
    expect(article?.image?.url).not.toContain("localhost");

    const faq = data["@graph"][1];
    expect(faq?.["@id"]).toBe(absoluteUrl(`${WINTER_COAST_SUNSET_GUIDE.path}#faq`));
    expect(faq?.mainEntity?.map((item) => item.name)).toEqual(
      WINTER_COAST_SUNSET_FAQS.map((item) => item.question),
    );
    expect(faq?.mainEntity?.map((item) => item.acceptedAnswer.text)).toEqual(
      WINTER_COAST_SUNSET_FAQS.map((item) => item.answer),
    );

    const list = data["@graph"][2];
    expect(list?.numberOfItems).toBe(12);
    list?.itemListElement?.forEach((entry, index) => {
      const place = WINTER_COAST_SUNSET_PLACES[index];
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
      WINTER_COAST_SUNSET_GUIDE.regionName,
      WINTER_COAST_SUNSET_GUIDE.title,
    ]);
    expect(crumbs[1]?.item).toBe(absoluteUrl("/regions/tel-aviv"));

    const serialized = jsonLdString(data);
    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain("localhost");
  });
});
