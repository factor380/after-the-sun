export const PARKING_VALUES = ["yes", "paid", "no"] as const;
export type Parking = (typeof PARKING_VALUES)[number];

export const ACCESSIBILITY_VALUES = ["yes", "partial", "no"] as const;
export type Accessibility = (typeof ACCESSIBILITY_VALUES)[number];

/** pending is hidden, approved is public, rejected stays hidden. */
export const SPOT_STATUS_VALUES = ["pending", "approved", "rejected"] as const;
export type SpotStatus = (typeof SPOT_STATUS_VALUES)[number];

export function isSpotStatus(value: string): value is SpotStatus {
  return (SPOT_STATUS_VALUES as readonly string[]).includes(value);
}

/** Contributor notes stay short. The database check uses the same limit. */
export const AMENITY_NOTE_MAX = 200;

export type SpotSummary = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  region: string | null;
  /** Cover image: the spot's own photo, falling back to the oldest community photo. */
  photoUrl: string | null;
  /** Total images available for the spot, cover included. */
  photoCount: number;
  createdAt: string;
  /** Null when unknown. `no` is stored but not shown as an icon. */
  parking: Parking | null;
  parkingNote: string | null;
  /** Null when unknown. `no` is stored but not shown as an icon. */
  accessibility: Accessibility | null;
  accessibilityNote: string | null;
};

export type SpotPhotoItem = {
  id: string;
  url: string;
  uploadedById: string;
  createdAt: string;
};
