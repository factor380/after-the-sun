import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { resolveAdminSpotCover } from "@/lib/admin-cover";
import { cleanContributorName } from "@/lib/contributor-name";
import { prisma } from "@/lib/prisma";
import { isRecordOwner } from "@/lib/spot-ownership";
import {
  RESERVED_SPOT_SLUGS,
  spotSlugCandidate,
  spotSlugFromName,
} from "@/lib/spot-slug";
import {
  assertIsraelCoordinates,
  type AdminUpdateSpotInput,
  type CreateSpotInput,
  type SuggestSpotInput,
  type UpdateSpotInput,
} from "@/lib/validations/spot";

const PUBLISHED_STATUS = "approved";

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
    where: {
      status: PUBLISHED_STATUS,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { region: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: COVER_PHOTO_SELECTION,
  });
}

export async function countSpots() {
  return prisma.spot.count({ where: { status: PUBLISHED_STATUS } });
}

export async function listPendingSuggestions() {
  return prisma.spot.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    include: COVER_PHOTO_SELECTION,
  });
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

/** Any status, with the gallery. Callers must already be admins. */
export async function getSpotForAdmin(id: string) {
  return prisma.spot.findUnique({
    where: { id },
    include: {
      photos: {
        orderBy: { createdAt: "asc" },
        select: { id: true, url: true },
      },
    },
  });
}

export async function listSpotsForAdmin() {
  return prisma.spot.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      region: true,
      status: true,
      contributorName: true,
      updatedAt: true,
    },
  });
}

const GALLERY_INCLUDE = {
  photos: {
    orderBy: { createdAt: "asc" as const },
    select: { id: true, url: true, uploadedById: true, createdAt: true },
  },
};

/**
 * Published spot for `/spots/[slug]`.
 * The key may be the current slug or the legacy id. Callers redirect when
 * the key is not the stored slug.
 */
export async function getPublishedSpotByPublicKey(key: string) {
  if (!PUBLIC_SPOT_KEY.test(key)) return null;
  const bySlug = await prisma.spot.findUnique({
    where: { slug: key.toLowerCase() },
    include: GALLERY_INCLUDE,
  });
  if (bySlug) {
    return bySlug.status === PUBLISHED_STATUS ? bySlug : null;
  }
  const byId = await prisma.spot.findUnique({
    where: { id: key },
    include: GALLERY_INCLUDE,
  });
  if (!byId || byId.status !== PUBLISHED_STATUS) return null;
  return byId;
}

/** Any status, for the editor. Accepts the slug or the legacy id. */
export async function getSpotByPublicKey(key: string) {
  if (!PUBLIC_SPOT_KEY.test(key)) return null;
  const bySlug = await prisma.spot.findUnique({
    where: { slug: key.toLowerCase() },
    include: COVER_PHOTO_SELECTION,
  });
  if (bySlug) return bySlug;
  return prisma.spot.findUnique({
    where: { id: key },
    include: COVER_PHOTO_SELECTION,
  });
}

const CREATED_SPOT_INCLUDE = {
  photos: {
    orderBy: { createdAt: "asc" as const },
    select: { id: true, url: true, uploadedById: true, createdAt: true },
  },
};

function isUniqueViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

const PUBLIC_SPOT_KEY = /^[A-Za-z0-9_-]{1,80}$/;
const SPOT_ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

function createSpotId(): string {
  const bytes = randomBytes(24);
  let id = "c";
  for (let index = 0; index < 24; index += 1) {
    id += SPOT_ID_ALPHABET[bytes[index]! % SPOT_ID_ALPHABET.length];
  }
  return id;
}

function uniqueTargets(error: Prisma.PrismaClientKnownRequestError): string[] {
  const target = error.meta?.target;
  if (Array.isArray(target)) return target.map((item) => String(item));
  if (typeof target === "string") return [target];
  return [];
}

function isSlugConflict(error: unknown): boolean {
  return (
    isUniqueViolation(error) &&
    uniqueTargets(error).some((target) => target.toLowerCase().includes("slug"))
  );
}

