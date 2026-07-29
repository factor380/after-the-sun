/** Default map framing for Israel sunset spots */
export const ISRAEL_CENTER = {
  lat: 31.5,
  lng: 34.85,
} as const;

export const ISRAEL_DEFAULT_ZOOM = 8;

/** Soft max bounds so pickers stay near Israel */
export const ISRAEL_MAX_BOUNDS: [[number, number], [number, number]] = [
  [29.3, 33.9],
  [33.5, 36.0],
];

export function isWithinIsraelBounds(lat: number, lng: number): boolean {
  const [[south, west], [north, east]] = ISRAEL_MAX_BOUNDS;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}
