import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { SpotThumbnail } from "@/components/spots/SpotThumbnail";
import { T } from "@/components/T";
import {
  CLOSING_AFTER,
  CLOSING_BEFORE,
  DIRECTION_BODY,
  DIRECTION_LEAD,
  FAQ_HEADING,
  JERUSALEM_SUNSET_FAQS,
  JERUSALEM_SUNSET_GUIDE,
  JERUSALEM_SUNSET_INTRO,
  JERUSALEM_SUNSET_INTRO_BEFORE_REGION,
  JERUSALEM_SUNSET_PLACES,
  SPOTS_HEADING,
  UNVERIFIED_MARK,
  WINTER_HEADING,
  WINTER_ROWS,
  WINTER_SOURCE,
} from "@/lib/guides/jerusalem-sunset";
import { SITE_NAME, guideArticleJsonLd, indexRobots } from "@/lib/seo";
import { canOptimizeSpotPhoto, spotCoverUrl } from "@/lib/spot-cover";
import { listSpots } from "@/services/spots";

const PATH = JERUSALEM_SUNSET_GUIDE.path;
const TITLE = JERUSALEM_SUNSET_GUIDE.title;
const DESCRIPTION = JERUSALEM_SUNSET_GUIDE.description;
const PUBLISHED = `${JERUSALEM_SUNSET_GUIDE.datePublished}T00:00:00.000Z`;

const textLink =
  "text-[var(--sand)] underline decoration-[var(--line)] underline-offset-4 transition hover:text-[var(--ember)]";

