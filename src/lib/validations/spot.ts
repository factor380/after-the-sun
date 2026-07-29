import { z } from "zod";
import { isWithinIsraelBounds } from "@/lib/geo/israel";

export const createSpotSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(1000),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  region: z.string().trim().max(80).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});

export const updateSpotSchema = createSpotSchema.partial();

export type CreateSpotInput = z.infer<typeof createSpotSchema>;
export type UpdateSpotInput = z.infer<typeof updateSpotSchema>;

export function assertIsraelCoordinates(lat: number, lng: number) {
  if (!isWithinIsraelBounds(lat, lng)) {
    throw new Error("Location must be within Israel bounds");
  }
}