async function allocateUniqueSlug(name: string, region: string | null, id: string) {
  const base = spotSlugFromName(name, { region, id });
  for (let occurrence = 1; occurrence < 500; occurrence += 1) {
    const candidate = spotSlugCandidate(base, occurrence);
    if (RESERVED_SPOT_SLUGS.has(candidate)) continue;
    const existing = await prisma.spot.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error("Could not allocate a spot slug");
}

type SpotInsert = {
  name: string;
  description: string;
  lat: number;
  lng: number;
  region: string | null;
  photoUrl: string | null;
  parking: string | null;
  parkingNote: string | null;
  accessibility: string | null;
  accessibilityNote: string | null;
  createdById: string | null;
  status: string;
  contributorName: string | null;
  clientRequestId: string | null;
  photos?: {
    create: { url: string; uploadedById: string }[];
  };
};

async function insertSpot(data: SpotInsert) {
  const id = createSpotId();
  let lastError: unknown;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = await allocateUniqueSlug(data.name, data.region, id);
    try {
      return await prisma.spot.create({
        data: { ...data, id, slug },
        include: CREATED_SPOT_INCLUDE,
      });
    } catch (error) {
      if (!isSlugConflict(error)) throw error;
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Could not allocate a spot slug");
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
  options?: { consumeRateLimit?: () => boolean; displayName?: string | null },
): Promise<CreateSpotResult> {
  assertIsraelCoordinates(input.lat, input.lng);
  const profile = await ensureProfile(userId, options?.displayName);
  const contributorName = cleanContributorName(
    options?.displayName ?? profile.displayName,
  );

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
    const spot = await insertSpot({
      name: input.name,
      description: input.description?.trim() ?? "",
      lat: input.lat,
      lng: input.lng,
      region: input.region ?? null,
      photoUrl: input.photoUrl ?? null,
      parking: input.parking ?? null,
      parkingNote: input.parkingNote ?? null,
      accessibility: input.accessibility ?? null,
      accessibilityNote: input.accessibilityNote ?? null,
      createdById: userId,
      status: PUBLISHED_STATUS,
      contributorName,
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

async function findAnonymousSuggestion(clientRequestId: string) {
  return prisma.spot.findFirst({
    where: { createdById: null, clientRequestId },
    include: CREATED_SPOT_INCLUDE,
  });
}

/**
 * Store a suggestion that is not public until an admin approves it.
 * There is no account, so the row has no owner and cannot be edited.
 */
export async function createSuggestion(
  input: SuggestSpotInput,
  options?: { consumeRateLimit?: () => boolean },
): Promise<CreateSpotResult> {
  assertIsraelCoordinates(input.lat, input.lng);

  if (input.clientRequestId) {
    const existing = await findAnonymousSuggestion(input.clientRequestId);
    if (existing) return { ok: true, created: false, spot: existing };
  }

  if (options?.consumeRateLimit && !options.consumeRateLimit()) {
    if (input.clientRequestId) {
      const existing = await findAnonymousSuggestion(input.clientRequestId);
      if (existing) return { ok: true, created: false, spot: existing };
    }
    return { ok: false, reason: "rate_limited" };
  }

  try {
    const spot = await insertSpot({
      name: input.name,
      description: input.description?.trim() ?? "",
      lat: input.lat,
      lng: input.lng,
      region: input.region?.trim() ? input.region.trim() : null,
      photoUrl: input.photoUrl ?? null,
      parking: input.parking ?? null,
      parkingNote: input.parkingNote ?? null,
      accessibility: input.accessibility ?? null,
      accessibilityNote: input.accessibilityNote ?? null,
      createdById: null,
      status: "pending",
      contributorName: cleanContributorName(input.contributorName),
      clientRequestId: input.clientRequestId ?? null,
    });
    return { ok: true, created: true, spot };
  } catch (error) {
    if (input.clientRequestId && isUniqueViolation(error)) {
      const existing = await findAnonymousSuggestion(input.clientRequestId);
      if (existing) return { ok: true, created: false, spot: existing };
    }
    throw error;
  }
}

export async function moderateSuggestion(
  id: string,
  status: "approved" | "rejected",
) {
  const updated = await prisma.spot.updateMany({
    where: { id, status: "pending" },
    data: { status },
  });
  if (updated.count !== 1) return null;
  return prisma.spot.findUnique({ where: { id } });
}

export async function updateSpot(
  id: string,
  userId: string,
  input: UpdateSpotInput,
) {
  const existing = await prisma.spot.findUnique({ where: { id } });
  if (!existing) return null;
  if (!isRecordOwner(userId, existing.createdById)) {
    if (existing.status !== "approved") return null;
    throw new Error("FORBIDDEN");
  }

  const lat = input.lat ?? existing.lat;
  const lng = input.lng ?? existing.lng;
  assertIsraelCoordinates(lat, lng);

  return prisma.spot.update({
    where: { id },
    data: {
      // The public slug is fixed at creation. A rename must not replace it.
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.lat !== undefined ? { lat: input.lat } : {}),
      ...(input.lng !== undefined ? { lng: input.lng } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
      ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl } : {}),
      ...(input.parking !== undefined ? { parking: input.parking } : {}),
      ...(input.parkingNote !== undefined
        ? { parkingNote: input.parkingNote }
        : {}),
      ...(input.accessibility !== undefined
        ? { accessibility: input.accessibility }
        : {}),
      ...(input.accessibilityNote !== undefined
        ? { accessibilityNote: input.accessibilityNote }
        : {}),
    },
  });
}

/**
 * Replace the editable fields of any spot. Does not check the caller —
 * the admin route has to reject non-admins before this runs.
 */
export async function adminUpdateSpot(id: string, input: AdminUpdateSpotInput) {
  const existing = await prisma.spot.findUnique({
    where: { id },
    include: {
      photos: {
        orderBy: { createdAt: "asc" },
        select: { id: true, url: true },
      },
    },
  });
  if (!existing) return null;

  assertIsraelCoordinates(input.lat, input.lng);

  const removeIds = [...new Set(input.removePhotoIds ?? [])];
  const known = new Set(existing.photos.map((photo) => photo.id));
  if (removeIds.some((photoId) => !known.has(photoId))) {
    throw new Error("UNKNOWN_PHOTO");
  }

  const { photoUrl: nextPhotoUrl, removedPhotoUrls } = resolveAdminSpotCover({
    requestedPhotoUrl: input.photoUrl ?? null,
    existingPhotoUrl: existing.photoUrl,
    photos: existing.photos,
    removePhotoIds: removeIds,
  });

  const spot = await prisma.$transaction(async (tx) => {
    if (removeIds.length > 0) {
      await tx.spotPhoto.deleteMany({
        where: { spotId: id, id: { in: removeIds } },
      });
    }
    return tx.spot.update({
      where: { id },
      data: {
        // The public slug is fixed at creation. A rename must not replace it.
        name: input.name,
        description: input.description.trim(),
        lat: input.lat,
        lng: input.lng,
        region: input.region ?? null,
        photoUrl: nextPhotoUrl,
        parking: input.parking ?? null,
        parkingNote: input.parkingNote ?? null,
        accessibility: input.accessibility ?? null,
        accessibilityNote: input.accessibilityNote ?? null,
        contributorName: cleanContributorName(input.contributorName),
        status: input.status,
      },
    });
  });

  return { spot, removedPhotoUrls };
}

export async function deleteSpot(id: string, userId: string) {
  const existing = await prisma.spot.findUnique({ where: { id } });
  if (!existing) return null;
  if (!isRecordOwner(userId, existing.createdById)) {
    if (existing.status !== "approved") return null;
    throw new Error("FORBIDDEN");
  }

  return prisma.spot.delete({ where: { id } });
}
