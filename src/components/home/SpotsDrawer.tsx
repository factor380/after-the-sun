"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { SunsetChip } from "@/components/home/SunsetChip";
import { useSunsetLabel } from "@/components/home/useSunsetLabel";
import { useSpotSelection } from "@/components/home/SpotSelectionProvider";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type SpotsDrawerProps = {
  children: ReactNode;
  spotCount: number;
  setupNeeded?: boolean;
  setupNotice?: ReactNode;
};

type DrawerSnap = "hidden" | "collapsed" | "expanded";

const HIDDEN_HEIGHT_PX = 52;
const COLLAPSED_RATIO = 0.28;
const EXPANDED_RATIO = 0.85;
const DRAG_THRESHOLD_PX = 8;

const SNAP_HEIGHT_CLASS: Record<DrawerSnap, string> = {
  hidden: "h-[52px] max-h-[52px]",
  collapsed: "h-[28dvh] max-h-[28dvh]",
  expanded: "h-[85dvh] max-h-[85dvh]",
};

const CHIP_BOTTOM_CLASS: Record<DrawerSnap, string> = {
  hidden: "bottom-[62px]",
  collapsed: "bottom-[calc(28dvh+10px)]",
  expanded: "bottom-[calc(85dvh+10px)]",
};

function snapHeightPx(snap: DrawerSnap, viewportHeight: number): number {
  switch (snap) {
    case "hidden":
      return HIDDEN_HEIGHT_PX;
    case "collapsed":
      return viewportHeight * COLLAPSED_RATIO;
    case "expanded":
      return viewportHeight * EXPANDED_RATIO;
  }
}

function nearestSnap(heightPx: number, viewportHeight: number): DrawerSnap {
  const candidates: DrawerSnap[] = ["hidden", "collapsed", "expanded"];
  let best: DrawerSnap = "collapsed";
  let bestDist = Infinity;

  for (const snap of candidates) {
    const dist = Math.abs(snapHeightPx(snap, viewportHeight) - heightPx);
    if (dist < bestDist) {
      bestDist = dist;
      best = snap;
    }
  }

  return best;
}

function nextSnap(current: DrawerSnap): DrawerSnap {
  if (current === "hidden") return "collapsed";
  if (current === "collapsed") return "expanded";
  return "hidden";
}

function drawerAriaLabel(
  snap: DrawerSnap,
  t: (key: "drawerExpand" | "drawerCollapse" | "drawerHide") => string,
): string {
  if (snap === "hidden") return t("drawerExpand");
  if (snap === "expanded") return t("drawerHide");
  return t("drawerExpand");
}

