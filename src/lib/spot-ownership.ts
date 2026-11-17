/**
 * A visitor owns a row only when both ids are present and equal.
 * `null === null` is not ownership: an anonymous session and an unclaimed
 * spot (`createdById` null) must not match.
 */
export function isRecordOwner(
  userId: string | null | undefined,
  ownerId: string | null | undefined,
): boolean {
  return typeof userId === "string" && userId.length > 0 && userId === ownerId;
}

/** Cover photos have no id and are removed from the edit form, not the gallery. */
export function canDeleteSpotPhoto(
  userId: string | null | undefined,
  createdById: string | null | undefined,
  photo: { id?: string | null; uploadedById?: string | null },
): boolean {
  if (!photo.id) return false;
  return (
    isRecordOwner(userId, createdById) ||
    isRecordOwner(userId, photo.uploadedById)
  );
}
