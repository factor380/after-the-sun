import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSpotSchema } from "@/lib/validations/spot";
import { createSpot, listSpots } from "@/services/spots";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const spots = await listSpots(q);
    return NextResponse.json(spots);
  } catch (error) {
    console.error("GET /api/spots", error);
    return NextResponse.json(
      { error: "Failed to load spots. Check DATABASE_URL." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json(spot, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create spot";
    console.error("POST /api/spots", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
