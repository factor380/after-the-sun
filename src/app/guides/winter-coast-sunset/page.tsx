import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { SpotThumbnail } from "@/components/spots/SpotThumbnail";
import { T } from "@/components/T";
import { loadGuideCoverMap } from "@/lib/guides/guide-covers";
import {
  BEFORE_HEADING,
  BEFORE_PARAGRAPHS,
  CLOSING_AFTER,
  CLOSING_BEFORE,
  CLOSING_HEADING,
  FAQ_HEADING,
  START_HEADING,
  START_PARAGRAPHS,
  START_REGIONS_AFTER,
  START_REGIONS_BEFORE,
  WINTER_COAST_REGIONS,
  WINTER_COAST_SUNSET_FAQS,
  WINTER_COAST_SUNSET_GUIDE,
  WINTER_COAST_SUNSET_PLACES,
} from "@/lib/guides/winter-coast-sunset";
import { SITE_NAME, guideArticleJsonLd, indexRobots } from "@/lib/seo";
import { canOptimizeSpotPhoto } from "@/lib/spot-cover";

const PATH = WINTER_COAST_SUNSET_GUIDE.path;
const TITLE = WINTER_COAST_SUNSET_GUIDE.title;
const DESCRIPTION = WINTER_COAST_SUNSET_GUIDE.description;
const PUBLISHED = `${WINTER_COAST_SUNSET_GUIDE.datePublished}T00:00:00.000Z`;
const MODIFIED = `${WINTER_COAST_SUNSET_GUIDE.dateModified}T00:00:00.000Z`;
const EYEBROW = WINTER_COAST_REGIONS.map((region) => region.label).join(", ");

const textLink =
  "text-[var(--sand)] underline decoration-[var(--line)] underline-offset-4 transition hover:text-[var(--ember)]";

/**
 * Cached for 10 minutes, same window as the other public pages.
 * Spot writes refresh it through `revalidatePublishedSpots`. A missing
 * database at build time still renders the guide without photos.
 */
export const revalidate = 600;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  robots: indexRobots,
  openGraph: {
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: PATH,
    siteName: SITE_NAME,
    locale: "he_IL",
    type: "article",
    publishedTime: PUBLISHED,
    modifiedTime: MODIFIED,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
  },
};

function spotIdFromPath(path: string): string {
  return path.startsWith("/spots/") ? path.slice("/spots/".length) : path;
}

function GuideSpotPhoto({ name, href, url }: { name: string; href: string; url: string }) {
  const alt = `שקיעה מ${name}`;
  return (
    <Link href={href} className="mt-4 block">
      <span className="relative block aspect-[4/3] w-full overflow-hidden border border-[var(--line)] sm:aspect-[16/9]">
        {canOptimizeSpotPhoto(url) ? (
          <Image
            src={url}
            alt={alt}
            fill
            loading="lazy"
            sizes="(max-width: 672px) calc(100vw - 2.5rem), 672px"
            className="object-cover object-center"
          />
        ) : (
          <SpotThumbnail url={url} alt={alt} className="absolute inset-0 h-full w-full" />
        )}
      </span>
    </Link>
  );
}

function CoastRegionLinks() {
  return WINTER_COAST_REGIONS.map((region, index) => {
    const last = index === WINTER_COAST_REGIONS.length - 1;
    const separator = index === 0 ? null : last ? " ו" : ", ";
    return (
      <span key={region.path}>
        {separator}
        <Link href={region.path} className={textLink}>
          {region.label}
        </Link>
      </span>
    );
  });
}

