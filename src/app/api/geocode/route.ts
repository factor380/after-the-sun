import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-origin";
import { PlaceSearchError, searchIsraelPlaces } from "@/lib/geo/geocode";

const GEOCODE_RATE_LIMIT = 30;
const ANON_GEOCODE_RATE_LIMIT = 12;
const GEOCODE_RATE_WINDOW_MS = 60_000;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 120;

/** Drop query-string secrets if an upstream error echoes the request URL. */
function geocodeLogDetail(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "upstream search failed";
  return message.replace(/apiKey=[^&\s]+/gi, "apiKey=[redacted]");
}

/** First public hop only. Unparseable values share one bucket. */
function anonymousGeocodeKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = (forwarded?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "").trim();
  const ip = /^[0-9a-fA-F:.]{3,64}$/.test(first) ? first : "unknown";
  return `geocode:anon:${ip}`;
}

export async function GET(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Place search is not an insert. Anonymous visitors use it while filling
    // /spots/new; creating a spot still requires a session.
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }

    const limitKey = userId
      ? { key: `geocode:user:${userId}`, limit: GEOCODE_RATE_LIMIT }
      : { key: anonymousGeocodeKey(request), limit: ANON_GEOCODE_RATE_LIMIT };

    if (!rateLimit(limitKey.key, limitKey.limit, GEOCODE_RATE_WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many requests. Try again shortly." },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();

    if (query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json({ results: [] });
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json({ error: "Query too long" }, { status: 400 });
    }

    const { results, provider } = await searchIsraelPlaces(query, request.signal);
    return NextResponse.json({ results, provider });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return new NextResponse(null, { status: 499 });
    }
    const status = error instanceof PlaceSearchError && error.status === 429 ? 429 : 502;
    console.error(`GET /api/geocode ${status}`, geocodeLogDetail(error));
    return NextResponse.json(
      {
        error: status === 429 ? "Too many requests. Try again shortly." : "Search failed",
        results: [],
      },
      { status },
    );
  }
}
