"use client";

import Link from "next/link";
import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { SpotSummary } from "@/types/spot";

export function SpotCard({ spot }: { spot: SpotSummary }) {
  return (
    <Link
      href={`/spots/${spot.id}`}
      className="block border-b border-white/10 py-3 transition hover:bg-white/5"
    >
      <p className="font-[family-name:var(--font-display)] text-lg text-[var(--sand)]">
        {spot.name}
      </p>
      {spot.region ? (
        <p className="text-sm text-[var(--sand-muted)]">{spot.region}</p>
      ) : null}
      <p className="mt-1 line-clamp-2 text-sm text-[var(--sand-muted)]">
        {spot.description}
      </p>
    </Link>
  );
}

export function SpotList({ spots }: { spots: SpotSummary[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: spots.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 6,
  });

  if (spots.length === 0) {
    return (
      <p className="py-6 text-sm text-[var(--sand-muted)]">
        No spots yet. Be the first to share a sunset.
      </p>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-full min-h-0 overflow-y-auto overscroll-contain"
    >
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const spot = spots[item.index];
          return (
            <div
              key={spot.id}
              data-index={item.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${item.start}px)` }}
            >
              <SpotCard spot={spot} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
