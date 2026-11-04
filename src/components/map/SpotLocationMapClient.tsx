"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const SpotLocationMap = dynamic(() => import("@/components/map/SpotLocationMap"), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapLoading() {
  const { t } = useLocale();
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--dusk-mid)] text-sm text-[var(--sand)]">
      {t("loadingMap")}
    </div>
  );
}

type SpotLocationMapClientProps = {
  lat: number;
  lng: number;
  name: string;
};

export default function SpotLocationMapClient({
  lat,
  lng,
  name,
}: SpotLocationMapClientProps) {
  const { t } = useLocale();
  const frameRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const label = `${t("spotMapLabel")}: ${name}`;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || visible) return;

    if (typeof IntersectionObserver === "undefined") {
      const frameId = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frameId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, [visible]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return (
    <figure className="mt-8">
      <div
        ref={frameRef}
        dir="ltr"
        className="h-64 w-full overflow-hidden rounded-sm border border-[var(--line)] md:h-80"
      >
        {visible ? (
          <SpotLocationMap lat={lat} lng={lng} label={label} markerTitle={name} />
        ) : (
          <MapLoading />
        )}
      </div>
      <figcaption className="spot-map-gesture-hint mt-2 text-xs leading-relaxed text-[var(--sand-muted)]">
        {t("mapGestureHint")}
      </figcaption>
    </figure>
  );
}
