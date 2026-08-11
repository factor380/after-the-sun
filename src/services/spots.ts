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
  });
}

export async function listSpotsByUser(userId: string) {
  return prisma.spot.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSpotById(id: string) {
  return prisma.spot.findUnique({ where: { id } });
}

export async function createSpot(userId: string, input: CreateSpotInput) {
  assertIsraelCoordinates(input.lat, input.lng);
  await ensureProfile(userId);

  return prisma.spot.create({
    data: {
      name: input.name,
      description: input.description,
      lat: input.lat,
      lng: input.lng,
      region: input.region ?? null,
      photoUrl: input.photoUrl ?? null,
      createdById: userId,
    },
  });
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
