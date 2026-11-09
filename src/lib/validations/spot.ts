import { z } from "zod";
import { isWithinIsraelBounds } from "@/lib/geo/israel";
import { cleanAmenityNote } from "@/lib/spot-amenities";
import {
  isSpotPhotoStorageUrl,
  isSuggestionPhotoUrl,
  MAX_PHOTOS_ON_CREATE,
} from "@/lib/spot-photo";
import {
  ACCESSIBILITY_VALUES,
  AMENITY_NOTE_MAX,
  PARKING_VALUES,
} from "@/types/spot";

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

const optionalChoice = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (value) => (value === "" ? null : value),
    z.enum(values).nullable().optional(),
  );

/** Blank notes are stored as null. Control characters are collapsed first. */
const optionalAmenityNote = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return value;
  const cleaned = cleanAmenityNote(value);
  return cleaned.length === 0 ? null : cleaned;
}, z.string().max(AMENITY_NOTE_MAX).nullable().optional());

const spotFields = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(1000),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  region: z.string().trim().max(80).optional().nullable(),
  photoUrl: httpsUrl.optional().nullable(),
  parking: optionalChoice(PARKING_VALUES),
  parkingNote: optionalAmenityNote,
  accessibility: optionalChoice(ACCESSIBILITY_VALUES),
  accessibilityNote: optionalAmenityNote,
  /** Gallery photos beyond the cover. Only objects uploaded through this site. */
  extraPhotoUrls: z
    .array(uploadedPhotoUrl)
    .max(MAX_PHOTOS_ON_CREATE - 1)
    .optional(),
  /** Client must confirm landscape-only UGC rules before create. */
  acceptedGuidelines: z.literal(true),
});

export const createSpotSchema = spotFields
  .extend({
    /** One id per submit click. Older clients omit it. */
    clientRequestId: z.uuid().optional(),
    /** The fast add form may omit the write-up. Edit still sends one. */
    description: z.string().trim().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
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

const optionalText = z.preprocess(
  (value) => (value == null || value === "" ? null : value),
  z.string().trim().max(1000).nullable().optional(),
);

const optionalCredit = z.preprocess(
  (value) => (value == null || value === "" ? null : value),
  z.string().trim().max(80).nullable().optional(),
);

const optionalPhoto = z.preprocess(
  (value) => (value == null || value === "" ? null : value),
  z.string().trim().max(2048).nullable().optional(),
);

/**
 * Anonymous suggestion. Description, photo, and credit are optional.
 * `website` is a honeypot and is not stored.
 */
export const suggestSpotSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    description: optionalText,
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    region: z.string().trim().max(80).optional().nullable(),
    photoUrl: optionalPhoto,
    parking: optionalChoice(PARKING_VALUES),
    parkingNote: optionalAmenityNote,
    accessibility: optionalChoice(ACCESSIBILITY_VALUES),
    accessibilityNote: optionalAmenityNote,
    contributorName: optionalCredit,
    clientRequestId: z.uuid().optional(),
    website: z.string().max(5000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.photoUrl && !isSuggestionPhotoUrl(data.photoUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["photoUrl"],
        message: "Photo must be uploaded through this site",
      });
    }
  });

export type CreateSpotInput = z.infer<typeof createSpotSchema>;
export type UpdateSpotInput = z.infer<typeof updateSpotSchema>;
export type SuggestSpotInput = z.infer<typeof suggestSpotSchema>;

export function assertIsraelCoordinates(lat: number, lng: number) {
  if (!isWithinIsraelBounds(lat, lng)) {
    throw new Error("Location must be within Israel bounds");
  }
}
