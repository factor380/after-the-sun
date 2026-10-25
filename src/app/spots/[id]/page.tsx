import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SpotContributorTools from "@/components/spots/SpotContributorTools";
import SpotGallery, {
  type GalleryPhoto,
} from "@/components/spots/SpotGallery";
import JsonLd from "@/components/seo/JsonLd";
import { T } from "@/components/T";
import { sunsetTime } from "@/lib/geo/sunset";
import { matchingRegion, regionPath } from "@/lib/regions";
import {
  SITE_NAME,
  noIndexRobots,
  spotJsonLd,
  spotPageDescription,
  spotPageTitle,
  spotShareImage,
} from "@/lib/seo";
import { getSpotWithPhotos, listSpots } from "@/services/spots";

type PageProps = { params: Promise<{ id: string }> };

/**
 * Cached for 10 minutes. Spot and photo writes call `revalidatePublishedSpots`
 * so the next visit regenerates this page instead of waiting out the window.
 * Auth controls render in the browser and are not part of the cache.
 */
export const revalidate = 600;

export async function generateStaticParams() {
  const spots = await listSpots();
  return spots.map((spot) => ({ id: spot.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const spot = await getSpotWithPhotos(id);
  if (!spot) {
    return { title: "הנקודה לא נמצאה", robots: noIndexRobots };
  }

  const coverPhoto = spot.photoUrl ?? spot.photos[0]?.url ?? null;
  const shareImage = spotShareImage(coverPhoto, spot.name);
  const title = spotPageTitle(spot.name, spot.region);
  const description = spotPageDescription(spot.description, spot.region);
  const brandedTitle = `${title} | ${SITE_NAME}`;
  const path = `/spots/${spot.id}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: brandedTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "he_IL",
      type: "article",
      publishedTime: spot.createdAt.toISOString(),
      modifiedTime: spot.updatedAt.toISOString(),
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description,
      images: [shareImage],
    },
  };
}

export default async function SpotDetailPage({ params }: PageProps) {
  const { id } = await params;

  const spot = await getSpotWithPhotos(id);
  if (!spot) notFound();

  const sunset = sunsetTime(spot.lat, spot.lng);

  const galleryPhotos: GalleryPhoto[] = [
    ...(spot.photoUrl
      ? [{ id: null, url: spot.photoUrl, uploadedById: null }]
      : []),
    ...spot.photos.map((photo) => ({
      id: photo.id,
      url: photo.url,
      uploadedById: photo.uploadedById,
    })),
  ];

  return (
    <article className="pb-16">
      <JsonLd data={spotJsonLd(spot)} />
      <SpotGallery
        spotId={spot.id}
        spotName={spot.name}
        createdById={spot.createdById}
        photos={galleryPhotos}
      />

      <div className="relative mx-auto w-full max-w-2xl px-5 pt-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-[var(--sand-muted)] transition hover:text-[var(--sand)]"
        >
          <span aria-hidden className="me-1 inline-block rtl:-scale-x-100">
            ←
          </span>
          <T k="backToMap" />
        </Link>

        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--sand)] md:text-5xl">
          {spot.name}
        </h1>
        {spot.region ? <SpotRegionLabel region={spot.region} /> : null}
        {sunset ? (
          <p className="mt-3 text-sm text-[var(--sand-muted)]">
            <T k="sunsetToday" />{" "}
            <time dateTime={sunset} className="font-medium tabular-nums text-[var(--sand)]">
              {sunset}
            </time>
          </p>
        ) : null}

        <p className="mt-6 text-lg leading-relaxed text-[var(--sand-muted)]">
          {spot.description}
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-[var(--line)] pt-6 text-sm">
          <div>
            <dt className="text-[var(--sand-muted)]">
              <T k="latitude" />
            </dt>
            <dd className="text-[var(--sand)]">{spot.lat.toFixed(5)}</dd>
          </div>
          <div>
            <dt className="text-[var(--sand-muted)]">
              <T k="longitude" />
            </dt>
            <dd className="text-[var(--sand)]">{spot.lng.toFixed(5)}</dd>
          </div>
        </dl>

        <SpotContributorTools
          spotId={spot.id}
          createdById={spot.createdById}
          photoCount={spot.photos.length}
          lat={spot.lat}
          lng={spot.lng}
          name={spot.name}
        />
      </div>
    </article>
  );
}

function SpotRegionLabel({ region }: { region: string }) {
  const match = matchingRegion(region);
  if (!match) {
    return <p className="mt-2 text-[var(--ember)]">{region}</p>;
  }

  return (
    <p className="mt-2">
      <Link
        href={regionPath(match.slug)}
        className="text-[var(--ember)] underline decoration-[var(--line)] underline-offset-4 transition hover:text-[var(--sand)]"
      >
        {region}
      </Link>
    </p>
  );
}
