import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-origin";
import { prepareSpotPhotoFile } from "@/lib/spot-photo-file";
import { SPOT_PHOTOS_BUCKET } from "@/lib/spot-photo";

const UPLOAD_RATE_LIMIT = 20;
const UPLOAD_RATE_WINDOW_MS = 60_000;

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

    if (
      !rateLimit(
        `spots:upload:${user.id}`,
        UPLOAD_RATE_LIMIT,
        UPLOAD_RATE_WINDOW_MS,
      )
    ) {
      return NextResponse.json(
        { error: "Too many requests. Try again shortly." },
        { status: 429 },
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

    const objectPath = `${user.id}/${crypto.randomUUID()}.${prepared.photo.extension}`;

    const { error: uploadError } = await supabase.storage
      .from(SPOT_PHOTOS_BUCKET)
      .upload(objectPath, prepared.photo.bytes, {
        contentType: prepared.photo.mime,
        upsert: false,
        cacheControl: "31536000",
      });

    if (uploadError) {
      console.error("POST /api/spots/upload storage", uploadError.message);
      const msg = uploadError.message.toLowerCase();
      const missingBucket = /bucket|not found|does not exist/.test(msg);
      const rlsBlocked = msg.includes("row-level security");
      return NextResponse.json(
        {
          error:
            missingBucket || rlsBlocked
              ? "Photo storage is not configured. Create the public spot-photos bucket and policies in Supabase (see README)."
              : "Failed to upload photo",
        },
        { status: 502 },
      );
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
    console.error("POST /api/spots/upload", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 },
    );
  }
}
