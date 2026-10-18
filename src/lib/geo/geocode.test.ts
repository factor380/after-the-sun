import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearPlaceSearchCache,
  israelGeocodeFilter,
  searchIsraelPlaces,
} from "./geocode";

describe("israelGeocodeFilter", () => {
  it("uses the shared Israel bounds rectangle", () => {
    expect(israelGeocodeFilter()).toBe("rect:33.9,29.3,36,33.5");
    expect(israelGeocodeFilter()).not.toMatch(/countrycode/i);
  });
});

describe("searchIsraelPlaces", () => {
  afterEach(() => {
    clearPlaceSearchCache();
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

    await expect(searchIsraelPlaces("אפרת")).resolves.toEqual({
      provider: "geoapify",
      results: [{ label: "אפרת", lat: 31.65, lng: 35.16 }],
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("searches OpenStreetMap when Geoapify is not configured", async () => {
    vi.stubEnv("GEOAPIFY_API_KEY", "");
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      expect(url.hostname).toBe("nominatim.openstreetmap.org");
      expect(url.searchParams.get("q")).toBe("אפרת");
      expect(url.searchParams.get("countrycodes")).toBe("il,ps");
      expect(url.searchParams.get("viewbox")).toBe("33.9,33.5,36,29.3");
      expect(url.searchParams.get("bounded")).toBe("1");
      return new Response(
        JSON.stringify([
          {
            name: "אפרת",
            display_name: "אפרת, שטח C, יהודה ושומרון, الأراضي الفلسطينية",
            lat: "31.6536462",
            lon: "35.1508714",
          },
          {
            name: "אפרת",
            display_name: "אפרת, מועצה אזורית גוש עציון, שטח C",
            lat: "31.6620949",
            lon: "35.1549651",
          },
          {
            name: "Cairo",
            display_name: "Cairo",
            lat: "30.0444",
            lon: "31.2357",
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchIsraelPlaces("אפרת")).resolves.toEqual({
      provider: "openstreetmap",
      results: [
        {
          label: "אפרת, שטח C, יהודה ושומרון",
          lat: 31.6536462,
          lng: 35.1508714,
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("uses Photon when Nominatim fails", async () => {
    vi.stubEnv("GEOAPIFY_API_KEY", "");
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.hostname === "nominatim.openstreetmap.org") {
        return new Response("unavailable", { status: 503 });
      }
      expect(url.hostname).toBe("photon.komoot.io");
      expect(url.searchParams.get("bbox")).toBe("33.9,29.3,36,33.5");
      expect(url.searchParams.get("q")).toBe("תקוע");
      return new Response(
        JSON.stringify({
          features: [
            {
              properties: {
                name: "תקוע",
                state: "יהודה ושומרון",
                country: "الأراضي الفلسطينية",
              },
              geometry: { coordinates: [35.23, 31.64] },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchIsraelPlaces("תקוע")).resolves.toEqual({
      provider: "openstreetmap",
      results: [{ label: "תקוע, יהודה ושומרון, الأراضي الفلسطينية", lat: 31.64, lng: 35.23 }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
