import { z } from "zod";
import { isSpotPhotoStorageUrl } from "@/lib/spot-photo";

export const addSpotPhotoSchema = z.object({
  url: z
    .string()
    .trim()
    .max(2048)
    .refine(isSpotPhotoStorageUrl, "Photo must be uploaded through this site"),
  /** Client must confirm landscape-only UGC rules before contributing. */
  acceptedGuidelines: z.literal(true),
});

export type AddSpotPhotoInput = z.infer<typeof addSpotPhotoSchema>;
