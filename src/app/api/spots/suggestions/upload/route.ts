import { NextResponse } from "next/server";
import { clientAddress } from "@/lib/client-address";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-origin";
import { prepareSpotPhotoFile } from "@/lib/spot-photo-file";
import { SPOT_PHOTOS_BUCKET } from "@/lib/spot-photo";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const UPLOAD_RATE_LIMIT = 8;
const UPLOAD_RATE_WINDOW_MS = 60 * 60 * 1000;

/**
 * Anonymous suggestion photo. Requires the service-role key because Storage
 * RLS only lets a signed-in user write their own folder. Without the key the
 * suggestion can still be sent with no photo.
 */
export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const key = `spots:suggest-upload:${clientAddress(request)}`;
    if (!rateLimit(key, UPLOAD_RATE_LIMIT, UPLOAD_RATE_WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many requests. Try again shortly." },
        { status: 429 },
      );
    }

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Photo storage is not configured" },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const prepared = await prepareSpotPhotoFile(formData.get("file"));
    if (!prepared.ok) {
      return NextResponse.json(
        { error: prepared.error },
        { status: prepared.status },
      );
    }

    const objectPath = `suggestions/${crypto.randomUUID()}.${prepared.photo.extension}`;
    const { error: uploadError } = await supabase.storage
      .from(SPOT_PHOTOS_BUCKET)
      .upload(objectPath, prepared.photo.bytes, {
        contentType: prepared.photo.mime,
        upsert: false,
        cacheControl: "31536000",
      });

    if (uploadError) {
      console.error("POST /api/spots/suggestions/upload", uploadError.message);
      return NextResponse.json({ error: "Failed to upload photo" }, { status: 502 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(SPOT_PHOTOS_BUCKET).getPublicUrl(objectPath);

    if (!publicUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "Failed to resolve public photo URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({ photoUrl: publicUrl }, { status: 201 });
  } catch (error) {
    console.error("POST /api/spots/suggestions/upload", error);
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}
