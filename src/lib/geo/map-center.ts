import { ISRAEL_CENTER } from "@/lib/geo/israel";

export type MapCenter = { lat: number; lng: number };

let center: MapCenter = { lat: ISRAEL_CENTER.lat, lng: ISRAEL_CENTER.lng };
const listeners = new Set<() => void>();

export function getMapCenter(): MapCenter {
  return center;
}

/** Latest map center after a pan or zoom settles. Not called during the gesture. */
export function publishMapCenter(lat: number, lng: number): void {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  if (center.lat === lat && center.lng === lng) return;
  center = { lat, lng };
  for (const listener of listeners) listener();
}

export function subscribeMapCenter(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
