"use client";

import { useEffect, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import {
  PhotoCountBadge,
  SpotThumbnail,
} from "@/components/spots/SpotThumbnail";
import { useSpotSelection } from "@/components/home/SpotSelectionProvider";
import {
  ISRAEL_BROWSE_BOUNDS,
  ISRAEL_CENTER,
  ISRAEL_DEFAULT_ZOOM,
  ISRAEL_MAX_BOUNDS,
} from "@/lib/geo/israel";
import { publishMapCenter } from "@/lib/geo/map-center";
import type { GeocodeResult } from "@/lib/geo/geocode";
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

const selectedMarkerIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "spot-marker-selected",
});

const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

function BasemapTiles() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url={OSM_TILES}
      maxZoom={19}
    />
  );
}

type SpotMapProps = {
  spots: SpotSummary[];
};

function SelectionController({
  spot,
  focusNonce,
  onFocus,
}: {
  spot: SpotSummary | null;
  focusNonce: number;
  onFocus: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!spot) return;
    // Pan only: the zoom level stays under the user's control (double click).
    map.panTo([spot.lat, spot.lng], { animate: true, duration: 0.5 });
    onFocus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot?.id, focusNonce, map]);

  return null;
}

function DeselectOnMapClick({ onDeselect }: { onDeselect: () => void }) {
  useMapEvents({
    click() {
      onDeselect();
    },
  });
  return null;
}

function MapCenterReporter() {
  const map = useMap();

  useEffect(() => {
    const publish = () => {
      const next = map.getCenter();
      publishMapCenter(next.lat, next.lng);
    };
    publish();
    map.on("moveend", publish);
    return () => {
      map.off("moveend", publish);
    };
  }, [map]);

  return null;
}

/** Shared selection when the map sits inside a provider, local state otherwise. */
function useMapSelection() {
  const shared = useSpotSelection();
  const [localState, setLocalState] = useState<{
    id: string | null;
    nonce: number;
  }>({ id: null, nonce: 0 });

  if (shared) return shared;

  return {
    selectedId: localState.id,
    focusNonce: localState.nonce,
    select: (id: string) =>
      setLocalState((prev) => ({ id, nonce: prev.nonce + 1 })),
    clear: () =>
      setLocalState((prev) => (prev.id === null ? prev : { ...prev, id: null })),
  };
}

export default function SpotMap({ spots }: SpotMapProps) {
  const { t } = useLocale();
  const { selectedId, focusNonce, select, clear } = useMapSelection();
  const markerRefs = useRef(new Map<string, L.Marker>());
  const selectedSpot = spots.find((spot) => spot.id === selectedId) ?? null;

  // Leaflet popup events fire before React re-renders, so the ref carries the
  // pending selection too.
  const selectedIdRef = useRef<string | null>(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const selectSpot = (id: string) => {
    selectedIdRef.current = id;
    select(id);
  };

  const clearSelection = () => {
    selectedIdRef.current = null;
    clear();
  };

  return (
    <MapContainer
      center={[ISRAEL_CENTER.lat, ISRAEL_CENTER.lng]}
      zoom={ISRAEL_DEFAULT_ZOOM}
      maxBounds={ISRAEL_BROWSE_BOUNDS}
      maxBoundsViscosity={0.85}
      className="h-full w-full"
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
      zoomControl={false}
    >
      <ZoomControl position="topleft" />
      <BasemapTiles />
      <MapCenterReporter />
      <SelectionController
        spot={selectedSpot}
        focusNonce={focusNonce}
        onFocus={() => {
          if (selectedSpot) markerRefs.current.get(selectedSpot.id)?.openPopup();
        }}
      />
      <DeselectOnMapClick onDeselect={clearSelection} />
      {selectedSpot ? (
        <CircleMarker
          center={[selectedSpot.lat, selectedSpot.lng]}
          radius={20}
          className="spot-marker-halo"
          interactive={false}
          pathOptions={{ weight: 2 }}
        />
      ) : null}
      {spots.map((spot) => {
        const selected = spot.id === selectedId;

        return (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            icon={selected ? selectedMarkerIcon : markerIcon}
            zIndexOffset={selected ? 1000 : 0}
            ref={(instance) => {
              const refs = markerRefs.current;
              if (instance) refs.set(spot.id, instance);
              return () => {
                refs.delete(spot.id);
              };
            }}
            eventHandlers={{
              click() {
                selectSpot(spot.id);
              },
              popupclose() {
                // Runs after a click on another marker has queued its own
                // selection, so switching spots does not clear it.
                queueMicrotask(() => {
                  if (selectedIdRef.current === spot.id) clearSelection();
                });
              },
            }}
          >
            <Popup
              className="spot-popup"
              minWidth={224}
              maxWidth={224}
              autoPan={false}
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
                  <p className="font-[family-name:var(--font-display)] text-sm font-medium text-[var(--sand)]">
                    {spot.name}
                  </p>
                  {spot.region ? (
                    <p className="text-xs text-[var(--sand-muted)]">
                      {spot.region}
                    </p>
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
        );
      })}
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

type FlyTarget = { lat: number; lng: number; zoom: number } | null;

function MapController({ target }: { target: FlyTarget }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], target.zoom, { duration: 0.8 });
    }
  }, [target, map]);
  return null;
}

