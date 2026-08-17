import { isWithinIsraelBounds, ISRAEL_CENTER } from "@/lib/geo/israel";

export type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
};

const GEOAPIFY_AUTOCOMPLETE_URL =
  "https://api.geoapify.com/v1/geocode/autocomplete";

/** Max results returned to the client. */
export const GEOCODE_RESULT_LIMIT = 6;

type GeoapifyFeature = {
  properties?: {
    formatted?: string;
    address_line1?: string;
    lat?: number;
    lon?: number;
  };
};

/**
 * Server-only: query Geoapify autocomplete, biased and filtered to Israel.
 * Returns only results inside Israel bounds. Throws if the API key is missing
 * or the upstream request fails.
 */
export async function searchIsraelPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    throw new Error("GEOAPIFY_API_KEY is not configured");
  }

  const url = new URL(GEOAPIFY_AUTOCOMPLETE_URL);
  url.searchParams.set("text", query);
  url.searchParams.set("filter", "countrycode:il");
  url.searchParams.set(
    "bias",
    `proximity:${ISRAEL_CENTER.lng},${ISRAEL_CENTER.lat}`,
  );
  url.searchParams.set("limit", String(GEOCODE_RESULT_LIMIT));
  url.searchParams.set("lang", "he");
  url.searchParams.set("format", "geojson");
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Geoapify request failed with status ${res.status}`);
  }

  const data = (await res.json()) as { features?: GeoapifyFeature[] };
  const features = Array.isArray(data.features) ? data.features : [];

  const results: GeocodeResult[] = [];
  for (const feature of features) {
    const props = feature.properties;
    const lat = props?.lat;
    const lng = props?.lon;
    const label = props?.formatted ?? props?.address_line1;

    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      typeof label !== "string" ||
      !label.trim() ||
      !isWithinIsraelBounds(lat, lng)
    ) {
      continue;
    }

    results.push({ label: label.trim(), lat, lng });
    if (results.length >= GEOCODE_RESULT_LIMIT) break;
  }

  return results;
}
