const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance between two WGS84 points (meters). */
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Compact Hebrew distance label for list UI. */
export function formatDistanceMeters(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "";
  if (meters < 1000) return `${Math.round(meters)} מ׳`;
  const km = meters / 1000;
  if (km < 10) {
    const rounded = Math.round(km * 10) / 10;
    return `${rounded.toFixed(1)} ק״מ`;
  }
  return `${Math.round(km)} ק״מ`;
}

export function sortSpotsByDistance<T extends { lat: number; lng: number }>(
  spots: T[],
  userLat: number,
  userLng: number,
): Array<T & { distanceMeters: number }> {
  return spots
    .map((spot) => ({
      ...spot,
      distanceMeters: haversineDistanceMeters(
        userLat,
        userLng,
        spot.lat,
        spot.lng,
      ),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
