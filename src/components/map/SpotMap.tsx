"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { ISRAEL_CENTER, ISRAEL_DEFAULT_ZOOM, ISRAEL_MAX_BOUNDS } from "@/lib/geo/israel";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { SpotSummary } from "@/types/spot";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type SpotMapProps = {
  spots: SpotSummary[];
};

export default function SpotMap({ spots }: SpotMapProps) {
  const { t } = useLocale();

  return (
    <MapContainer
      center={[ISRAEL_CENTER.lat, ISRAEL_CENTER.lng]}
      zoom={ISRAEL_DEFAULT_ZOOM}
      maxBounds={ISRAEL_MAX_BOUNDS}
      maxBoundsViscosity={0.85}
      className="h-full w-full"
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {spots.map((spot) => (
        <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={markerIcon}>
          <Popup>
            <div className="space-y-1" dir="rtl">
              <p className="font-semibold text-sm">{spot.name}</p>
              {spot.region ? (
                <p className="text-xs text-neutral-600">{spot.region}</p>
              ) : null}
              <Link
                href={`/spots/${spot.id}`}
                className="text-xs font-medium text-amber-800 underline"
              >
                {t("viewSpot")}
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

type LocationPickerProps = {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
};

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({ lat, lng, onPick }: LocationPickerProps) {
  return (
    <MapContainer
      center={[
        lat ?? ISRAEL_CENTER.lat,
        lng ?? ISRAEL_CENTER.lng,
      ]}
      zoom={9}
      maxBounds={ISRAEL_MAX_BOUNDS}
      maxBoundsViscosity={0.85}
      className="h-64 w-full rounded-sm"
      style={{ height: "16rem", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      {lat !== null && lng !== null ? (
        <Marker position={[lat, lng]} icon={markerIcon} />
      ) : null}
    </MapContainer>
  );
}
