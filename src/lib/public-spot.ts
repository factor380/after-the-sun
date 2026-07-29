type SpotRecord = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  region: string | null;
  photoUrl: string | null;
  createdById: string;
  createdAt: Date;
};

export function toPublicSpot(spot: SpotRecord) {
  return {
    id: spot.id,
    name: spot.name,
    description: spot.description,
    lat: spot.lat,
    lng: spot.lng,
    region: spot.region,
    photoUrl: spot.photoUrl,
    createdAt:
      spot.createdAt instanceof Date
        ? spot.createdAt.toISOString()
        : spot.createdAt,
  };
}
