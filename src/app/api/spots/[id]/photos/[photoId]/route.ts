import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/request-origin";
import { SPOT_PHOTOS_BUCKET, spotPhotoObjectPath } from "@/lib/spot-photo";
import { createClient } from "@/lib/supabase/server";
import { revalidatePublishedSpots } from "@/lib/revalidate-public";
import { deleteSpotPhoto, SpotPhotoError } from "@/services/spot-photos";

type RouteContext = { params: Promise<{ id: string; photoId: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, photoId } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const photo = await deleteSpotPhoto(id, photoId, user.id);
    revalidatePublishedSpots(id);

    // Storage cleanup is best effort: the row is already gone, and bucket
    // policies may not let a spot owner remove another user's object.
    const objectPath = spotPhotoObjectPath(photo.url);
    if (objectPath) {
      const { error } = await supabase.storage
        .from(SPOT_PHOTOS_BUCKET)
        .remove([objectPath]);
      if (error) {
        console.warn("spot photo storage cleanup failed", error.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SpotPhotoError) {
      const status = error.code === "FORBIDDEN" ? 403 : 404;
      return NextResponse.json({ error: error.code }, { status });
    }
    console.error("DELETE /api/spots/[id]/photos/[photoId]", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 },
    );
  }
}
