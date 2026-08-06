import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-origin";
import {
  ALLOWED_SPOT_PHOTO_TYPES,
  detectSpotPhotoMime,
  extensionForSpotPhotoType,
  isAllowedSpotPhotoType,
  MAX_SPOT_PHOTO_BYTES,
  SPOT_PHOTOS_BUCKET,
} from "@/lib/spot-photo";

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
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing image file" },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_SPOT_PHOTO_BYTES) {
      return NextResponse.json(
        { error: "Image must be between 1 byte and 5 MB" },
        { status: 400 },
      );
    }

    if (file.type && !isAllowedSpotPhotoType(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported image type. Allowed: ${ALLOWED_SPOT_PHOTO_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const detected = detectSpotPhotoMime(buffer);
    if (!detected) {
      return NextResponse.json(
        { error: "File content does not match a valid image type" },
        { status: 400 },
      );
    }
    if (file.type && file.type !== detected) {
      return NextResponse.json(
        { error: "Declared image type does not match file content" },
        { status: 400 },
      );
    }

    const ext = extensionForSpotPhotoType(detected);
    const objectPath = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(SPOT_PHOTOS_BUCKET)
      .upload(objectPath, buffer, {
        contentType: detected,
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
