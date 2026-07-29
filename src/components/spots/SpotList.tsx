import Link from "next/link";
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
  if (spots.length === 0) {
    return (
      <p className="py-6 text-sm text-[var(--sand-muted)]">
        No spots yet. Be the first to share a sunset.
      </p>
    );
  }

  return (
    <ul>
      {spots.map((spot) => (
        <li key={spot.id}>
          <SpotCard spot={spot} />
        </li>
      ))}
    </ul>
  );
}
