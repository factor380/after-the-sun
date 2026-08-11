import { prisma } from "@/lib/prisma";
import type { CreateReportInput } from "@/lib/validations/report";
import { ensureProfile } from "@/services/spots";

export async function createSpotReport(
  spotId: string,
  reporterId: string,
  input: CreateReportInput,
) {
  const spot = await prisma.spot.findUnique({
    where: { id: spotId },
    select: { id: true },
  });
  if (!spot) return null;

  await ensureProfile(reporterId);

  return prisma.spotReport.create({
    data: {
      spotId,
      reporterId,
      reason: input.reason,
      details: input.details?.trim() ? input.details.trim() : null,
    },
  });
}
