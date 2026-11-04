"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/** Same pin assets as the home map. */
const markerIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const SPOT_ZOOM = 15;

type SpotLocationMapProps = {
  lat: number;
  lng: number;
  label: string;
  markerTitle: string;
};

/**
 * One-finger touch scrolls the page. Pinch (two fingers) zooms and pans.
 * Mouse drag still moves the map; the wheel scrolls the page.
 */
function PageScrollGestures() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    // Leaflet sets `touch-action: none` when both drag and pinch are on,
    // which traps vertical scrolling. Keep pinch-zoom, let the page scroll.
    container.style.setProperty("touch-action", "pan-y pinch-zoom", "important");

    const onTouchStart = (event: TouchEvent) => {
      // A single finger must not start a map drag (that calls preventDefault).
      // Two fingers are handled by Leaflet's touchZoom, which also pans.
      if (event.touches.length < 2) {
        map.dragging.disable();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      // Fingers still down: keep one-finger drags off. All fingers up: mouse
      // dragging works again on a touchscreen laptop.
      if (event.touches.length === 0) {
        map.dragging.enable();
      } else if (event.touches.length < 2) {
        map.dragging.disable();
      }
    };

    container.addEventListener("touchstart", onTouchStart, {
      capture: true,
      passive: true,
    });
    container.addEventListener("touchend", onTouchEnd);
    container.addEventListener("touchcancel", onTouchEnd);
    return () => {
      container.removeEventListener("touchstart", onTouchStart, { capture: true });
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [map]);

  return null;
}

function MapLabel({ label }: { label: string }) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", label);
  }, [map, label]);

  return null;
}

function FitContainer() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

export default function SpotLocationMap({
  lat,
  lng,
  label,
  markerTitle,
}: SpotLocationMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={SPOT_ZOOM}
      minZoom={11}
      maxZoom={18}
      scrollWheelZoom={false}
      zoomControl={false}
      className="spot-location-map h-full w-full"
      style={{ height: "100%", width: "100%" }}
    >
      <ZoomControl position="topleft" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={OSM_TILES}
        maxZoom={19}
      />
      <PageScrollGestures />
      <MapLabel label={label} />
      <FitContainer />
      <Marker position={[lat, lng]} icon={markerIcon} title={markerTitle} alt="" />
    </MapContainer>
  );
}
