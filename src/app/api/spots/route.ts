import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toPublicSpot } from "@/lib/public-spot";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-origin";
import { createSpotSchema } from "@/lib/validations/spot";
import { revalidatePublishedSpots } from "@/lib/revalidate-public";
import { createSpot, listSpots } from "@/services/spots";

const CREATE_RATE_LIMIT = 10;
const CREATE_RATE_WINDOW_MS = 60_000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const spots = await listSpots(q);
    return NextResponse.json(spots.map(toPublicSpot));
  } catch (error) {
    console.error("GET /api/spots", error);
    return NextResponse.json(
      { error: "Failed to load spots" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

    if (!rateLimit(`spots:create:${user.id}`, CREATE_RATE_LIMIT, CREATE_RATE_WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many requests. Try again shortly." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = createSpotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid spot data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const spot = await createSpot(user.id, parsed.data);
    revalidatePublishedSpots(spot.id);
    return NextResponse.json(toPublicSpot(spot), { status: 201 });
  } catch (error) {
    console.error("POST /api/spots", error);
    const message =
      error instanceof Error && error.message === "Location must be within Israel bounds"
        ? error.message
        : "Failed to create spot";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
