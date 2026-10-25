import { describe, expect, it } from "vitest";
import { DEFAULT_SHARE_IMAGE, spotShareImage } from "@/lib/seo";

describe("spot share image", () => {
  it("falls back to the site card at 1200x630 when there is no cover", () => {
    expect(spotShareImage(null, "נמל יפו")).toEqual({
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "After the Sun - sunset spots in Israel",
    });
    expect(DEFAULT_SHARE_IMAGE.width).toBe(1200);
    expect(DEFAULT_SHARE_IMAGE.height).toBe(630);
  });

  it("uses the cover photo when the spot has one", () => {
    expect(spotShareImage("https://cdn.example/cover.jpg", "חוף הילטון")).toEqual({
      url: "https://cdn.example/cover.jpg",
      alt: "חוף הילטון",
    });
  });
});
