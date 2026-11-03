import Link from "next/link";
import { SpotAmenityIcons } from "@/components/spots/SpotAmenities";
import { SpotThumbnail } from "@/components/spots/SpotThumbnail";
import type { SpotSummary } from "@/types/spot";

function httpsPhoto(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** Visible, crawlable spot links for landing pages. */
export function SpotLinkList({ spots }: { spots: SpotSummary[] }) {
  if (spots.length === 0) return null;

  return (
    <ul className="divide-y divide-[var(--line)] border border-[var(--line)]">
      {spots.map((spot) => {
        const photoUrl = httpsPhoto(spot.photoUrl);
        return (
          <li key={spot.id}>
            <Link
              href={`/spots/${spot.id}`}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--dusk-mid)]/40"
            >
              {photoUrl ? (
                <span className="relative h-14 w-16 shrink-0 overflow-hidden border border-[var(--line)]">
                  <SpotThumbnail
                    url={photoUrl}
                    alt=""
                    className="h-full w-full"
                  />
                </span>
              ) : null}
              <span className="min-w-0">
                <span className="flex min-w-0 items-center gap-1.5 font-[family-name:var(--font-display)] text-lg text-[var(--sand)]">
                  <span className="truncate">{spot.name}</span>
                  <SpotAmenityIcons
                    parking={spot.parking}
                    accessibility={spot.accessibility}
                  />
                </span>
                {spot.region ? (
                  <span className="mt-1 block truncate text-sm text-[var(--ember)]">
                    {spot.region}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
