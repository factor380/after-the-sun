import { z } from "zod";
import { isWithinIsraelBounds } from "@/lib/geo/israel";
import { isSpotPhotoStorageUrl, MAX_PHOTOS_ON_CREATE } from "@/lib/spot-photo";

const httpsUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Photo URL must use https");

const uploadedPhotoUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(isSpotPhotoStorageUrl, "Photo must be uploaded through this site");

const spotFields = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(1000),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  region: z.string().trim().max(80).optional().nullable(),
  photoUrl: httpsUrl.optional().nullable(),
  /** Gallery photos beyond the cover. Only objects uploaded through this site. */
  extraPhotoUrls: z
    .array(uploadedPhotoUrl)
    .max(MAX_PHOTOS_ON_CREATE - 1)
    .optional(),
  /** Client must confirm landscape-only UGC rules before create. */
  acceptedGuidelines: z.literal(true),
});

export const createSpotSchema = spotFields.superRefine((data, ctx) => {
  const cover = data.photoUrl ?? null;
  const extras = data.extraPhotoUrls ?? [];
  if (cover && extras.includes(cover)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["extraPhotoUrls"],
      message: "Duplicate photo",
    });
  }
});

export const updateSpotSchema = spotFields
  .omit({ acceptedGuidelines: true, extraPhotoUrls: true })
  .partial();

export type CreateSpotInput = z.infer<typeof createSpotSchema>;
export type UpdateSpotInput = z.infer<typeof updateSpotSchema>;

export function assertIsraelCoordinates(lat: number, lng: number) {
  if (!isWithinIsraelBounds(lat, lng)) {
    throw new Error("Location must be within Israel bounds");
  }
}
