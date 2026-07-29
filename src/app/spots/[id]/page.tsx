import Link from "next/link";
import { notFound } from "next/navigation";
import { T } from "@/components/T";
import { getSpotById } from "@/services/spots";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function SpotDetailPage({ params }: PageProps) {
  const { id } = await params;

  let spot;
  try {
    spot = await getSpotById(id);
  } catch {
    notFound();
  }

  if (!spot) notFound();

  return (
    <article className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link
        href="/"
        className="text-sm text-[var(--sand-muted)] hover:text-[var(--sand)]"
      >
        <span aria-hidden className="me-1 inline-block rtl:-scale-x-100">
          ←
        </span>
        <T k="backToMap" />
      </Link>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[var(--sand)] md:text-5xl">
        {spot.name}
      </h1>
      {spot.region ? (
        <p className="mt-2 text-[var(--ember)]">{spot.region}</p>
      ) : null}

      {spot.photoUrl ? (
        <div className="relative mt-6 aspect-[16/10] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spot.photoUrl}
            alt={spot.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <p className="mt-6 text-lg leading-relaxed text-[var(--sand-muted)]">
        {spot.description}
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 text-sm">
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

      <a
        href={`https://www.openstreetmap.org/?mlat=${spot.lat}&mlon=${spot.lng}#map=15/${spot.lat}/${spot.lng}`}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-block text-sm text-[var(--ember)] underline"
      >
        <T k="openOsm" />
      </a>
    </article>
  );
}
