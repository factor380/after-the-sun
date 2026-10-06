"use client";

import { useEffect, useRef, useState } from "react";
import { haversineDistanceMeters } from "@/lib/geo/distance";
import { getMapCenter, subscribeMapCenter } from "@/lib/geo/map-center";
import { sunsetTime } from "@/lib/geo/sunset";

const MAP_MOVE_METERS = 15_000;
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 12_000,
  maximumAge: 30 * 60 * 1000,
};

type Mode = "pending" | "user" | "map";
type Coord = { lat: number; lng: number };

/**
 * One sunset label for the home map.
 * Shows the map center immediately, then replaces it with a granted location
 * if one arrives. Pans under 15 km are ignored. No watch and no permission prompt.
 */
export function useSunsetLabel(): string | null {
  const [label, setLabel] = useState<string | null>(null);
  const modeRef = useRef<Mode>("pending");
  const coordRef = useRef<Coord | null>(null);

  useEffect(() => {
    let cancelled = false;
    let permission: PermissionStatus | null = null;

    const show = (coord: Coord, mode: Mode) => {
      if (cancelled) return;
      modeRef.current = mode;
      coordRef.current = coord;
      setLabel(sunsetTime(coord.lat, coord.lng));
    };

    const showMap = () => {
      show(getMapCenter(), "map");
    };

    const showUser = (lat: number, lng: number) => {
      show({ lat, lng }, "user");
    };

    const requestGrantedPosition = () => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        showMap();
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          showUser(position.coords.latitude, position.coords.longitude);
        },
        () => {
          showMap();
        },
        GEO_OPTIONS,
      );
    };

    const unsubMap = subscribeMapCenter(() => {
      if (cancelled || modeRef.current !== "map") return;
      const next = getMapCenter();
      const prev = coordRef.current;
      if (
        prev &&
        haversineDistanceMeters(prev.lat, prev.lng, next.lat, next.lng) <
          MAP_MOVE_METERS
      ) {
        return;
      }
      show(next, "map");
    });

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const coord = coordRef.current;
      if (!coord || modeRef.current === "pending") return;
      setLabel(sunsetTime(coord.lat, coord.lng));
    };

    document.addEventListener("visibilitychange", onVisible);

    const start = async () => {
      // Map center is instant. A granted position replaces it when it arrives,
      // so a slow or missing GPS fix never leaves the chip blank.
      showMap();

      if (typeof navigator === "undefined" || !navigator.geolocation) return;

      const permissions = navigator.permissions;
      if (!permissions?.query) return;

      try {
        permission = await permissions.query({ name: "geolocation" });
      } catch {
        return;
      }
      if (cancelled) return;

      if (permission.state === "granted") requestGrantedPosition();

      permission.onchange = () => {
        if (cancelled || !permission) return;
        if (permission.state === "granted") requestGrantedPosition();
        else showMap();
      };
    };

    void start();

    return () => {
      cancelled = true;
      if (permission) permission.onchange = null;
      unsubMap();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return label;
}