export function SpotsDrawer({
  children,
  spotCount,
  setupNeeded,
  setupNotice,
}: SpotsDrawerProps) {
  const { t } = useLocale();
  const sunset = useSunsetLabel();
  const [snap, setSnap] = useState<DrawerSnap>("collapsed");
  const [dragHeightPx, setDragHeightPx] = useState<number | null>(null);
  const dragRef = useRef<{
    startY: number;
    startHeight: number;
    currentHeight: number;
    moved: boolean;
  } | null>(null);

  const heading = `${t("spots")} (${spotCount})`;
  const subscribeToFocus = useSpotSelection()?.subscribeToFocus;

  // On phones the drawer would cover the spot the map just centered on.
  // Desktop keeps its own height, so collapsing there is a no-op.
  useEffect(() => {
    return subscribeToFocus?.(() => setSnap("collapsed"));
  }, [subscribeToFocus]);

  const getCurrentHeightPx = useCallback(() => {
    if (typeof window === "undefined") return snapHeightPx(snap, 800);
    return snapHeightPx(snap, window.innerHeight);
  }, [snap]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      const startHeight = getCurrentHeightPx();
      dragRef.current = {
        startY: event.clientY,
        startHeight,
        currentHeight: startHeight,
        moved: false,
      };
      setDragHeightPx(startHeight);
    },
    [getCurrentHeightPx],
  );

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    const deltaY = drag.startY - event.clientY;
    if (Math.abs(deltaY) > DRAG_THRESHOLD_PX) {
      drag.moved = true;
    }

    const viewportHeight = window.innerHeight;
    const maxHeight = viewportHeight * EXPANDED_RATIO;
    const nextHeight = Math.min(
      maxHeight,
      Math.max(HIDDEN_HEIGHT_PX, drag.startHeight + deltaY),
    );
    drag.currentHeight = nextHeight;
    setDragHeightPx(nextHeight);
  }, []);

  const finishDrag = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;

    if (!drag) return;

    if (!drag.moved) {
      setDragHeightPx(null);
      setSnap((current) => nextSnap(current));
      return;
    }

    const viewportHeight = window.innerHeight;
    setDragHeightPx(null);
    setSnap(nearestSnap(drag.currentHeight, viewportHeight));
  }, []);

  const handlePointerUp = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  const handlePointerCancel = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  const isDragging = dragHeightPx !== null;
  const isHidden = snap === "hidden" && !isDragging;
  // Switching between the floating chip and the in-header time waits for
  // release. While the chip is floating it tracks the drawer.
  const showInlineSunset = Boolean(sunset) && snap === "expanded";
  const chipFollowsDrag = isDragging && !showInlineSunset;

  return (
    <>
    {sunset ? (
      <div
        className={`pointer-events-none absolute left-1/2 z-40 -translate-x-1/2 lg:bottom-6 ${
          chipFollowsDrag
            ? ""
            : `transition-[bottom] duration-300 ease-out ${CHIP_BOTTOM_CLASS[snap]}`
        } ${showInlineSunset ? "max-lg:hidden" : ""}`}
        style={chipFollowsDrag ? { bottom: dragHeightPx + 10 } : undefined}
      >
        <SunsetChip time={sunset} />
      </div>
    ) : null}
    <div
      className={`pointer-events-none absolute z-30 flex flex-col border border-[var(--ember)]/25 bg-[var(--surface)] shadow-[0_-8px_32px_rgb(42_18_16/0.12)] backdrop-blur-md ats-fade-in
        inset-x-0 bottom-0 border-x-0 border-b-0
        lg:inset-y-4 lg:inset-s-4 lg:inset-e-auto lg:bottom-auto lg:h-auto lg:max-h-[calc(100%-2rem)] lg:w-[min(100%,380px)] lg:border lg:shadow-[0_12px_40px_rgb(42_18_16/0.12)]
        ${isDragging ? "" : `transition-[height,max-height] duration-300 ease-out ${SNAP_HEIGHT_CLASS[snap]}`}
        lg:!h-auto`}
      style={
        isDragging
          ? {
              height: `${dragHeightPx}px`,
              maxHeight: `${window.innerHeight * EXPANDED_RATIO}px`,
            }
          : undefined
      }
    >
      <button
        type="button"
        className="pointer-events-auto flex w-full shrink-0 touch-none flex-col items-center gap-2 px-4 pb-2 pt-3 lg:hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        aria-expanded={!isHidden}
        aria-label={drawerAriaLabel(snap, t)}
      >
        <span className="h-1 w-10 rounded-full bg-[var(--sand)]/25" aria-hidden />
        <span className="flex w-full items-baseline justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sand-muted)]">
            {heading}
          </span>
          {showInlineSunset && sunset ? (
            <span className="shrink-0 text-xs font-medium normal-case tracking-normal text-[var(--sand)] lg:hidden">
              <span className="text-[var(--sand-muted)]">{t("sunsetToday")}</span>{" "}
              <time dateTime={sunset} className="tabular-nums">
                {sunset}
              </time>
            </span>
          ) : null}
        </span>
      </button>

      <div
        className={`pointer-events-auto flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 lg:px-5 lg:pb-5 lg:pt-5 ${
          isHidden ? "hidden lg:flex" : ""
        }`}
      >
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
    </>
  );
}
