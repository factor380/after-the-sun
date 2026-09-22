import { prisma } from "@/lib/prisma";
import {
  MAX_PHOTOS_PER_SPOT,
  MAX_PHOTOS_PER_USER_PER_SPOT,
} from "@/lib/spot-photo";
import { ensureProfile } from "@/services/spots";

export class SpotPhotoError extends Error {
  constructor(
    readonly code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "SPOT_LIMIT"
      | "USER_LIMIT"
      | "DUPLICATE",
  ) {
    super(code);
    this.name = "SpotPhotoError";
  }
}

export async function listSpotPhotos(spotId: string) {
  return prisma.spotPhoto.findMany({
    where: { spotId },
    orderBy: { createdAt: "asc" },
    select: { id: true, url: true, uploadedById: true, createdAt: true },
  });
}

/** Any signed-in user may contribute a photo to an existing spot. */
export async function addSpotPhoto(spotId: string, userId: string, url: string) {
  const spot = await prisma.spot.findUnique({
    where: { id: spotId },
    select: { id: true },
  });
  if (!spot) throw new SpotPhotoError("NOT_FOUND");

  const [total, byUser, duplicate] = await Promise.all([
    prisma.spotPhoto.count({ where: { spotId } }),
    prisma.spotPhoto.count({ where: { spotId, uploadedById: userId } }),
    prisma.spotPhoto.findFirst({ where: { spotId, url }, select: { id: true } }),
  ]);

  if (duplicate) throw new SpotPhotoError("DUPLICATE");
  if (total >= MAX_PHOTOS_PER_SPOT) throw new SpotPhotoError("SPOT_LIMIT");
  if (byUser >= MAX_PHOTOS_PER_USER_PER_SPOT) {
    throw new SpotPhotoError("USER_LIMIT");
  }

  await ensureProfile(userId);

  return prisma.$transaction(async (tx) => {
    const photo = await tx.spotPhoto.create({
      data: { spotId, url, uploadedById: userId },
      select: { id: true, url: true, uploadedById: true, createdAt: true },
    });
    await tx.spot.update({
      where: { id: spotId },
      data: { updatedAt: new Date() },
    });
    return photo;
  });
}

/** Removable by the contributor or by the spot owner (moderation). */
export async function deleteSpotPhoto(
  spotId: string,
  photoId: string,
  userId: string,
) {
  const photo = await prisma.spotPhoto.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      url: true,
      spotId: true,
      uploadedById: true,
      spot: { select: { createdById: true } },
    },
  });

  if (!photo || photo.spotId !== spotId) throw new SpotPhotoError("NOT_FOUND");
  if (photo.uploadedById !== userId && photo.spot.createdById !== userId) {
    throw new SpotPhotoError("FORBIDDEN");
  }

  await prisma.$transaction([
    prisma.spotPhoto.delete({ where: { id: photoId } }),
    prisma.spot.update({
      where: { id: spotId },
      data: { updatedAt: new Date() },
    }),
  ]);
  return photo;
}
