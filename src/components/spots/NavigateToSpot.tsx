"use client";

import { useCallback, type MouseEvent } from "react";
import {
  appleMapsNavigateUrl,
  geoNavigateUrl,
  isIosUserAgent,
} from "@/lib/geo/navigate";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type NavigateToSpotProps = {
  lat: number;
  lng: number;
  name?: string;
};

export default function NavigateToSpot({ lat, lng, name }: NavigateToSpotProps) {
  const { t } = useLocale();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (!isIosUserAgent(navigator.userAgent)) return;
      event.preventDefault();
      window.location.href = appleMapsNavigateUrl(lat, lng);
    },
    [lat, lng],
  );

  return (
    <div className="mt-8 md:hidden">
      <a
        href={geoNavigateUrl(lat, lng, name)}
        onClick={handleClick}
        className="inline-flex items-center gap-2 bg-[var(--ember)] px-5 py-3 text-sm font-medium text-white transition hover:brightness-110"
      >
        {t("navigateToSpot")}
      </a>
    </div>
  );
}
