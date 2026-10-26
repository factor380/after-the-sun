/**
 * Cover URL for a spot, using the same order as the spot page and the cards:
 * the spot's own photo, otherwise the first community photo. Only https URLs
 * are returned. There is no placeholder.
 */

export function spotCoverUrl(spot: {
  photoUrl: string | null;
  photos?: readonly { url: string }[] | null;
}): string | null {
  const chosen = spot.photoUrl ?? spot.photos?.[0]?.url ?? null;
  return httpsPhotoUrl(chosen);
}

/** Supabase public spot photos that next/image is allowed to optimize. */
export function canOptimizeSpotPhoto(url: string): boolean {
  const parsed = httpsPhotoUrl(url);
  if (!parsed) return false;
  try {
    const { hostname, pathname, search } = new URL(parsed);
    return (
      hostname.endsWith(".supabase.co") &&
      pathname.startsWith("/storage/v1/object/public/spot-photos/") &&
      search === ""
    );
  } catch {
    return false;
  }
}

function httpsPhotoUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}
