import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-origin";
import { searchIsraelPlaces } from "@/lib/geo/geocode";

const GEOCODE_RATE_LIMIT = 30;
const GEOCODE_RATE_WINDOW_MS = 60_000;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 120;

export async function GET(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !rateLimit(
        `geocode:${user.id}`,
        GEOCODE_RATE_LIMIT,
        GEOCODE_RATE_WINDOW_MS,
      )
    ) {
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
