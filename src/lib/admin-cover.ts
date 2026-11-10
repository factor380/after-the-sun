type GalleryPhoto = { id: string; url: string };

/**
 * Cover URL saved with an admin edit, plus the files that nothing still uses.
 * A requested cover that points at a gallery photo being deleted cannot stay:
 * the oldest remaining gallery photo becomes the cover, or the cover is cleared.
 * An explicit empty cover stays empty, even when gallery photos remain.
 */
export function resolveAdminSpotCover(input: {
  requestedPhotoUrl: string | null;
  existingPhotoUrl: string | null;
  photos: readonly GalleryPhoto[];
  removePhotoIds: readonly string[];
}): { photoUrl: string | null; removedPhotoUrls: string[] } {
  const removeIds = new Set(input.removePhotoIds);
  const remaining = input.photos.filter((photo) => !removeIds.has(photo.id));
  const remainingUrls = new Set(urlsOf(remaining));
  const removedGalleryUrls = urlsOf(input.photos.filter((photo) => removeIds.has(photo.id)));

  let photoUrl = blankToNull(input.requestedPhotoUrl);
  if (photoUrl && removedGalleryUrls.includes(photoUrl) && !remainingUrls.has(photoUrl)) {
    photoUrl = remaining.find((photo) => photo.url.length > 0)?.url ?? null;
  }

  const stillUsed = new Set(remainingUrls);
  if (photoUrl) stillUsed.add(photoUrl);

  const removedPhotoUrls: string[] = [];
  for (const url of removedGalleryUrls) {
    if (stillUsed.has(url) || removedPhotoUrls.includes(url)) continue;
    removedPhotoUrls.push(url);
  }

  const existing = blankToNull(input.existingPhotoUrl);
  if (existing && !stillUsed.has(existing) && !removedPhotoUrls.includes(existing)) {
    removedPhotoUrls.push(existing);
  }

  return { photoUrl, removedPhotoUrls };
}

function urlsOf(photos: readonly GalleryPhoto[]): string[] {
  return photos.map((photo) => photo.url).filter((url) => url.length > 0);
}

function blankToNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
