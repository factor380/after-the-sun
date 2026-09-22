import { NextResponse } from "next/server";
import { toPublicSpotPhoto } from "@/lib/public-spot";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";
import { addSpotPhotoSchema } from "@/lib/validations/spot-photo";
import { revalidatePublishedSpots } from "@/lib/revalidate-public";
import { addSpotPhoto, listSpotPhotos, SpotPhotoError } from "@/services/spot-photos";

type RouteContext = { params: Promise<{ id: string }> };

const ADD_PHOTO_RATE_LIMIT = 10;
const ADD_PHOTO_RATE_WINDOW_MS = 60 * 60 * 1000;

const ERROR_STATUS: Record<SpotPhotoError["code"], number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  SPOT_LIMIT: 409,
  USER_LIMIT: 409,
  DUPLICATE: 409,
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const photos = await listSpotPhotos(id);
    return NextResponse.json(photos.map(toPublicSpotPhoto));
  } catch (error) {
    console.error("GET /api/spots/[id]/photos", error);
    return NextResponse.json(
      { error: "Failed to load photos" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
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

    if (
      !rateLimit(
        `spots:photos:${user.id}`,
        ADD_PHOTO_RATE_LIMIT,
        ADD_PHOTO_RATE_WINDOW_MS,
      )
    ) {
      return NextResponse.json(
        { error: "Too many photos. Try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = addSpotPhotoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid photo data" }, { status: 400 });
    }

    const photo = await addSpotPhoto(id, user.id, parsed.data.url);
    revalidatePublishedSpots(id);
    return NextResponse.json(toPublicSpotPhoto(photo), { status: 201 });
  } catch (error) {
    if (error instanceof SpotPhotoError) {
      return NextResponse.json(
        { error: error.code },
        { status: ERROR_STATUS[error.code] },
      );
    }
    console.error("POST /api/spots/[id]/photos", error);
    return NextResponse.json({ error: "Failed to add photo" }, { status: 500 });
  }
}
