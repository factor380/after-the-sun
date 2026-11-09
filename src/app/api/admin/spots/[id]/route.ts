import { NextResponse } from "next/server";
import { adminWriteDecision } from "@/lib/admin";
import { adminSpotValidationMessage } from "@/lib/admin-spot-messages";
import { readAdminRequest } from "@/lib/admin-session";
import { dictionary } from "@/lib/i18n/dictionaries";
import { isSameOriginRequest } from "@/lib/request-origin";
import { revalidatePublishedSpots } from "@/lib/revalidate-public";
import { SPOT_PHOTOS_BUCKET, spotPhotoObjectPath } from "@/lib/spot-photo";
import type { ServerSupabase } from "@/lib/e2e/server-supabase";
import { adminUpdateSpotSchema } from "@/lib/validations/spot";
import { adminUpdateSpot } from "@/services/spots";

type RouteContext = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

function forbidden(reason: "signed-out" | "forbidden") {
  const error =
    reason === "signed-out"
      ? dictionary.adminNeedSignIn
      : dictionary.adminForbiddenEdit;
  return NextResponse.json({ error }, { status: 403 });
}

/** Best-effort. A missed object must not undo the saved spot. */
async function removeStoredPhotos(supabase: ServerSupabase, urls: string[]) {
  const paths = [
    ...new Set(
      urls
        .map((url) => spotPhotoObjectPath(url))
        .filter((path): path is string => Boolean(path)),
    ),
  ];
  if (paths.length === 0) return;
  try {
    const { error } = await supabase.storage.from(SPOT_PHOTOS_BUCKET).remove(paths);
    if (error) console.warn("admin spot photo cleanup failed", error.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.warn("admin spot photo cleanup failed", message);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json(
        { error: dictionary.adminRequestBlocked },
        { status: 403 },
      );
    }

    const { user, supabase } = await readAdminRequest();
    const decision = adminWriteDecision(user);
    if (!decision.ok) return forbidden(decision.reason);

    const { id } = await context.params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: dictionary.adminInvalidSpot }, { status: 400 });
    }

    const parsed = adminUpdateSpotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: adminSpotValidationMessage(parsed.error) },
        { status: 400 },
      );
    }

    const result = await adminUpdateSpot(id, parsed.data);
    if (!result) {
      return NextResponse.json({ error: dictionary.adminSpotNotFound }, { status: 404 });
    }

    await removeStoredPhotos(supabase, result.removedPhotoUrls);
    revalidatePublishedSpots(result.spot.id);

    return NextResponse.json({
      id: result.spot.id,
      name: result.spot.name,
      status: result.spot.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNKNOWN_PHOTO") {
      return NextResponse.json({ error: dictionary.adminUnknownPhoto }, { status: 400 });
    }
    if (message === "Location must be within Israel bounds") {
      return NextResponse.json(
        { error: dictionary.locationOutsideIsrael },
        { status: 400 },
      );
    }
    console.error("PATCH /api/admin/spots/[id]", error);
    return NextResponse.json({ error: dictionary.saveFailed }, { status: 400 });
  }
}
