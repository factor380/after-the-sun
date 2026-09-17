import Link from "next/link";
import { dictionary } from "@/lib/i18n/dictionaries";
import type { SpotSummary } from "@/types/spot";

/** Crawlable heading and links — the map list is virtualized in the client. */
export function HomeSpotIndex({ spots }: { spots: SpotSummary[] }) {
  return (
    <section className="sr-only">
      <h1>{dictionary.homeSeoTitle}</h1>
      <p>{dictionary.homeSeoLead}</p>
      {spots.length > 0 ? (
        <nav aria-label={dictionary.homeSpotIndex}>
          <ul>
            {spots.map((spot) => (
              <li key={spot.id}>
                <Link href={`/spots/${spot.id}`}>
                  {spot.region ? `${spot.name} — ${spot.region}` : spot.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </section>
  );
}