export default async function WinterCoastSunsetGuidePage() {
  const covers = await loadGuideCoverMap();
  const places = WINTER_COAST_SUNSET_PLACES.map((place) => ({
    ...place,
    image: covers.get(spotIdFromPath(place.path)) ?? null,
  }));

  return (
    <article className="mx-auto w-full max-w-2xl px-5 pb-20 pt-6 md:pt-10">
      <JsonLd
        data={guideArticleJsonLd({
          title: TITLE,
          description: DESCRIPTION,
          path: PATH,
          datePublished: WINTER_COAST_SUNSET_GUIDE.datePublished,
          dateModified: WINTER_COAST_SUNSET_GUIDE.dateModified,
          regionName: WINTER_COAST_SUNSET_GUIDE.regionName,
          regionPath: WINTER_COAST_SUNSET_GUIDE.regionPath,
          places,
          faqs: WINTER_COAST_SUNSET_FAQS,
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

      <p className="mt-6 text-sm font-medium text-[var(--ember)]">{EYEBROW}</p>
      <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl leading-tight text-[var(--sand)] md:text-5xl">
        {TITLE}
      </h1>
      <p className="mt-4 text-sm text-[var(--sand-muted)]">
        <time dateTime={WINTER_COAST_SUNSET_GUIDE.dateModified}>
          {WINTER_COAST_SUNSET_GUIDE.updatedLabel}
        </time>
      </p>

      <section className="mt-12 border-t border-[var(--line)] pt-8" aria-labelledby="coast-start">
        <h2
          id="coast-start"
          className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]"
        >
          {START_HEADING}
        </h2>
        {START_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph} className="mt-4 text-lg leading-relaxed text-[var(--sand-muted)]">
            {paragraph}
          </p>
        ))}
        <p className="mt-4 text-lg leading-relaxed text-[var(--sand-muted)]">
          {START_REGIONS_BEFORE}
          <CoastRegionLinks />
          {START_REGIONS_AFTER}
        </p>
      </section>

      <section className="mt-12 border-t border-[var(--line)] pt-8" aria-labelledby="winter-coast">
        <h2
          id="winter-coast"
          className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]"
        >
          {BEFORE_HEADING}
        </h2>
        {BEFORE_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph} className="mt-4 leading-relaxed text-[var(--sand-muted)]">
            {paragraph}
          </p>
        ))}
      </section>

      <div className="mt-12 space-y-12">
        {places.map((place, index) => (
          <section
            key={place.path}
            className="border-t border-[var(--line)] pt-8"
            aria-labelledby={`place-${index + 1}`}
          >
            <h2
              id={`place-${index + 1}`}
              className="font-[family-name:var(--font-display)] text-2xl leading-snug text-[var(--sand)]"
            >
              {place.heading}
            </h2>
            {place.image ? (
              <GuideSpotPhoto name={place.name} href={place.path} url={place.image} />
            ) : null}
            <p className="mt-4 leading-relaxed">
              <Link href={place.path} className={textLink}>
                {place.linkLabel}
              </Link>
            </p>
            {place.lead ? (
              <p className="mt-4 leading-relaxed text-[var(--sand-muted)]">{place.lead}</p>
            ) : null}
            <ul className="mt-3 list-disc space-y-2 ps-5 leading-relaxed text-[var(--sand-muted)] marker:text-[var(--ember)]">
              {place.facts.map((fact) => (
                <li key={fact.label}>
                  <strong className="font-medium text-[var(--sand)]">{fact.label}:</strong>{" "}
                  {fact.text}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-12 border-t border-[var(--line)] pt-8" aria-labelledby="sunset-faq">
        <h2
          id="sunset-faq"
          className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]"
        >
          {FAQ_HEADING}
        </h2>
        <dl className="mt-6 space-y-6">
          {WINTER_COAST_SUNSET_FAQS.map((faq) => (
            <div key={faq.question}>
              <dt className="font-medium leading-relaxed text-[var(--sand)]">{faq.question}</dt>
              <dd className="mt-2 leading-relaxed text-[var(--sand-muted)]">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 border-t border-[var(--line)] pt-8" aria-labelledby="add-a-spot">
        <h2
          id="add-a-spot"
          className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]"
        >
          {CLOSING_HEADING}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-[var(--sand-muted)]">
          {CLOSING_BEFORE}
          <Link href={WINTER_COAST_SUNSET_GUIDE.addSpotPath} className={textLink}>
            {WINTER_COAST_SUNSET_GUIDE.addSpotLabel}
          </Link>
          {CLOSING_AFTER}
        </p>
      </section>
    </article>
  );
}
