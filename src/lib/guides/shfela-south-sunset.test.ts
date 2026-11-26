import { describe, expect, it } from "vitest";
import {
  ASHKELON_NOTE,
  BEFORE_PARAGRAPHS,
  CLOSING_AFTER,
  CLOSING_BEFORE,
  SHFELA_SOUTH_SUNSET_FAQS,
  SHFELA_SOUTH_SUNSET_GUIDE,
  SHFELA_SOUTH_SUNSET_PLACES,
  START_PARAGRAPHS,
  type CopyPart,
} from "@/lib/guides/shfela-south-sunset";
import { getRegionBySlug } from "@/lib/regions";
import { absoluteUrl, guideArticleJsonLd, jsonLdString } from "@/lib/seo";
import { spotPublicPath, spotSlugFromName } from "@/lib/spot-slug";

const DRAFT_NOTES = [
  "טיוטה לאישור",
  "כותרת מוצעת",
  "נתיב מוצע",
  "תיאור מטא",
  "הצעת נתונים מובנים",
  "הערות לבנימין",
  "מה שנפתר",
  "שדות שעדיין לא ידועים",
  "זו טיוטה בלבד",
  "לא מאומת",
  "schema.org",
];

/** Published slugs from the spot-slug backfill. The guide must use these, not old ids. */
const PUBLISHED_SLUGS: Readonly<Record<string, string>> = {
  "תצפית בגמזו": "tatzpit-be-gimzo",
  "גבעות מרר": "gvaot-merar",
  "חוף פלמחים": "hof-palmachim",
  "טיילת ומאגר במרכז שפירא": "tayelet-ve-maagar-be-merkaz-shapira",
  "גבעת אברהם הנקין": "givat-avraham-hanakin",
  "אנדרטת אוגדת הפלדה": "andartat-ugdat-ha-plada",
  "יער יתיר": "yaar-yatir",
  "תצפית בערד ברובע האמנים": "tatzpit-be-arad-be-rova-ha-omanim",
  "כפר סטודנטים בדימונה": "kfar-studentim-be-dimona",
  "שדה בוקר": "sde-boker",
  "טיילת אשקלון": "tayelet-ashkelon",
  "מרינה אשקלון": "marina-ashkelon",
};

function copyText(parts: readonly CopyPart[]): string {
  return parts.map((part) => (typeof part === "string" ? part : part.label)).join("");
}

function linkHrefs(parts: readonly CopyPart[]): string[] {
  return parts.flatMap((part) => (typeof part === "string" ? [] : [part.href]));
}

