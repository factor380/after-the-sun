import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertIsraelCoordinates,
  type CreateSpotInput,
  type UpdateSpotInput,
} from "@/lib/validations/spot";

export async function ensureProfile(userId: string, displayName?: string | null) {
  return prisma.profile.upsert({
    where: { id: userId },
    create: {
      id: userId,
      displayName: displayName ?? null,
    },
    update: {},
  });
}

const MAX_SEARCH_QUERY_LENGTH = 100;

/** Enough to resolve a cover image when the spot has no photo of its own. */
const COVER_PHOTO_SELECTION = {
  photos: {
    orderBy: { createdAt: "asc" },
    take: 1,
    select: { id: true, url: true, uploadedById: true, createdAt: true },
  },
  _count: { select: { photos: true } },
} as const;

export async function listSpots(query?: string) {
  const q = query?.trim().slice(0, MAX_SEARCH_QUERY_LENGTH) || undefined;

  return prisma.spot.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { region: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: COVER_PHOTO_SELECTION,
  });
}

export async function countSpots() {
  return prisma.spot.count();
}

export async function listSpotsByUser(userId: string) {
  return prisma.spot.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: "desc" },
    include: COVER_PHOTO_SELECTION,
  });
}

export async function getSpotById(id: string) {
  return prisma.spot.findUnique({ where: { id }, include: COVER_PHOTO_SELECTION });
}

/** Spot plus its full community gallery, for the detail page. */
export async function getSpotWithPhotos(id: string) {
  return prisma.spot.findUnique({
    where: { id },
    include: {
      photos: {
        orderBy: { createdAt: "asc" },
        select: { id: true, url: true, uploadedById: true, createdAt: true },
      },
    },
  });
}

const CREATED_SPOT_INCLUDE = {
  photos: {
    orderBy: { createdAt: "asc" as const },
    select: { id: true, url: true, uploadedById: true, createdAt: true },
  },
};

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function findSpotByClientRequestId(
  userId: string,
  clientRequestId: string,
) {
  return prisma.spot.findUnique({
    where: {
      createdById_clientRequestId: {
        createdById: userId,
        clientRequestId,
      },
    },
    include: CREATED_SPOT_INCLUDE,
  });
}

export type CreateSpotResult =
  | {
      ok: true;
      created: boolean;
      spot: NonNullable<Awaited<ReturnType<typeof findSpotByClientRequestId>>>;
    }
  | { ok: false; reason: "rate_limited" };

/**
 * Create a spot, or return the one this user already saved for `clientRequestId`.
 * `consumeRateLimit` runs only when a new row would be inserted, so a replay
 * of the same submit is not counted.
 */
export async function createSpot(
  userId: string,
  input: CreateSpotInput,
  options?: { consumeRateLimit?: () => boolean },
): Promise<CreateSpotResult> {
  assertIsraelCoordinates(input.lat, input.lng);
  await ensureProfile(userId);

  if (input.clientRequestId) {
    const existing = await findSpotByClientRequestId(userId, input.clientRequestId);
    if (existing) return { ok: true, created: false, spot: existing };
  }

  if (options?.consumeRateLimit && !options.consumeRateLimit()) {
    if (input.clientRequestId) {
      const existing = await findSpotByClientRequestId(
        userId,
        input.clientRequestId,
      );
      if (existing) return { ok: true, created: false, spot: existing };
    }
    return { ok: false, reason: "rate_limited" };
  }

  const extraPhotoUrls = input.extraPhotoUrls ?? [];

  try {
    const spot = await prisma.spot.create({
      data: {
        name: input.name,
        description: input.description,
        lat: input.lat,
        lng: input.lng,
        region: input.region ?? null,
        photoUrl: input.photoUrl ?? null,
        createdById: userId,
        clientRequestId: input.clientRequestId ?? null,
        ...(extraPhotoUrls.length > 0
          ? {
              photos: {
                create: extraPhotoUrls.map((url) => ({
                  url,
                  uploadedById: userId,
                })),
              },
            }
          : {}),
      },
      include: CREATED_SPOT_INCLUDE,
    });
    return { ok: true, created: true, spot };
  } catch (error) {
    if (input.clientRequestId && isUniqueViolation(error)) {
      const existing = await findSpotByClientRequestId(
        userId,
        input.clientRequestId,
      );
      if (existing) return { ok: true, created: false, spot: existing };
    }
    throw error;
  }
}

export async function updateSpot(
  id: string,
  userId: string,
  input: UpdateSpotInput,
) {
  const existing = await prisma.spot.findUnique({ where: { id } });
  if (!existing) return null;
  if (existing.createdById !== userId) {
    throw new Error("FORBIDDEN");
  }

  const lat = input.lat ?? existing.lat;
  const lng = input.lng ?? existing.lng;
  assertIsraelCoordinates(lat, lng);

  return prisma.spot.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.lat !== undefined ? { lat: input.lat } : {}),
      ...(input.lng !== undefined ? { lng: input.lng } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
      ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl } : {}),
    },
  });
}

export async function deleteSpot(id: string, userId: string) {
  const existing = await prisma.spot.findUnique({ where: { id } });
  if (!existing) return null;
  if (existing.createdById !== userId) {
    throw new Error("FORBIDDEN");
  }

  return prisma.spot.delete({ where: { id } });
}
