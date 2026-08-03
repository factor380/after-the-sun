"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  formatDistanceMeters,
  sortSpotsByDistance,
} from "@/lib/geo/distance";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { SpotSummary } from "@/types/spot";

type GeoStatus =
  | "idle"
  | "locating"
  | "ready"
  | "denied"
  | "unavailable"
  | "error";

type SpotWithDistance = SpotSummary & { distanceMeters?: number };

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 12_000,
  maximumAge: 60_000,
};

export function SpotCard({
  spot,
  distanceMeters,
}: {
  spot: SpotSummary;
  distanceMeters?: number;
}) {
  return (
    <Link
      href={`/spots/${spot.id}`}
      className="block border-b border-white/10 py-3 transition hover:bg-white/5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-[family-name:var(--font-display)] text-lg text-[var(--sand)]">
          {spot.name}
        </p>
        {distanceMeters != null ? (
          <span className="shrink-0 text-xs tabular-nums text-[var(--ember)]">
            {formatDistanceMeters(distanceMeters)}
          </span>
        ) : null}
      </div>
      {spot.region ? (
        <p className="text-sm text-[var(--sand-muted)]">{spot.region}</p>
      ) : null}
      <p className="mt-1 line-clamp-2 text-sm text-[var(--sand-muted)]">
        {spot.description}
      </p>
    </Link>
  );
}

function LocationSortBar({
  status,
  onRequest,
}: {
  status: GeoStatus;
  onRequest: () => void;
}) {
  const { t } = useLocale();

  if (status === "ready") {
    return (
      <p className="mb-2 text-xs text-[var(--sand-muted)]">
        {t("sortedByDistance")}
      </p>
    );
  }

  if (status === "locating") {
    return (
      <p className="mb-2 text-xs text-[var(--sand-muted)]" aria-live="polite">
        {t("locatingPosition")}
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="mb-2 text-xs text-[var(--sand-muted)]">{t("locationDenied")}</p>
    );
  }

  if (status === "unavailable") {
    return (
      <p className="mb-2 text-xs text-[var(--sand-muted)]">
        {t("locationUnavailable")}
      </p>
    );
  }

  if (status === "error") {
    return (
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-xs text-[var(--sand-muted)]">{t("locationError")}</p>
        <button
          type="button"
          onClick={onRequest}
          className="text-xs font-medium text-[var(--ember)] underline-offset-2 hover:underline"
        >
          {t("retryLocation")}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onRequest}
      className="mb-2 w-full border border-white/20 px-3 py-2 text-start text-xs font-medium text-[var(--sand)] transition hover:border-white/35 hover:bg-white/5"
    >
      {t("sortByDistance")}
    </button>
  );
}

export function SpotList({ spots }: { spots: SpotSummary[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const applyPositionSuccess = (position: GeolocationPosition) => {
    setUserPos({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });
    setStatus("ready");
  };

  const applyPositionError = (error: GeolocationPositionError) => {
    if (error.code === error.PERMISSION_DENIED) {
      setStatus("denied");
    } else if (error.code === error.POSITION_UNAVAILABLE) {
      setStatus("unavailable");
    } else {
      setStatus("error");
    }
  };

  const requestLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }

    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      applyPositionSuccess,
      applyPositionError,
      GEO_OPTIONS,
    );
  };

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }

    let cancelled = false;

    const reuseGrantedPermission = () => {
      if (cancelled) return;
      setStatus("locating");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return;
          applyPositionSuccess(position);
        },
        (error) => {
          if (cancelled) return;
          applyPositionError(error);
        },
        GEO_OPTIONS,
      );
    };

    const permissions = navigator.permissions;
    if (!permissions?.query) return;

    permissions
      .query({ name: "geolocation" })
      .then((result) => {
        if (cancelled) return;
        if (result.state === "granted") {
          reuseGrantedPermission();
        } else if (result.state === "denied") {
          setStatus("denied");
        }
      })
      .catch(() => {
        /* Permissions API unsupported — wait for explicit user action */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const displaySpots: SpotWithDistance[] =
    userPos && status === "ready"
      ? sortSpotsByDistance(spots, userPos.lat, userPos.lng)
      : spots;

  const virtualizer = useVirtualizer({
    count: displaySpots.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 6,
  });

  if (spots.length === 0) {
    return (
      <p className="py-6 text-sm text-[var(--sand-muted)]">{t("spotsEmpty")}</p>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <LocationSortBar status={status} onRequest={requestLocation} />
      <div
        ref={parentRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const spot = displaySpots[item.index];
            return (
              <div
                key={spot.id}
                data-index={item.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 start-0 w-full"
                style={{ transform: `translateY(${item.start}px)` }}
              >
                <SpotCard
                  spot={spot}
                  distanceMeters={spot.distanceMeters}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
