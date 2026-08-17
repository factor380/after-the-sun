import Link from "next/link";
import { notFound } from "next/navigation";
import AddSpotPhoto from "@/components/spots/AddSpotPhoto";
import NavigateToSpot from "@/components/spots/NavigateToSpot";
import ReportSpot from "@/components/spots/ReportSpot";
import SpotGallery, {
  type GalleryPhoto,
} from "@/components/spots/SpotGallery";
import { T } from "@/components/T";
import { MAX_PHOTOS_PER_SPOT } from "@/lib/spot-photo";
import { createClient } from "@/lib/supabase/server";
import { getSpotWithPhotos } from "@/services/spots";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default async function SpotDetailPage({ params }: PageProps) {
  const { id } = await params;

  let spot;
  try {
    spot = await getSpotWithPhotos(id);
  } catch {
    notFound();
  }

  if (!spot) notFound();

  let userId: string | null = null;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  const isAuthenticated = Boolean(userId);
  const isOwner = userId === spot.createdById;

  const galleryPhotos: GalleryPhoto[] = [
    ...(spot.photoUrl
      ? [{ id: null, url: spot.photoUrl, canDelete: false }]
      : []),
    ...spot.photos.map((photo) => ({
      id: photo.id,
      url: photo.url,
      canDelete: isOwner || photo.uploadedById === userId,
    })),
  ];

  return (
    <article className="pb-16">
      <SpotGallery
        spotId={spot.id}
        spotName={spot.name}
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
        {spot.region ? (
          <p className="mt-2 text-[var(--ember)]">{spot.region}</p>
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

        {isOwner ? (
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link
              href={`/spots/${spot.id}/edit`}
              className="border border-[var(--line)] px-4 py-2 text-[var(--sand-muted)] transition hover:border-[var(--ember)] hover:text-[var(--sand)]"
            >
              <T k="editSpot" />
            </Link>
            <Link
              href="/spots/mine"
              className="border border-[var(--line)] px-4 py-2 text-[var(--sand-muted)] transition hover:border-[var(--ember)] hover:text-[var(--sand)]"
            >
              <T k="mySpotsTitle" />
            </Link>
          </div>
        ) : null}

        <NavigateToSpot lat={spot.lat} lng={spot.lng} name={spot.name} />

        <AddSpotPhoto
          spotId={spot.id}
          isAuthenticated={isAuthenticated}
          isFull={spot.photos.length >= MAX_PHOTOS_PER_SPOT}
        />

        <ReportSpot spotId={spot.id} isAuthenticated={isAuthenticated} />
      </div>
    </article>
  );
}
