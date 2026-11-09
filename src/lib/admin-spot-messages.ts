import type { ZodError } from "zod";
import { dictionary } from "@/lib/i18n/dictionaries";

/** First failing field, in Hebrew. Never includes the allowlist or raw input. */
export function adminSpotValidationMessage(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return dictionary.adminInvalidSpot;
  const field = String(issue.path[0] ?? "");

  if (field === "name") {
    return issue.code === "too_big"
      ? dictionary.adminNameTooLong
      : dictionary.adminNameTooShort;
  }
  if (field === "description") return dictionary.adminDescriptionTooLong;
  if (field === "region") return dictionary.adminRegionTooLong;
  if (field === "contributorName") return dictionary.adminContributorTooLong;
  if (field === "status") return dictionary.adminStatusInvalid;
  if (field === "photoUrl") return dictionary.adminPhotoInvalid;
  if (field === "lat" || field === "lng") return dictionary.adminCoordinatesInvalid;
  if (field === "parkingNote" || field === "accessibilityNote") {
    return issue.code === "too_big"
      ? dictionary.adminNoteTooLong
      : dictionary.adminAmenitiesInvalid;
  }
  if (field === "parking" || field === "accessibility") {
    return dictionary.adminAmenitiesInvalid;
  }
  if (field === "removePhotoIds") return dictionary.adminUnknownPhoto;
  return dictionary.adminInvalidSpot;
}