const SEARCH_DEBOUNCE_MS = 350;

function PlaceSearch({
  onSelect,
}: {
  onSelect: (result: GeocodeResult) => void;
}) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (trimmed.length < 2) {
        setResults([]);
        setMessage(null);
        setSearching(false);
        return;
      }

      setSearching(true);
      setMessage(null);
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          setResults([]);
          setMessage(t("searchError"));
          return;
        }
        const data = (await res.json()) as { results?: GeocodeResult[] };
        const next = Array.isArray(data.results) ? data.results : [];
        setResults(next);
        setMessage(next.length === 0 ? t("searchNoResults") : null);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setResults([]);
        setMessage(t("searchError"));
      } finally {
        setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, t]);

  // Keep Leaflet from hijacking clicks/scroll over the search UI.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
  }, []);

  return (
    <div
      ref={boxRef}
      className="absolute inset-x-2 top-2 z-[1000]"
      dir="rtl"
    >
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          aria-label={t("searchPlaceLabel")}
          placeholder={t("searchPlacePlaceholder")}
          className="w-full rounded-sm border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--sand)] shadow-md outline-none focus:border-[var(--ember)]"
        />
        {searching ? (
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-xs text-[var(--sand-muted)]">
            {t("searching")}
          </span>
        ) : null}
      </div>

      {open && (results.length > 0 || message) ? (
        <div className="mt-1 max-h-48 overflow-auto rounded-sm border border-[var(--line)] bg-[var(--surface)] shadow-lg">
          {results.length > 0 ? (
            <ul>
              {results.map((result, index) => (
                <li key={`${result.lat},${result.lng},${index}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onSelect(result);
                      setQuery(result.label);
                      setResults([]);
                      setOpen(false);
                    }}
                    className="block w-full px-3 py-2 text-start text-sm text-[var(--sand)] transition hover:bg-[var(--dusk-mid)]"
                  >
                    {result.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-sm text-[var(--sand-muted)]">
              {message}
            </p>
          )}
        </div>
      ) : null}

      <p className="mt-1 text-[10px] text-[var(--sand-muted)]">
        {t("poweredByGeoapify")}
      </p>
    </div>
  );
}

export function LocationPicker({ lat, lng, onPick }: LocationPickerProps) {
  const { t } = useLocale();
  const [flyTarget, setFlyTarget] = useState<FlyTarget>(null);

  return (
    <div className="relative h-64 w-full">
      <MapContainer
        center={[lat ?? ISRAEL_CENTER.lat, lng ?? ISRAEL_CENTER.lng]}
        zoom={lat !== null && lng !== null ? 14 : 9}
        maxBounds={ISRAEL_MAX_BOUNDS}
        maxBoundsViscosity={0.85}
        className="h-64 w-full rounded-sm"
        style={{ height: "16rem", width: "100%" }}
        scrollWheelZoom
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <BasemapTiles />
        <ClickHandler onPick={onPick} />
        <MapController target={flyTarget} />
        {lat !== null && lng !== null ? (
          <Marker
            position={[lat, lng]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend(e) {
                const marker = e.target as L.Marker;
                const { lat: nextLat, lng: nextLng } = marker.getLatLng();
                onPick(nextLat, nextLng);
              },
            }}
          />
        ) : null}
      </MapContainer>

      <PlaceSearch
        onSelect={(result) => {
          onPick(result.lat, result.lng);
          setFlyTarget({ lat: result.lat, lng: result.lng, zoom: 15 });
        }}
      />

      <p className="pointer-events-none absolute inset-x-2 bottom-2 z-[1000] rounded-sm bg-[var(--dusk-deep)]/70 px-2 py-1 text-center text-[11px] text-[var(--sand)]">
        {t("dragMarkerHint")}
      </p>
    </div>
  );
}
