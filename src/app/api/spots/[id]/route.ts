import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toPublicSpot } from "@/lib/public-spot";
import { isSameOriginRequest } from "@/lib/request-origin";
import { updateSpotSchema } from "@/lib/validations/spot";
import { deleteSpot, getSpotById, updateSpot } from "@/services/spots";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const spot = await getSpotById(id);
    if (!spot) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(toPublicSpot(spot));
  } catch (error) {
    console.error("GET /api/spots/[id]", error);
    return NextResponse.json({ error: "Failed to load spot" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSpotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid spot data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const spot = await updateSpot(id, user.id, parsed.data);
    if (!spot) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(toPublicSpot(spot));
  } catch (error) {
    console.error("PATCH /api/spots/[id]", error);
    const message = error instanceof Error ? error.message : "Update failed";
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (message === "Location must be within Israel bounds") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const spot = await deleteSpot(id, user.id);
    if (!spot) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/spots/[id]", error);
    const message = error instanceof Error ? error.message : "Delete failed";
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
