"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { googleMapsNavigateUrl, wazeNavigateUrl } from "@/lib/geo/navigate";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type NavigateToSpotProps = {
  lat: number;
  lng: number;
};

export default function NavigateToSpot({ lat, lng }: NavigateToSpotProps) {
  const { t, dir } = useLocale();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const primaryRef = useRef<HTMLAnchorElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    previouslyFocused.current?.focus?.();
  }, []);

  const openSheet = useCallback(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    primaryRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const wazeHref = wazeNavigateUrl(lat, lng);
  const mapsHref = googleMapsNavigateUrl(lat, lng);

  return (
    <div className="mt-8 md:hidden">
      <button
        type="button"
        onClick={openSheet}
        className="inline-block bg-[var(--ember)] px-5 py-3 text-sm font-medium text-white transition hover:brightness-110"
      >
        {t("navigateToSpot")}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[1100] flex items-end justify-center"
          role="presentation"
        >
          <button
            type="button"
            aria-label={t("navigateCancel")}
            className="absolute inset-0 bg-[var(--ink)]/40"
            onClick={close}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            dir={dir}
            className="relative z-10 w-full max-w-lg border-t border-[var(--line)] bg-[var(--surface)] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-8px_32px_rgb(42_18_16_/0.12)]"
          >
            <h2
              id={titleId}
              className="font-[family-name:var(--font-display)] text-xl text-[var(--sand)]"
            >
              {t("navigateChooseApp")}
            </h2>

            <div className="mt-4 flex flex-col gap-3">
              <a
                ref={primaryRef}
                href={wazeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[var(--ember)] px-5 py-3 text-center text-sm font-medium text-white transition hover:brightness-110"
                onClick={close}
              >
                {t("navigateWaze")}
              </a>
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[var(--line)] bg-[var(--dusk-deep)] px-5 py-3 text-center text-sm font-medium text-[var(--sand)] transition hover:bg-[var(--dusk-mid)]"
                onClick={close}
              >
                {t("navigateGoogleMaps")}
              </a>
              <button
                type="button"
                onClick={close}
                className="px-5 py-3 text-sm text-[var(--sand-muted)] transition hover:text-[var(--sand)]"
              >
                {t("navigateCancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
