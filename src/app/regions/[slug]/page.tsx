import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import { SpotLinkList } from "@/components/spots/SpotLinkList";
import { T } from "@/components/T";
import { dictionary } from "@/lib/i18n/dictionaries";
import { toPublicSpot } from "@/lib/public-spot";
import {
  SUNSET_REGIONS,
  filterSpotsForRegion,
  getRegionBySlug,
  regionPath,
  type SunsetRegion,
} from "@/lib/regions";
import {
  SITE_NAME,
  indexRobots,
  noIndexRobots,
  regionPageJsonLd,
  truncateMeta,
} from "@/lib/seo";
import { listSpots } from "@/services/spots";
import type { SpotSummary } from "@/types/spot";

type PageProps = { params: Promise<{ slug: string }> };

/** Cached for 10 minutes; spot writes refresh it through `revalidatePublishedSpots`. */
export const revalidate = 600;

export const dynamicParams = false;

export function generateStaticParams() {
  return SUNSET_REGIONS.map((region) => ({ slug: region.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const region = getRegionBySlug(slug);
  if (!region) {
    return { title: "האזור לא נמצא", robots: noIndexRobots };
  }

  const title = region.title;
  const description = truncateMeta(region.description);
  const path = regionPath(region.slug);
  const brandedTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: indexRobots,
    openGraph: {
      title: brandedTitle,
      description,
      url: path,
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
}

function listedCountLabel(count: number): string {
  if (count === 1) return "כרגע נקודה אחת ברשימה.";
  if (count === 2) return "כרגע שתי נקודות ברשימה.";
  return `כרגע ${count} נקודות ברשימה.`;
}

function AddSpotCta() {
  return (
    <div>
      <Link
        href="/spots/new"
        className="inline-flex bg-[var(--ember)] px-5 py-3 font-medium text-white transition hover:brightness-110"
      >
        הוספת נקודה
      </Link>
      <p className="mt-3 text-sm leading-relaxed text-[var(--sand-muted)]">
        {dictionary.shareSpotSignInNote}
      </p>
    </div>
  );
}

export default async function RegionPage({ params }: PageProps) {
  const { slug } = await params;
  const region = getRegionBySlug(slug);
  if (!region) notFound();

  const loaded = await loadRegionSpots(region);
  const otherRegions = SUNSET_REGIONS.filter((item) => item.slug !== region.slug);

  return (
    <article className="mx-auto w-full max-w-2xl px-5 pb-20 pt-6 md:pt-10">
      <JsonLd
        data={regionPageJsonLd({
          title: region.title,
          description: region.description,
          path: regionPath(region.slug),
          spots: loaded.ok ? loaded.spots : null,
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

      <p className="mt-6 text-sm font-medium text-[var(--ember)]">{region.name}</p>
      <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--sand)] md:text-5xl">
        {region.title}
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-[var(--sand-muted)]">
        {region.intro}
      </p>

      <section className="mt-10" aria-label={region.title}>
        {loaded.ok ? (
          loaded.spots.length > 0 ? (
            <>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]">
                הנקודות באזור
              </h2>
              <p className="mt-3 text-sm text-[var(--sand-muted)]">
                {listedCountLabel(loaded.spots.length)}
              </p>
              {loaded.spots.length < 3 ? (
                <p className="mt-2 leading-relaxed text-[var(--sand-muted)]">
                  הרשימה עדיין קצרה. אם יש מקום שחסר, הוסיפו אותו.
                </p>
              ) : null}
              <div className="mt-5">
                <SpotLinkList spots={loaded.spots} />
              </div>
            </>
          ) : (
            <p className="leading-relaxed text-[var(--sand-muted)]">
              עדיין אין כאן נקודות שסומנו באזור הזה. אם יש לכם מקום לשקיעה,
              הוסיפו אותו למפה.
            </p>
          )
        ) : (
          <p className="leading-relaxed text-[var(--sand-muted)]">
            לא הצלחנו לטעון את הנקודות כרגע. אפשר לחזור למפה או לנסות שוב
            מאוחר יותר.
          </p>
        )}
      </section>

      <div className="mt-10">
        <AddSpotCta />
      </div>

      <nav className="mt-14 border-t border-[var(--line)] pt-8" aria-label="אזורים נוספים">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]">
          אזורים נוספים
        </h2>
        <ul className="mt-4 space-y-3">
          {otherRegions.map((item) => (
            <li key={item.slug}>
              <Link
                href={regionPath(item.slug)}
                className="text-[var(--sand)] underline decoration-[var(--line)] underline-offset-4 transition hover:text-[var(--ember)]"
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}

async function loadRegionSpots(
  region: SunsetRegion,
): Promise<{ ok: true; spots: SpotSummary[] } | { ok: false }> {
  try {
    const spots = await listSpots();
    return {
      ok: true,
      spots: filterSpotsForRegion(spots.map(toPublicSpot), region),
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    return { ok: false };
  }
}
