import { afterEach, describe, expect, it, vi } from "vitest";
import { israelGeocodeFilter, searchIsraelPlaces } from "./geocode";

describe("israelGeocodeFilter", () => {
  it("uses the shared Israel bounds rectangle", () => {
    expect(israelGeocodeFilter()).toBe("rect:33.9,29.3,36,33.5");
    expect(israelGeocodeFilter()).not.toMatch(/countrycode/i);
  });
});

describe("searchIsraelPlaces", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("requests the bounds rect and drops places outside it", async () => {
    vi.stubEnv("GEOAPIFY_API_KEY", "test-key");
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      expect(url.searchParams.get("filter")).toBe("rect:33.9,29.3,36,33.5");
      expect(url.searchParams.get("text")).toBe("אפרת");
      expect(url.searchParams.has("apiKey")).toBe(true);
      return new Response(
        JSON.stringify({
          features: [
            {
              properties: {
                formatted: "אפרת",
                lat: 31.65,
                lon: 35.16,
              },
            },
            {
              properties: {
                formatted: "Cairo",
                lat: 30.0444,
                lon: 31.2357,
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchIsraelPlaces("אפרת")).resolves.toEqual([
      { label: "אפרת", lat: 31.65, lng: 35.16 },
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