describe("shfela south sunset guide", () => {
  it("uses the approved title, description, and the south and Shfela region", () => {
    expect(SHFELA_SOUTH_SUNSET_GUIDE.path).toBe("/guides/shfela-south-sunset");
    expect(SHFELA_SOUTH_SUNSET_GUIDE.title).toBe(
      "איפה לראות שקיעה בדרום ובשפלה: מתצפיות בשפלה עד הנגב",
    );
    expect(SHFELA_SOUTH_SUNSET_GUIDE.title.startsWith("טיוטה")).toBe(false);
    expect(SHFELA_SOUTH_SUNSET_GUIDE.description).toBe(
      "מחפשים שקיעה בדרום ובשפלה? תצפיות מגמזו וגבעות מרר עד ערד ושדה בוקר, עם קישורים לנקודות ומידע על חניה ונגישות.",
    );
    expect(SHFELA_SOUTH_SUNSET_GUIDE.description.length).toBeLessThanOrEqual(160);
    expect(SHFELA_SOUTH_SUNSET_GUIDE.regionPath).toBe("/regions/south-shfela");
    expect(SHFELA_SOUTH_SUNSET_GUIDE.regionName).toBe(getRegionBySlug("south-shfela")?.name);
    expect(SHFELA_SOUTH_SUNSET_GUIDE.regionSlug).toBe("south-shfela");
    expect(SHFELA_SOUTH_SUNSET_GUIDE.regionLinkLabel).toBe("עמוד הדרום והשפלה");
    expect(SHFELA_SOUTH_SUNSET_GUIDE.addSpotPath).toBe("/spots/new");
    expect(SHFELA_SOUTH_SUNSET_GUIDE.winterGuidePath).toBe("/guides/winter-coast-sunset");
    expect(SHFELA_SOUTH_SUNSET_GUIDE.datePublished).toBe("2026-11-26");
    expect(SHFELA_SOUTH_SUNSET_GUIDE.dateModified).toBe("2026-11-26");
  });

  it("keeps the draft wording and links each spot to its published slug", () => {
    expect(START_PARAGRAPHS.map(copyText)).toEqual([
      "לשקיעה בשפלה אפשר להתחיל בתצפית בגמזו, ליד מודיעין, או בגבעות מרר, בין רחובות לגדרה. בדרום אפשר לבחור בתצפית בערד ברובע האמנים או בתצפית בשדה בוקר, מול המדבר הפתוח. אם אתם מחפשים עצירה קרובה יותר לחוף באזור הזה, חוף פלמחים מופיע במפה, וגם טיילת ומאגר במרכז שפירא.",
      "בהמשך תמצאו גם את גבעת אברהם הנקין, אנדרטת אוגדת הפלדה, יער יתיר וכפר הסטודנטים בדימונה.",
      "באשקלון יש גם טיילת ומרינה. שתיהן כבר מופיעות במדריך שקיעות חורף על הים, ולכן כאן הן מוזכרות רק בקצרה.",
      "אלה נקודות שמופיעות במפה הקהילתית שלנו, לא דירוג שנקבע בבדיקת שטח. פרטי החניה והנגישות כאן לקוחים מעמודי הנקודות, ומאימות שנמסר למדריך. הם אינם מחליפים בדיקה במקום לפני היציאה. כל הנקודות מופיעות בעמוד הדרום והשפלה.",
    ]);
    expect(ASHKELON_NOTE.paragraphs.map(copyText)).toEqual([
      "מי שממשיך דרומה לאורך החוף יכול לעצור גם בטיילת אשקלון או במרינה אשקלון. שתי הנקודות כבר מופיעות במדריך שקיעות חורף על הים, עם פירוט על הגעה, חניה ונגישות. לכן הן לא חוזרות כאן כפרקים מלאים.",
    ]);
    expect(`${CLOSING_BEFORE}${SHFELA_SOUTH_SUNSET_GUIDE.addSpotLabel}${CLOSING_AFTER}`).toBe(
      "הנקודה הכי טובה היא לפעמים זו שמישהו מקומי מוכן לחלוק. אם יש לכם מקום אהוב לשקיעה בשפלה או בדרום, הוסיפו אותו למפה. כתבו איפה חונים, איך מגיעים, מה מצב הנגישות והאם יש שער או שעת סגירה. הפרטים הקטנים האלה עוזרים לאחרים לצאת לדרך עם פחות ניחושים.",
    );

    expect(SHFELA_SOUTH_SUNSET_PLACES.map((place) => place.name)).toEqual([
      "תצפית בגמזו",
      "גבעות מרר",
      "חוף פלמחים",
      "טיילת ומאגר במרכז שפירא",
      "גבעת אברהם הנקין",
      "אנדרטת אוגדת הפלדה",
      "יער יתיר",
      "תצפית בערד ברובע האמנים",
      "כפר סטודנטים בדימונה",
      "שדה בוקר",
    ]);
    expect(SHFELA_SOUTH_SUNSET_PLACES.map((place) => place.heading)).toEqual([
      "תצפית בגמזו: מבט על המרכז והשפלה",
      "גבעות מרר: תצפית קצרה בין רחובות לגדרה",
      "חוף פלמחים: שקיעה על החוף באזור השפלה",
      "טיילת ומאגר במרכז שפירא: מול הנחל והיישוב",
      "גבעת אברהם הנקין: גבעה עם נדנדה",
      "אנדרטת אוגדת הפלדה: מבט לחבל עזה ולנגב",
      "יער יתיר: נקודה במסלול, לא עצירה ליד הרכב",
      "תצפית בערד ברובע האמנים: גבעות ונוף מדברי",
      "כפר סטודנטים בדימונה: גבעה מעל העיר",
      "תצפית בשדה בוקר: מבט אל המדבר הפתוח",
    ]);

    for (const place of SHFELA_SOUTH_SUNSET_PLACES) {
      const slug = PUBLISHED_SLUGS[place.name];
      expect(slug, place.name).toBeTruthy();
      expect(place.path).toBe(`/spots/${slug}`);
      expect(place.path).toBe(spotPublicPath(spotSlugFromName(place.name)));
      expect(place.path).not.toMatch(/^\/spots\/cm/);
    }

    const linked = [
      ...START_PARAGRAPHS.flatMap(linkHrefs),
      ...ASHKELON_NOTE.paragraphs.flatMap(linkHrefs),
    ];
    expect(linked).toContain("/regions/south-shfela");
    expect(linked).toContain("/guides/winter-coast-sunset");
    expect(linked).toContain("/spots/tayelet-ashkelon");
    expect(linked).toContain("/spots/marina-ashkelon");
    expect(linked).toContain("/spots/sde-boker");
    for (const place of SHFELA_SOUTH_SUNSET_PLACES) {
      expect(linked, place.name).toContain(place.path);
    }

    const copy = [
      SHFELA_SOUTH_SUNSET_GUIDE.title,
      SHFELA_SOUTH_SUNSET_GUIDE.description,
      ...START_PARAGRAPHS.map(copyText),
      ...BEFORE_PARAGRAPHS,
      ...SHFELA_SOUTH_SUNSET_PLACES.flatMap((place) => [
        place.heading,
        place.linkLabel,
        ...place.facts.map((fact) => `${fact.label}: ${fact.text}`),
      ]),
      ASHKELON_NOTE.heading,
      ...ASHKELON_NOTE.paragraphs.map(copyText),
      ...SHFELA_SOUTH_SUNSET_FAQS.flatMap((faq) => [faq.question, faq.answer]),
      CLOSING_BEFORE,
      SHFELA_SOUTH_SUNSET_GUIDE.addSpotLabel,
      CLOSING_AFTER,
    ].join("\n");

    for (const note of DRAFT_NOTES) {
      expect(copy, note).not.toContain(note);
    }
    expect(copy).not.toContain("בנימין");
    expect(copy).not.toContain("cmvu16q2g");
    expect(copy).not.toContain("drafts/");
  });

  it("builds Article and FAQPage JSON-LD that matches the visible FAQ", () => {
    const data = guideArticleJsonLd({
      title: SHFELA_SOUTH_SUNSET_GUIDE.title,
      description: SHFELA_SOUTH_SUNSET_GUIDE.description,
      path: SHFELA_SOUTH_SUNSET_GUIDE.path,
      datePublished: SHFELA_SOUTH_SUNSET_GUIDE.datePublished,
      dateModified: SHFELA_SOUTH_SUNSET_GUIDE.dateModified,
      regionName: SHFELA_SOUTH_SUNSET_GUIDE.regionName,
      regionPath: SHFELA_SOUTH_SUNSET_GUIDE.regionPath,
      places: SHFELA_SOUTH_SUNSET_PLACES,
      faqs: SHFELA_SOUTH_SUNSET_FAQS,
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
    expect(article?.headline).toBe(SHFELA_SOUTH_SUNSET_GUIDE.title);
    expect(article?.description).toBe(SHFELA_SOUTH_SUNSET_GUIDE.description);
    expect(article?.["@id"]).toBe(absoluteUrl(`${SHFELA_SOUTH_SUNSET_GUIDE.path}#article`));
    expect(article?.datePublished).toBe("2026-11-26");
    expect(article?.dateModified).toBe("2026-11-26");
    expect(article?.image?.url).toBe(
      absoluteUrl(`${SHFELA_SOUTH_SUNSET_GUIDE.path}/opengraph-image`),
    );
    expect(article?.image?.url).not.toContain("localhost");

    const faq = data["@graph"][1];
    expect(faq?.["@id"]).toBe(absoluteUrl(`${SHFELA_SOUTH_SUNSET_GUIDE.path}#faq`));
    expect(faq?.mainEntity?.map((item) => item.name)).toEqual(
      SHFELA_SOUTH_SUNSET_FAQS.map((item) => item.question),
    );
    expect(faq?.mainEntity?.map((item) => item.acceptedAnswer.text)).toEqual(
      SHFELA_SOUTH_SUNSET_FAQS.map((item) => item.answer),
    );

    const list = data["@graph"][2];
    expect(list?.numberOfItems).toBe(10);
    list?.itemListElement?.forEach((entry, index) => {
      const place = SHFELA_SOUTH_SUNSET_PLACES[index];
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
      SHFELA_SOUTH_SUNSET_GUIDE.regionName,
      SHFELA_SOUTH_SUNSET_GUIDE.title,
    ]);
    expect(crumbs[1]?.item).toBe(absoluteUrl("/regions/south-shfela"));

    const serialized = jsonLdString(data);
    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain("localhost");
    expect(serialized).not.toContain("הערות לבנימין");
  });
});
