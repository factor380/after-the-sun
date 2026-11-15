import { describe, expect, it } from "vitest";
import { jsonLdString, spotFaqJsonLd, spotJsonLd } from "@/lib/seo";
import { faqAnswerSegments, spotFaq } from "@/lib/spot-faq";

const NAME = "מצפה חרובים";

describe("spotFaq", () => {
  it("answers parking, accessibility, and a matched region", () => {
    expect(
      spotFaq({
        name: NAME,
        parking: "yes",
        parkingNote: "  חניון\nליד הכניסה  ",
        accessibility: "partial",
        accessibilityNote: "יש מדרגה אחת",
        region: "הרי הגלבוע",
      }),
    ).toEqual([
      {
        question: "איפה חונים במצפה חרובים?",
        answer: "במצפה חרובים יש חניה. חניון ליד הכניסה",
      },
      {
        question: "מה הנגישות במצפה חרובים?",
        answer: "במצפה חרובים נגיש חלקית. יש מדרגה אחת",
      },
      {
        question: "איפה נמצאת הנקודה מצפה חרובים?",
        answer: "האזור שסומן: הרי הגלבוע. הנקודה מופיעה בעמוד האזור חיפה והצפון.",
        regionLink: { href: "/regions/haifa-north", name: "חיפה והצפון" },
      },
    ]);
  });

  it("covers paid parking, no access, and a region with no page", () => {
    const items = spotFaq({
      name: "יער יתיר",
      parking: "paid",
      accessibility: "no",
      region: "אפק",
    });

    expect(items).toEqual([
      { question: "איפה חונים ביער יתיר?", answer: "ביער יתיר חניה בתשלום." },
      { question: "מה הנגישות ביער יתיר?", answer: "ביער יתיר לא נגיש." },
      { question: "איפה נמצאת הנקודה יער יתיר?", answer: "האזור שסומן: אפק." },
    ]);
    expect(items[2]?.regionLink).toBeUndefined();
    expect(items[2]?.answer).not.toContain("/regions/");
    expect(items[2]?.answer).not.toContain("http");
  });

  it("skips the region sentence when the label is the spot name", () => {
    const items = spotFaq({ name: "יער יתיר", region: "יער יתיר" });

    expect(items).toEqual([
      {
        question: "איפה נמצאת הנקודה יער יתיר?",
        answer: "הנקודה מופיעה בעמוד האזור הדרום והשפלה.",
        regionLink: { href: "/regions/south-shfela", name: "הדרום והשפלה" },
      },
    ]);
    expect(items[0]?.answer.startsWith("האזור שסומן")).toBe(false);
  });

  it("keeps a note when the choice itself is missing", () => {
    expect(
      spotFaq({
        name: "עכו",
        parkingNote: "ברחוב הסמוך",
        accessibility: "yes",
      }),
    ).toEqual([
      { question: "איפה חונים בעכו?", answer: "בעכו: ברחוב הסמוך" },
      { question: "מה הנגישות בעכו?", answer: "בעכו נגיש." },
    ]);
  });

  it("includes a no-parking answer without a note", () => {
    const items = spotFaq({ name: "תצפית בגמזו", parking: "no", region: "מרכז" });

    expect(items).toEqual([
      { question: "איפה חונים בתצפית בגמזו?", answer: "בתצפית בגמזו אין חניה במקום." },
      {
        question: "איפה נמצאת הנקודה תצפית בגמזו?",
        answer: "האזור שסומן: מרכז. הנקודה מופיעה בעמוד האזור הדרום והשפלה.",
        regionLink: { href: "/regions/south-shfela", name: "הדרום והשפלה" },
      },
    ]);
    const segments = faqAnswerSegments(items[1]!);
    expect(segments.map((segment) => segment.text).join("")).toBe(items[1]?.answer);
    expect(segments.filter((segment) => segment.href)).toEqual([
      { text: "הדרום והשפלה", href: "/regions/south-shfela" },
    ]);
  });

  it("returns nothing when no field is set", () => {
    expect(
      spotFaq({
        name: "גבעת אברנם הנקין",
        parking: null,
        parkingNote: null,
        accessibility: null,
        accessibilityNote: null,
        region: null,
      }),
    ).toEqual([]);
    expect(spotFaq({ name: "גבעת אברנם הנקין" })).toEqual([]);
    expect(
      spotFaq({
        name: "גבעת אברנם הנקין",
        parking: "   ",
        parkingNote: "  ",
        accessibility: "maybe",
        accessibilityNote: "",
        region: "   ",
      }),
    ).toEqual([]);
  });
});

describe("spotFaqJsonLd", () => {
  it("builds a FAQPage whose answers match the visible FAQ text", () => {
    const items = spotFaq({
      name: "נמל יפו",
      parking: "yes",
      parkingNote: "חניה ליד הנמל",
      accessibility: "partial",
      accessibilityNote: "שביל <script>",
      region: "תל אביב–יפו",
    });
    const data = spotFaqJsonLd("נמל יפו", items) as {
      "@context": string;
      "@type": string;
      name: string;
      mainEntity: {
        "@type": string;
        name: string;
        acceptedAnswer: { "@type": string; text: string };
      }[];
    };

    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("FAQPage");
    expect(data.name).toBe("נמל יפו");
    expect(data.mainEntity).toHaveLength(items.length);
    expect(data.mainEntity.map((item) => item["@type"])).toEqual([
      "Question",
      "Question",
      "Question",
    ]);
    expect(data.mainEntity.map((item) => item.name)).toEqual(
      items.map((item) => item.question),
    );
    expect(data.mainEntity.map((item) => item.acceptedAnswer["@type"])).toEqual([
      "Answer",
      "Answer",
      "Answer",
    ]);
    expect(data.mainEntity.map((item) => item.acceptedAnswer.text)).toEqual(
      items.map((item) => item.answer),
    );
    const location = items.find((item) => item.regionLink);
    expect(location?.regionLink).toEqual({
      href: "/regions/tel-aviv",
      name: "תל אביב–יפו",
    });
    const segments = faqAnswerSegments(location!);
    expect(segments.map((segment) => segment.text).join("")).toBe(location?.answer);
    expect(segments[0]?.text).toContain("האזור שסומן: תל אביב–יפו");
    expect(segments[0]?.href).toBeUndefined();
    expect(segments.filter((segment) => segment.href)).toEqual([
      { text: "תל אביב–יפו", href: "/regions/tel-aviv" },
    ]);

    const serialized = jsonLdString(data);
    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c");
    expect(serialized).not.toContain("localhost");
    expect(serialized).not.toContain("/regions/");

    const attraction = spotJsonLd({
      id: "spot-1",
      name: "נמל יפו",
      description: "שקיעה",
      region: "תל אביב–יפו",
      lat: 32,
      lng: 34,
      photoUrl: null,
      parking: "yes",
      accessibility: "partial",
    }) as { "@graph": { "@type": string }[] };
    expect(attraction["@graph"].map((node) => node["@type"])).toEqual([
      "TouristAttraction",
      "BreadcrumbList",
    ]);
  });

  it("still has an empty mainEntity when nothing applies", () => {
    const data = spotFaqJsonLd("נקודה בלי פרטים", []) as { mainEntity: unknown[] };
    expect(data.mainEntity).toEqual([]);
  });
});
