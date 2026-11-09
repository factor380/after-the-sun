import {
  normalizeAccessibility,
  normalizeParking,
  readAmenityNote,
} from "@/lib/spot-amenities";
import type { SpotPhotoItem, SpotSummary } from "@/types/spot";

type SpotPhotoRecord = {
  id: string;
  url: string;
  uploadedById: string;
  createdAt: Date | string;
};

type SpotRecord = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  region: string | null;
  photoUrl: string | null;
  createdById: string | null;
  createdAt: Date;
  /** Absent on records loaded before these columns existed. */
  parking?: string | null;
  parkingNote?: string | null;
  accessibility?: string | null;
  accessibilityNote?: string | null;
  photos?: SpotPhotoRecord[];
  _count?: { photos: number };
};

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

export function toPublicSpot(spot: SpotRecord): SpotSummary {
  const communityPhotos = spot.photos ?? [];
  const communityCount = spot._count?.photos ?? communityPhotos.length;

  return {
    id: spot.id,
    name: spot.name,
    description: spot.description,
    lat: spot.lat,
    lng: spot.lng,
    region: spot.region,
    photoUrl: spot.photoUrl ?? communityPhotos[0]?.url ?? null,
    photoCount: communityCount + (spot.photoUrl ? 1 : 0),
    createdAt: toIso(spot.createdAt),
    parking: normalizeParking(spot.parking),
    parkingNote: readAmenityNote(spot.parkingNote),
    accessibility: normalizeAccessibility(spot.accessibility),
    accessibilityNote: readAmenityNote(spot.accessibilityNote),
  };
}

export function toPublicSpotPhoto(photo: SpotPhotoRecord): SpotPhotoItem {
  return {
    id: photo.id,
    url: photo.url,
    uploadedById: photo.uploadedById,
    createdAt: toIso(photo.createdAt),
  };
}
