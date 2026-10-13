import Link from "next/link";
import { dictionary } from "@/lib/i18n/dictionaries";
import { SUNSET_REGIONS, regionPath } from "@/lib/regions";
import type { SpotSummary } from "@/types/spot";

/** Crawlable heading and links - the map list is virtualized in the client. */
export function HomeSpotIndex({ spots }: { spots: SpotSummary[] }) {
  return (
    <section className="sr-only">
      <h1>{dictionary.homeSeoTitle}</h1>
      <p>{dictionary.homeSeoLead}</p>
      <nav aria-label="נקודות שקיעה לפי אזור">
        <ul>
          {SUNSET_REGIONS.map((region) => (
            <li key={region.slug}>
              <Link href={regionPath(region.slug)}>{region.title}</Link>
            </li>
          ))}
        </ul>
      </nav>
      {spots.length > 0 ? (
        <nav aria-label={dictionary.homeSpotIndex}>
          <ul>
            {spots.map((spot) => (
              <li key={spot.id}>
                <Link href={`/spots/${spot.id}`}>
                  {spot.region ? `${spot.name} - ${spot.region}` : spot.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </section>
  );
}
