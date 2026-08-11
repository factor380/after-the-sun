export const SPOT_PHOTOS_BUCKET = "spot-photos";

/** Hard cap for files accepted by the upload API (after client compression). */
export const MAX_SPOT_PHOTO_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

/** Max size of a photo the user may pick before client-side compression. */
export const MAX_SPOT_PHOTO_INPUT_BYTES = 12 * 1024 * 1024; // 12 MB

/** Longest edge after resize. */
export const MAX_SPOT_PHOTO_EDGE = 1600;

/** Soft target size after compression. */
export const TARGET_SPOT_PHOTO_BYTES = 900 * 1024; // ~900 KB

export const ALLOWED_SPOT_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedSpotPhotoType = (typeof ALLOWED_SPOT_PHOTO_TYPES)[number];

const EXT_BY_MIME: Record<AllowedSpotPhotoType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isAllowedSpotPhotoType(
  value: string,
): value is AllowedSpotPhotoType {
  return (ALLOWED_SPOT_PHOTO_TYPES as readonly string[]).includes(value);
}

export function extensionForSpotPhotoType(type: AllowedSpotPhotoType): string {
  return EXT_BY_MIME[type];
}

/** Verify file content matches a declared image MIME (magic bytes). */
export function detectSpotPhotoMime(
  bytes: Uint8Array,
): AllowedSpotPhotoType | null {
  if (bytes.length < 12) return null;

  // JPEG
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP (RIFF....WEBP)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}
