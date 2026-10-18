import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-origin";
import { searchIsraelPlaces } from "@/lib/geo/geocode";

const GEOCODE_RATE_LIMIT = 30;
const ANON_GEOCODE_RATE_LIMIT = 12;
const GEOCODE_RATE_WINDOW_MS = 60_000;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 120;

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

    if (!process.env.GEOAPIFY_API_KEY) {
      return NextResponse.json(
        { error: "Search is not configured", results: [] },
        { status: 503 },
      );
    }

    const results = await searchIsraelPlaces(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("GET /api/geocode", error);
    return NextResponse.json(
      { error: "Search failed", results: [] },
      { status: 502 },
    );
  }
}
