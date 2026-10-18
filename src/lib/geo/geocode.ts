import {
  isWithinIsraelBounds,
  ISRAEL_CENTER,
  ISRAEL_MAX_BOUNDS,
} from "@/lib/geo/israel";

export type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
};

export type PlaceSearchProvider = "geoapify" | "openstreetmap";

export type PlaceSearchResponse = {
  results: GeocodeResult[];
  provider: PlaceSearchProvider;
};

/** Upstream HTTP failure. `status` is the upstream status, or 502 for a network error. */
export class PlaceSearchError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Place search failed with status ${status}`);
    this.name = "PlaceSearchError";
    this.status = status;
  }
}

const GEOAPIFY_AUTOCOMPLETE_URL =
  "https://api.geoapify.com/v1/geocode/autocomplete";
const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const PHOTON_SEARCH_URL = "https://photon.komoot.io/api/";

/** Identifies this app to public geocoders. Do not include secrets. */
const PUBLIC_GEOCODER_USER_AGENT =
  "AfterTheSun/1.0 (https://after-the-sun.vercel.app; sunset place search)";

/** Max results returned to the client. */
export const GEOCODE_RESULT_LIMIT = 6;

/** Ask for a few extras so deduped towns still fill the list. */
const UPSTREAM_RESULT_LIMIT = 8;

const UPSTREAM_TIMEOUT_MS = 8_000;
const CACHE_TTL_MS = 10 * 60_000;
const CACHE_MAX_ENTRIES = 50;
/** Public Nominatim allows at most one request per second per application. */
const NOMINATIM_MIN_INTERVAL_MS = 1_100;
const LABEL_MAX_LENGTH = 180;
/** Same-name hits closer than this are one place (town relation + village node). */
const DEDUPE_DEGREES = 0.02;

type GeoapifyFeature = {
  properties?: {
    formatted?: string;
    address_line1?: string;
    lat?: number;
    lon?: number;
  };
};

type NominatimItem = {
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
};

type PhotonFeature = {
  properties?: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  geometry?: {
    coordinates?: [number, number];
  };
};

type CacheEntry = {
  at: number;
  results: GeocodeResult[];
};

const resultCache = new Map<string, CacheEntry>();
let nominatimChain: Promise<void> = Promise.resolve();
let nominatimNotBefore = 0;

export function clearPlaceSearchCache(): void {
  resultCache.clear();
  nominatimChain = Promise.resolve();
  nominatimNotBefore = 0;
}

function israelRect(): {
  west: number;
  south: number;
  east: number;
  north: number;
} {
  const [[south, west], [north, east]] = ISRAEL_MAX_BOUNDS;
  return { west, south, east, north };
}

/**
 * Geoapify rect for the same box as `isWithinIsraelBounds`.
 * `countrycode:il` drops Judea and Samaria, which OpenStreetMap tags as `ps`.
 */
export function israelGeocodeFilter(): string {
  const { west, south, east, north } = israelRect();
  return `rect:${west},${south},${east},${north}`;
}

function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function clipLabel(label: string): string {
  if (label.length <= LABEL_MAX_LENGTH) return label;
  return label.slice(0, LABEL_MAX_LENGTH).trimEnd();
}

function acceptResult(label: string, lat: number, lng: number): GeocodeResult | null {
  if (!label || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (!isWithinIsraelBounds(lat, lng)) return null;
  return { label: clipLabel(label), lat, lng };
}

function pushUnique(results: GeocodeResult[], next: GeocodeResult | null): void {
  if (!next || results.length >= GEOCODE_RESULT_LIMIT) return;
  const name = next.label.split(",")[0]?.trim();
  const duplicate = results.some((existing) => {
    const existingName = existing.label.split(",")[0]?.trim();
    return (
      existingName === name &&
      Math.abs(existing.lat - next.lat) < DEDUPE_DEGREES &&
      Math.abs(existing.lng - next.lng) < DEDUPE_DEGREES
    );
  });
  if (!duplicate) results.push(next);
}

function readCache(provider: PlaceSearchProvider, query: string): GeocodeResult[] | null {
  const entry = resultCache.get(`${provider}:${query}`);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    resultCache.delete(`${provider}:${query}`);
    return null;
  }
  return entry.results;
}

function writeCache(
  provider: PlaceSearchProvider,
  query: string,
  results: GeocodeResult[],
): void {
  if (results.length === 0) return;
  if (resultCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = resultCache.keys().next().value;
    if (oldest) resultCache.delete(oldest);
  }
  resultCache.set(`${provider}:${query}`, { at: Date.now(), results });
}

function upstreamSignal(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
  if (!signal) return timeout;
  return AbortSignal.any([signal, timeout]);
}

function abortError(): DOMException {
  return new DOMException("The operation was aborted", "AbortError");
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Serialize public Nominatim calls so one instance stays under 1 request/second. */
function scheduleNominatim<T>(
  signal: AbortSignal | undefined,
  task: () => Promise<T>,
): Promise<T> {
  const interval = process.env.VITEST ? 0 : NOMINATIM_MIN_INTERVAL_MS;
  const run = nominatimChain.then(async () => {
    if (signal?.aborted) throw abortError();
    const wait = nominatimNotBefore - Date.now();
    await delay(wait, signal);
    if (signal?.aborted) throw abortError();
    nominatimNotBefore = Date.now() + interval;
    return task();
  });
  nominatimChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function fetchJson(url: URL, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, {
    signal: upstreamSignal(signal),
    redirect: "error",
    headers: {
      Accept: "application/json",
      "Accept-Language": "he",
      "User-Agent": PUBLIC_GEOCODER_USER_AGENT,
    },
  });
  if (!res.ok) throw new PlaceSearchError(res.status);
  return res.json();
}

async function searchGeoapify(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw new PlaceSearchError(503);

  const url = new URL(GEOAPIFY_AUTOCOMPLETE_URL);
  url.searchParams.set("text", query);
  url.searchParams.set("filter", israelGeocodeFilter());
  url.searchParams.set(
    "bias",
    `proximity:${ISRAEL_CENTER.lng},${ISRAEL_CENTER.lat}`,
  );
  url.searchParams.set("limit", String(GEOCODE_RESULT_LIMIT));
  url.searchParams.set("lang", "he");
  url.searchParams.set("format", "geojson");
  url.searchParams.set("apiKey", apiKey);

  const data = (await fetchJson(url, signal)) as { features?: GeoapifyFeature[] };
  const features = Array.isArray(data.features) ? data.features : [];
  const results: GeocodeResult[] = [];
  for (const feature of features) {
    const props = feature.properties;
    const label = cleanText(props?.formatted ?? props?.address_line1);
    pushUnique(
      results,
      acceptResult(label, props?.lat ?? Number.NaN, props?.lon ?? Number.NaN),
    );
  }
  return results;
}

function nominatimLabel(item: NominatimItem): string {
  const display = cleanText(item.display_name);
  const name = cleanText(item.name);
  const source = display || name;
  if (!source) return "";
  return source
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
}

async function searchNominatim(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const { west, south, east, north } = israelRect();
  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(UPSTREAM_RESULT_LIMIT));
  url.searchParams.set("accept-language", "he");
  // `il` alone drops Judea and Samaria, which OpenStreetMap tags as `ps`.
  url.searchParams.set("countrycodes", "il,ps");
  url.searchParams.set("viewbox", `${west},${north},${east},${south}`);
  url.searchParams.set("bounded", "1");
  url.searchParams.set("addressdetails", "0");

  const data = (await fetchJson(url, signal)) as NominatimItem[];
  const items = Array.isArray(data) ? data : [];
  const results: GeocodeResult[] = [];
  for (const item of items) {
    pushUnique(
      results,
      acceptResult(nominatimLabel(item), Number(item.lat), Number(item.lon)),
    );
  }
  return results;
}

function photonLabel(props: PhotonFeature["properties"]): string {
  const name = cleanText(props?.name);
  if (!name) return "";
  const context = [props?.city, props?.state, props?.country]
    .map((part) => cleanText(part))
    .filter((part) => part.length > 0 && part !== name);
  const unique: string[] = [];
  for (const part of context) {
    if (!unique.includes(part)) unique.push(part);
  }
  return [name, ...unique].slice(0, 3).join(", ");
}

async function searchPhoton(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const { west, south, east, north } = israelRect();
  const url = new URL(PHOTON_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("lat", String(ISRAEL_CENTER.lat));
  url.searchParams.set("lon", String(ISRAEL_CENTER.lng));
  url.searchParams.set("limit", String(UPSTREAM_RESULT_LIMIT));
  url.searchParams.set("bbox", `${west},${south},${east},${north}`);

  const data = (await fetchJson(url, signal)) as { features?: PhotonFeature[] };
  const features = Array.isArray(data.features) ? data.features : [];
  const results: GeocodeResult[] = [];
  for (const feature of features) {
    const [lng, lat] = feature.geometry?.coordinates ?? [];
    pushUnique(
      results,
      acceptResult(
        photonLabel(feature.properties),
        lat ?? Number.NaN,
        lng ?? Number.NaN,
      ),
    );
  }
  return results;
}

async function searchOpenStreetMap(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  try {
    return await scheduleNominatim(signal, () => searchNominatim(query, signal));
  } catch (error) {
    if (signal?.aborted) throw error;
    console.error(
      "Nominatim place search failed; trying Photon",
      error instanceof PlaceSearchError ? error.status : "network",
    );
    return searchPhoton(query, signal);
  }
}

/**
 * Server-only place search inside the shared Israel bounds, including
 * Judea and Samaria. Uses Geoapify when `GEOAPIFY_API_KEY` is set, and
 * OpenStreetMap otherwise (or when Geoapify fails).
 */
export async function searchIsraelPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceSearchResponse> {
  const trimmed = query.trim();
  if (process.env.GEOAPIFY_API_KEY) {
    const cached = readCache("geoapify", trimmed);
    if (cached) return { results: cached, provider: "geoapify" };
    try {
      const results = await searchGeoapify(trimmed, signal);
      writeCache("geoapify", trimmed, results);
      return { results, provider: "geoapify" };
    } catch (error) {
      if (signal?.aborted) throw error;
      console.error(
        "Geoapify place search failed; falling back to OpenStreetMap",
        error instanceof PlaceSearchError ? error.status : "network",
      );
    }
  }

  const cached = readCache("openstreetmap", trimmed);
  if (cached) return { results: cached, provider: "openstreetmap" };
  const results = await searchOpenStreetMap(trimmed, signal);
  writeCache("openstreetmap", trimmed, results);
  return { results, provider: "openstreetmap" };
}
