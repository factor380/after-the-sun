import { describe, expect, it } from "vitest";
import { jsonLdString, spotFaqJsonLd, spotJsonLd } from "@/lib/seo";
import { faqAnswerSegments, spotFaq, withHebrewPrefix } from "@/lib/spot-faq";

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
        answer: "במצפה חרובים יש חניה. חניון ליד הכניסה.",
      },
      {
        question: "מה הנגישות במצפה חרובים?",
        answer: "המקום נגיש חלקית. יש מדרגה אחת.",
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
      { question: "מה הנגישות ביער יתיר?", answer: "המקום אינו נגיש." },
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
    expect(items[0]?.answer).not.toContain("נמצא ביער יתיר");
    expect(items[0]?.answer).not.toContain("יער יתיר");

    const spaced = spotFaq({ name: "יער יתיר", region: "יער  יתיר" });
    expect(spaced[0]?.answer).toBe("הנקודה מופיעה בעמוד האזור הדרום והשפלה.");
    expect(spotFaq({ name: "אפק", region: "אפק" })).toEqual([]);
  });

  it("keeps a note when the choice itself is missing", () => {
    expect(
      spotFaq({
        name: "עכו",
        parkingNote: "ברחוב הסמוך",
        accessibility: "yes",
      }),
    ).toEqual([
      { question: "איפה חונים בעכו?", answer: "בעכו: ברחוב הסמוך." },
      { question: "מה הנגישות בעכו?", answer: "המקום נגיש." },
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

  it("contracts the definite article and leaves a radical ה in place", () => {
    expect(withHebrewPrefix("ב", "החרמון")).toBe("בחרמון");
    expect(withHebrewPrefix("ל", "החרמון")).toBe("לחרמון");
    expect(withHebrewPrefix("מ", "החרמון")).toBe("מהחרמון");
    expect(withHebrewPrefix("ב", "הגולן")).toBe("בגולן");
    expect(withHebrewPrefix("ל", "השרון")).toBe("לשרון");
    expect(withHebrewPrefix("מ", "הנגב")).toBe("מהנגב");
    expect(withHebrewPrefix("ב", "המרפסת של המדינה")).toBe("במרפסת של המדינה");
    expect(withHebrewPrefix("ל", "המרפסת של המדינה")).toBe("למרפסת של המדינה");
    expect(withHebrewPrefix("מ", "המרפסת של המדינה")).toBe("מהמרפסת של המדינה");

    expect(withHebrewPrefix("ב", "הר גילה")).toBe("בהר גילה");
    expect(withHebrewPrefix("ב", "הר הרצל")).toBe("בהר הרצל");
    expect(withHebrewPrefix("ל", "הר הרצל")).toBe("להר הרצל");
    expect(withHebrewPrefix("מ", "הר הרצל")).toBe("מהר הרצל");
    expect(withHebrewPrefix("ב", "הרצליה")).toBe("בהרצליה");
    expect(withHebrewPrefix("ל", "הרצלייה")).toBe("להרצלייה");
    expect(withHebrewPrefix("מ", "הרצליה")).toBe("מהרצליה");
    expect(withHebrewPrefix("ב", "הוד השרון")).toBe("בהוד השרון");
    expect(withHebrewPrefix("ב", "הרי יהודה")).toBe("בהרי יהודה");
    expect(withHebrewPrefix("ב", "גמלא")).toBe("בגמלא");
    expect(withHebrewPrefix("ב", "נמל יפו")).toBe("בנמל יפו");
    expect(withHebrewPrefix("ב", "הזוהר")).toBe("ב-הזוהר");
    expect(withHebrewPrefix("ל", "הזוהר")).toBe("ל-הזוהר");
    expect(withHebrewPrefix("מ", "הזוהר")).toBe("מהזוהר");

    const hermon = spotFaq({
      name: "החרמון",
      region: "גולן",
      parking: "yes",
      parkingNote: "האתר נסגר ב-16:00",
      accessibility: "yes",
    });
    expect(hermon.map((item) => item.question)).toEqual([
      "איפה חונים בחרמון?",
      "מה הנגישות בחרמון?",
      "איפה נמצאת הנקודה החרמון?",
    ]);
    expect(hermon.map((item) => item.answer)).toEqual([
      "בחרמון יש חניה. האתר נסגר ב-16:00.",
      "המקום נגיש.",
      "האזור שסומן: גולן. הנקודה מופיעה בעמוד האזור חיפה והצפון.",
    ]);
    expect(hermon.join(" ")).not.toContain("בהחרמון");

    expect(
      spotFaq({ name: "המרפסת של המדינה", parking: "yes" }).map((item) => item.question),
    ).toEqual(["איפה חונים במרפסת של המדינה?"]);
    expect(spotFaq({ name: "הר הרצל", parking: "yes" })[0]?.answer).toBe(
      "בהר הרצל יש חניה.",
    );
    expect(spotFaq({ name: "הרצליה", parking: "paid" })[0]?.answer).toBe(
      "בהרצליה חניה בתשלום.",
    );
  });

  it("phrases accessibility as a sentence about the place", () => {
    expect(spotFaq({ name: "גמלא", accessibility: "yes" })).toEqual([
      { question: "מה הנגישות בגמלא?", answer: "המקום נגיש." },
    ]);
    expect(spotFaq({ name: "נמל יפו", accessibility: "no" })).toEqual([
      { question: "מה הנגישות בנמל יפו?", answer: "המקום אינו נגיש." },
    ]);
    expect(
      spotFaq({
        name: "נמל יפו",
        accessibility: "partial",
        accessibilityNote: "שביל סלול עד הרציף",
      })[0]?.answer,
    ).toBe("המקום נגיש חלקית. שביל סלול עד הרציף.");
  });

  it("ends notes with one terminal mark and drops a repeated sentence", () => {
    expect(
      spotFaq({
        name: "חוף גורדון",
        parking: "paid",
        parkingNote: "חניה בתשלום",
        accessibility: "yes",
        accessibilityNote: "הנגשה מלאה לפי העירייה",
      }),
    ).toEqual([
      { question: "איפה חונים בחוף גורדון?", answer: "בחוף גורדון חניה בתשלום." },
      {
        question: "מה הנגישות בחוף גורדון?",
        answer: "המקום נגיש. הנגשה מלאה לפי העירייה.",
      },
    ]);
    expect(
      spotFaq({ name: "חוף הילטון", parking: "paid", parkingNote: "חניה בתשלום." })[0]
        ?.answer,
    ).toBe("בחוף הילטון חניה בתשלום.");
    expect(
      spotFaq({ name: "מרינה הרצליה", parking: "paid", parkingNote: "חניון בתשלום" })[0]
        ?.answer,
    ).toBe("במרינה הרצליה חניה בתשלום. חניון בתשלום.");
    expect(
      spotFaq({ name: "נמל יפו", parking: "yes", parkingNote: "חניה ליד הנמל." })[0]
        ?.answer,
    ).toBe("בנמל יפו יש חניה. חניה ליד הנמל.");
    expect(
      spotFaq({ name: "עכו", parkingNote: "ברחוב הסמוך!" })[0]?.answer,
    ).toBe("בעכו: ברחוב הסמוך!");
    expect(
      spotFaq({ name: "עכו", accessibilityNote: "יש מדרגה אחת…" })[0]?.answer,
    ).toBe("בעכו: יש מדרגה אחת…");
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
