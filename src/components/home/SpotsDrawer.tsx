"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSpotSelection } from "@/components/home/SpotSelectionProvider";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type SpotsDrawerProps = {
  children: ReactNode;
  spotCount: number;
  setupNeeded?: boolean;
  setupNotice?: ReactNode;
};

export function SpotsDrawer({
  children,
  spotCount,
  setupNeeded,
  setupNotice,
}: SpotsDrawerProps) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(true);
  const heading = `${t("spots")} (${spotCount})`;
  const subscribeToFocus = useSpotSelection()?.subscribeToFocus;

  // On phones the drawer would cover the spot the map just centered on.
  // Desktop keeps its own height, so collapsing there is a no-op.
  useEffect(() => {
    return subscribeToFocus?.(() => setExpanded(false));
  }, [subscribeToFocus]);

  return (
    <div
      className={`pointer-events-none absolute z-30 flex flex-col border border-[var(--ember)]/25 bg-[var(--surface)] shadow-[0_-8px_32px_rgb(42_18_16/0.12)] backdrop-blur-md transition-[height,max-height] duration-300 ease-out ats-fade-in
        inset-x-0 bottom-0 border-x-0 border-b-0
        lg:inset-y-4 lg:inset-s-4 lg:inset-e-auto lg:bottom-auto lg:h-auto lg:max-h-[calc(100%-2rem)] lg:w-[min(100%,380px)] lg:border lg:shadow-[0_12px_40px_rgb(42_18_16/0.12)]
        ${expanded ? "h-[55dvh] max-h-[70dvh]" : "h-[28dvh] max-h-[28dvh]"} lg:!h-auto`}
    >
      <button
        type="button"
        className="pointer-events-auto flex w-full shrink-0 flex-col items-center gap-2 px-4 pb-2 pt-3 lg:hidden"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={expanded ? t("drawerCollapse") : t("drawerExpand")}
      >
        <span className="h-1 w-10 rounded-full bg-[var(--sand)]/25" aria-hidden />
        <span className="w-full text-start text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sand-muted)]">
          {heading}
        </span>
      </button>

      <div className="pointer-events-auto flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 lg:px-5 lg:pb-5 lg:pt-5">
        <h2 className="mb-3 hidden shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sand-muted)] lg:block">
          {heading}
        </h2>

        {setupNeeded && setupNotice ? (
          <div className="mb-3 shrink-0 border border-[var(--ember)]/40 bg-[var(--dusk-mid)]/60 p-3 text-sm text-[var(--sand-muted)] lg:mb-4">
            {setupNotice}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
