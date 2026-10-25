import { describe, expect, it } from "vitest";
import {
  JERUSALEM_SUNSET_FAQS,
  JERUSALEM_SUNSET_GUIDE,
  JERUSALEM_SUNSET_PLACES,
  UNVERIFIED_MARK,
} from "@/lib/guides/jerusalem-sunset";
import { guideArticleJsonLd, jsonLdString } from "@/lib/seo";

describe("jerusalem sunset guide", () => {
  it("keeps every unverified marker from the approved copy", () => {
    const text = JERUSALEM_SUNSET_PLACES.flatMap((place) => [
      place.lead,
      ...place.facts.map((fact) => fact.text),
    ]).join("\n");
    expect(text.split(UNVERIFIED_MARK)).toHaveLength(15);
  });

  it("builds Article, FAQPage, and a Place ItemList for the six spots", () => {
    const data = guideArticleJsonLd({
      title: JERUSALEM_SUNSET_GUIDE.title,
      description: JERUSALEM_SUNSET_GUIDE.description,
      path: JERUSALEM_SUNSET_GUIDE.path,
      datePublished: JERUSALEM_SUNSET_GUIDE.datePublished,
      dateModified: JERUSALEM_SUNSET_GUIDE.datePublished,
      regionName: JERUSALEM_SUNSET_GUIDE.regionName,
      regionPath: JERUSALEM_SUNSET_GUIDE.regionPath,
      places: JERUSALEM_SUNSET_PLACES,
      faqs: JERUSALEM_SUNSET_FAQS,
    }) as {
      "@graph": {
        "@type": string;
        headline?: string;
        mainEntity?: { name: string }[];
        numberOfItems?: number;
        itemListElement?: { url?: string; item?: { "@type": string; name: string; url: string } }[];
      }[];
    };

    expect(data["@graph"].map((node) => node["@type"])).toEqual([
      "Article",
      "FAQPage",
      "ItemList",
      "BreadcrumbList",
    ]);
    expect(data["@graph"][0]?.headline).toBe(JERUSALEM_SUNSET_GUIDE.title);
    expect(data["@graph"][1]?.mainEntity?.map((item) => item.name)).toEqual(
      JERUSALEM_SUNSET_FAQS.map((faq) => faq.question),
    );

    const list = data["@graph"][2];
    expect(list?.numberOfItems).toBe(6);
    expect(list?.itemListElement).toHaveLength(6);
    list?.itemListElement?.forEach((entry, index) => {
      const place = JERUSALEM_SUNSET_PLACES[index];
      expect(entry.item?.["@type"]).toBe("Place");
      expect(entry.item?.name).toBe(place?.name);
      expect(entry.url).toContain(place?.path);
      expect(entry.item?.url).toContain(place?.path);
      expect(entry.url).not.toContain("localhost");
    });

    const serialized = jsonLdString(data);
    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain("localhost");
    expect(JERUSALEM_SUNSET_GUIDE.description.length).toBeLessThanOrEqual(160);
  });
});
