import {
  ALLOWED_SPOT_PHOTO_TYPES,
  detectSpotPhotoMime,
  extensionForSpotPhotoType,
  isAllowedSpotPhotoType,
  MAX_SPOT_PHOTO_BYTES,
  type AllowedSpotPhotoType,
} from "@/lib/spot-photo";

export type PreparedSpotPhoto = {
  bytes: Uint8Array;
  mime: AllowedSpotPhotoType;
  extension: string;
};

export type SpotPhotoFileResult =
  | { ok: true; photo: PreparedSpotPhoto }
  | { ok: false; status: number; error: string };

/** Shared checks for signed-in uploads and anonymous suggestion photos. */
export async function prepareSpotPhotoFile(file: unknown): Promise<SpotPhotoFileResult> {
  if (!(file instanceof File)) {
    return { ok: false, status: 400, error: "Missing image file" };
  }

  if (file.size <= 0 || file.size > MAX_SPOT_PHOTO_BYTES) {
    return {
      ok: false,
      status: 400,
      error: "Image must be between 1 byte and 1.5 MB",
    };
  }

  if (file.type && !isAllowedSpotPhotoType(file.type)) {
    return {
      ok: false,
      status: 400,
      error: `Unsupported image type. Allowed: ${ALLOWED_SPOT_PHOTO_TYPES.join(", ")}`,
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectSpotPhotoMime(bytes);
  if (!detected) {
    return {
      ok: false,
      status: 400,
      error: "File content does not match a valid image type",
    };
  }
  if (file.type && file.type !== detected) {
    return {
      ok: false,
      status: 400,
      error: "Declared image type does not match file content",
    };
  }

  return {
    ok: true,
    photo: {
      bytes,
      mime: detected,
      extension: extensionForSpotPhotoType(detected),
    },
  };
}
