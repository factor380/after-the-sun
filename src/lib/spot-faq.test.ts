import { describe, expect, it } from "vitest";
import { jsonLdString, spotFaqJsonLd, spotJsonLd } from "@/lib/seo";
import { spotFaq } from "@/lib/spot-faq";

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
        answer: "יש חניה. חניון ליד הכניסה",
      },
      {
        question: "האם מצפה חרובים נגיש?",
        answer: "נגיש חלקית. יש מדרגה אחת",
      },
      {
        question: "איפה נמצא מצפה חרובים?",
        answer: "מצפה חרובים נמצא בהרי הגלבוע. עמוד האזור: חיפה והצפון.",
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
      { question: "איפה חונים ביער יתיר?", answer: "חניה בתשלום" },
      { question: "האם יער יתיר נגיש?", answer: "לא נגיש" },
      { question: "איפה נמצא יער יתיר?", answer: "יער יתיר נמצא באפק." },
    ]);
    expect(items[2]?.answer).not.toContain("/regions/");
    expect(items[2]?.answer).not.toContain("http");
  });

  it("keeps a note when the choice itself is missing", () => {
    expect(
      spotFaq({
        name: "עכו",
        parkingNote: "ברחוב הסמוך",
        accessibility: "yes",
      }),
    ).toEqual([
      { question: "איפה חונים בעכו?", answer: "ברחוב הסמוך" },
      { question: "האם עכו נגיש?", answer: "נגיש" },
    ]);
  });

  it("includes a no-parking answer without a note", () => {
    expect(spotFaq({ name: "תצפית בגמזו", parking: "no", region: "מרכז" })).toEqual([
      { question: "איפה חונים בתצפית בגמזו?", answer: "אין חניה במקום" },
      {
        question: "איפה נמצא תצפית בגמזו?",
        answer: "תצפית בגמזו נמצא במרכז. עמוד האזור: הדרום והשפלה.",
      },
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

    const serialized = jsonLdString(data);
    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c");
    expect(serialized).not.toContain("localhost");

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
