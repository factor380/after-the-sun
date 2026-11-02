import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { T } from "@/components/T";
import {
  REGIONS_INDEX,
  SUNSET_REGIONS,
  filterSpotsForRegion,
  regionPath,
  regionSpotCountLabel,
} from "@/lib/regions";
import { SITE_NAME, absoluteUrl, indexRobots, regionsIndexJsonLd, truncateMeta } from "@/lib/seo";
import { allowStaticDataFallback } from "@/lib/static-data-fallback";
import { listSpots } from "@/services/spots";

/** Cached for 10 minutes; spot writes refresh it through `revalidatePublishedSpots`. */
export const revalidate = 600;

const title = REGIONS_INDEX.title;
const description = truncateMeta(REGIONS_INDEX.description);
const canonical = absoluteUrl(REGIONS_INDEX.path);
const brandedTitle = `${title} | ${SITE_NAME}`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  robots: indexRobots,
  openGraph: {
    title: brandedTitle,
    description,
    url: canonical,
    siteName: SITE_NAME,
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: brandedTitle,
    description,
  },
};

async function loadRegionCounts(): Promise<Map<string, number> | null> {
  try {
    const spots = await listSpots();
    return new Map(
      SUNSET_REGIONS.map((region) => [region.slug, filterSpotsForRegion(spots, region).length]),
    );
  } catch (error) {
    if (!allowStaticDataFallback()) throw error;
    return null;
  }
}

export default async function RegionsIndexPage() {
  const counts = await loadRegionCounts();

  return (
    <article className="mx-auto w-full max-w-2xl px-5 pb-20 pt-6 md:pt-10">
      <JsonLd
        data={regionsIndexJsonLd({
          title,
          description: REGIONS_INDEX.description,
          regions: SUNSET_REGIONS.map((region) => ({
            name: region.title,
            path: regionPath(region.slug),
          })),
        })}
      />

      <Link
        href="/"
        className="inline-flex items-center text-sm text-[var(--sand-muted)] transition hover:text-[var(--sand)]"
      >
        <span aria-hidden className="me-1 inline-block rtl:-scale-x-100">
          ←
        </span>
        <T k="backToMap" />
      </Link>

      <p className="mt-6 text-sm font-medium text-[var(--ember)]">אזורים</p>
      <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--sand)] md:text-5xl">
        {title}
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-[var(--sand-muted)]">{REGIONS_INDEX.intro}</p>

      <ul className="mt-10 space-y-6">
        {SUNSET_REGIONS.map((region) => {
          const count = counts?.get(region.slug);
          return (
            <li key={region.slug}>
              <Link
                href={regionPath(region.slug)}
                className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)] underline decoration-[var(--line)] underline-offset-4 transition hover:text-[var(--ember)]"
              >
                {region.title}
              </Link>
              <p className="mt-2 leading-relaxed text-[var(--sand-muted)]">{region.intro}</p>
              {count !== undefined ? (
                <p className="mt-1 text-sm text-[var(--sand-muted)]">{regionSpotCountLabel(count)}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