/**
 * Cached for 10 minutes, same window as the other public pages.
 * Spot writes refresh it through `revalidatePublishedSpots`, so a new cover
 * does not wait out the window. `force-dynamic` made this response
 * `private, no-store` and every request missed the cache.
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
    modifiedTime: PUBLISHED,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
  },
};

function GuideText({ text }: { text: string }) {
  const parts = text.split(UNVERIFIED_MARK);
  return parts.map((part, index) => (
    <Fragment key={index}>
      {part}
      {index < parts.length - 1 ? (
        <span className="whitespace-nowrap text-[0.9em] text-[var(--mist)]">
          {UNVERIFIED_MARK}
        </span>
      ) : null}
    </Fragment>
  ));
}

function spotIdFromPath(path: string): string {
  return path.startsWith("/spots/") ? path.slice("/spots/".length) : path;
}

async function loadGuideCovers(): Promise<Map<string, string>> {
  try {
    const spots = await listSpots();
    const covers = new Map<string, string>();
    for (const spot of spots) {
      const cover = spotCoverUrl(spot);
      if (cover) covers.set(spot.id, cover);
    }
    return covers;
  } catch (error) {
    // A failed production revalidation must not replace a cached guide with missing photos.
    if (process.env.NODE_ENV === "production") throw error;
    return new Map();
  }
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

export default async function JerusalemSunsetGuidePage() {
  const covers = await loadGuideCovers();
  const places = JERUSALEM_SUNSET_PLACES.map((place) => ({
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
          datePublished: JERUSALEM_SUNSET_GUIDE.datePublished,
          dateModified: JERUSALEM_SUNSET_GUIDE.datePublished,
          regionName: JERUSALEM_SUNSET_GUIDE.regionName,
          regionPath: JERUSALEM_SUNSET_GUIDE.regionPath,
          places,
          faqs: JERUSALEM_SUNSET_FAQS,
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

      <p className="mt-6 text-sm font-medium text-[var(--ember)]">
        {JERUSALEM_SUNSET_GUIDE.regionName}
      </p>
      <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl leading-tight text-[var(--sand)] md:text-5xl">
        {TITLE}
      </h1>
      <p className="mt-4 text-sm text-[var(--sand-muted)]">
        <time dateTime={JERUSALEM_SUNSET_GUIDE.datePublished}>
          {JERUSALEM_SUNSET_GUIDE.updatedLabel}
        </time>
      </p>

      <p className="mt-5 text-lg leading-relaxed text-[var(--sand-muted)]">
        {JERUSALEM_SUNSET_INTRO}
      </p>
      <p className="mt-4 text-lg leading-relaxed text-[var(--sand-muted)]">
        {JERUSALEM_SUNSET_INTRO_BEFORE_REGION}
        <Link href={JERUSALEM_SUNSET_GUIDE.regionPath} className={textLink}>
          {JERUSALEM_SUNSET_GUIDE.regionLinkLabel}
        </Link>
        .
      </p>

      <section className="mt-12 border-t border-[var(--line)] pt-8" aria-labelledby="winter-sunset">
        <h2
          id="winter-sunset"
          className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]"
        >
          {WINTER_HEADING}
        </h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-sm leading-snug">
            <thead>
              <tr className="border-b border-[var(--line)] text-start">
                <th scope="col" className="py-2 pe-3 font-medium text-[var(--sand)]">
                  תאריך
                </th>
                <th scope="col" className="py-2 pe-3 font-medium text-[var(--sand)]">
                  שקיעה
                </th>
                <th scope="col" className="py-2 font-medium text-[var(--sand)]">
                  סוף הדמדומים האזרחיים
                </th>
              </tr>
            </thead>
            <tbody>
              {WINTER_ROWS.map((row) => (
                <tr key={row.date} className="border-b border-[var(--line)]">
                  <td className="py-2 pe-3 text-[var(--sand)]">{row.date}</td>
                  <td className="py-2 pe-3 text-[var(--sand)]">{row.sunset}</td>
                  <td className="py-2 text-[var(--sand-muted)]">{row.dusk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 leading-relaxed text-[var(--sand-muted)]">{WINTER_SOURCE}</p>
        <p className="mt-4 leading-relaxed text-[var(--sand-muted)]">
          <strong className="font-medium text-[var(--sand)]">{DIRECTION_LEAD}</strong>{" "}
          {DIRECTION_BODY}
        </p>
      </section>

      <section className="mt-12 border-t border-[var(--line)] pt-8" aria-labelledby="sunset-spots">
        <h2
          id="sunset-spots"
          className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]"
        >
          {SPOTS_HEADING}
        </h2>
        <div className="mt-8 space-y-10">
          {places.map((place, index) => (
            <section key={place.path} aria-labelledby={`place-${index + 1}`}>
              <h3
                id={`place-${index + 1}`}
                className="font-[family-name:var(--font-display)] text-xl leading-snug text-[var(--sand)]"
              >
                <span className="text-[var(--ember)]">{index + 1}. </span>
                <Link href={place.path} className={textLink}>
                  {place.name}
                </Link>
              </h3>
              {place.image ? (
                <GuideSpotPhoto name={place.name} href={place.path} url={place.image} />
              ) : null}
              <p className="mt-3 leading-relaxed text-[var(--sand-muted)]">
                <GuideText text={place.lead} />
              </p>
              <ul className="mt-3 list-disc space-y-2 ps-5 leading-relaxed text-[var(--sand-muted)] marker:text-[var(--ember)]">
                {place.facts.map((fact) => (
                  <li key={fact.label}>
                    <strong className="font-medium text-[var(--sand)]">{fact.label}:</strong>{" "}
                    <GuideText text={fact.text} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-[var(--line)] pt-8" aria-labelledby="sunset-faq">
        <h2
          id="sunset-faq"
          className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]"
        >
          {FAQ_HEADING}
        </h2>
        <dl className="mt-6 space-y-6">
          {JERUSALEM_SUNSET_FAQS.map((faq) => (
            <div key={faq.question}>
              <dt className="font-medium leading-relaxed text-[var(--sand)]">{faq.question}</dt>
              <dd className="mt-2 leading-relaxed text-[var(--sand-muted)]">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-12 border-t border-[var(--line)] pt-8 text-lg leading-relaxed text-[var(--sand-muted)]">
        {CLOSING_BEFORE}
        <Link href="/" className={textLink}>
          {JERUSALEM_SUNSET_GUIDE.mapLinkLabel}
        </Link>
        {CLOSING_AFTER}
      </p>
    </article>
  );
}
