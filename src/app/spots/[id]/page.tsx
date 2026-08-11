import Link from "next/link";
import { notFound } from "next/navigation";
import NavigateToSpot from "@/components/spots/NavigateToSpot";
import ReportSpot from "@/components/spots/ReportSpot";
import { T } from "@/components/T";
import { createClient } from "@/lib/supabase/server";
import { getSpotById } from "@/services/spots";

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
    spot = await getSpotById(id);
  } catch {
    notFound();
  }

  if (!spot) notFound();

  let isAuthenticated = false;
  let isOwner = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);
    isOwner = Boolean(user && user.id === spot.createdById);
  }

  return (
    <article className="pb-16">
      {spot.photoUrl ? (
        <div className="relative -mt-16 aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spot.photoUrl}
            alt={spot.name}
            className="h-full w-full object-cover object-center"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--dusk-deep)] to-transparent"
            aria-hidden
          />
        </div>
      ) : (
        <div
          className="sky-afterglow relative -mt-16 h-48 w-full sm:h-64"
          aria-hidden
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--dusk-deep)] to-transparent" />
        </div>
      )}

      <div className="relative mx-auto w-full max-w-2xl px-5">
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

        <NavigateToSpot lat={spot.lat} lng={spot.lng} />

        <a
          href={`https://www.openstreetmap.org/?mlat=${spot.lat}&mlon=${spot.lng}#map=15/${spot.lat}/${spot.lng}`}
          target="_blank"
          rel="noreferrer"
          className="mt-8 hidden bg-[var(--ember)] px-5 py-3 text-sm font-medium text-white transition hover:brightness-110 md:inline-block"
        >
          <T k="openOsm" />
        </a>

        <ReportSpot spotId={spot.id} isAuthenticated={isAuthenticated} />
      </div>
    </article>
  );
}
