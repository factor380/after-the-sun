"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import {
  PhotoCountBadge,
  SpotThumbnail,
} from "@/components/spots/SpotThumbnail";
import { ISRAEL_CENTER, ISRAEL_DEFAULT_ZOOM, ISRAEL_MAX_BOUNDS } from "@/lib/geo/israel";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
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

const LIGHT_TILES =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const DARK_TILES =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

function BasemapTiles() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <TileLayer
      key={dark ? "dark" : "light"}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      url={dark ? DARK_TILES : LIGHT_TILES}
    />
  );
}

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
      zoomControl={false}
    >
      <ZoomControl position="topleft" />
      <BasemapTiles />
      {spots.map((spot) => (
        <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={markerIcon}>
          <Popup
            className="spot-popup"
            minWidth={224}
            maxWidth={224}
            autoPanPadding={[24, 24]}
          >
            <div dir="rtl" className="w-56">
              {spot.photoUrl ? (
                <Link
                  href={`/spots/${spot.id}`}
                  aria-label={spot.name}
                  className="relative block h-32 w-full overflow-hidden bg-[var(--dusk-mid)]"
                >
                  <SpotThumbnail
                    url={spot.photoUrl}
                    alt={spot.name}
                    className="h-full w-full"
                  />
                  <PhotoCountBadge count={spot.photoCount} />
                </Link>
              ) : null}
              <div className="space-y-1 px-3 py-2.5">
                <p className="font-semibold text-sm text-[var(--sand)]">
                  {spot.name}
                </p>
                {spot.region ? (
                  <p className="text-xs text-[var(--sand-muted)]">{spot.region}</p>
                ) : null}
                <Link
                  href={`/spots/${spot.id}`}
                  className="inline-block text-xs font-medium text-[var(--ember)] underline"
                >
                  {t("viewSpot")}
                </Link>
              </div>
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
      <BasemapTiles />
      <ClickHandler onPick={onPick} />
      {lat !== null && lng !== null ? (
        <Marker position={[lat, lng]} icon={markerIcon} />
      ) : null}
    </MapContainer>
  );
}
