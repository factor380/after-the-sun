import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import AdminSpotForm from "@/components/admin/AdminSpotForm";
import { requireAdminPage } from "@/lib/admin-session";
import { dictionary } from "@/lib/i18n/dictionaries";
import { noIndexRobots } from "@/lib/seo";
import {
  normalizeAccessibility,
  normalizeParking,
  readAmenityNote,
} from "@/lib/spot-amenities";
import { isSpotStatus } from "@/types/spot";
import { getSpotForAdmin } from "@/services/spots";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: dictionary.adminEditSpotTitle,
    robots: noIndexRobots,
    alternates: { canonical: `/admin/spots/${id}` },
  };
}

export const dynamic = "force-dynamic";

export default async function AdminEditSpotPage({ params }: PageProps) {
  const { id } = await params;
  const gate = await requireAdminPage(`/admin/spots/${id}`);
  if (!gate.ok) return <AdminAccessDenied title={dictionary.adminEditSpotTitle} />;

  const spot = await getSpotForAdmin(id);
  if (!spot) notFound();

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-10">
      <p className="flex flex-wrap gap-4 text-sm">
        <Link href="/admin/spots" className="text-[var(--sand-muted)] underline">
          {dictionary.adminAllSpots}
        </Link>
        <Link href="/admin/suggestions" className="text-[var(--sand-muted)] underline">
          {dictionary.adminBackToSuggestions}
        </Link>
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[var(--sand)]">
        {dictionary.adminEditSpotTitle}
      </h1>
      <p className="mt-2 mb-8 text-[var(--sand-muted)]">{dictionary.adminEditSpotSubtitle}</p>
      <AdminSpotForm
        initial={{
          id: spot.id,
          name: spot.name,
          description: spot.description,
          region: spot.region,
          lat: spot.lat,
          lng: spot.lng,
          photoUrl: spot.photoUrl,
          parking: normalizeParking(spot.parking),
          parkingNote: readAmenityNote(spot.parkingNote),
          accessibility: normalizeAccessibility(spot.accessibility),
          accessibilityNote: readAmenityNote(spot.accessibilityNote),
          contributorName: spot.contributorName,
          status: isSpotStatus(spot.status) ? spot.status : "pending",
          photos: spot.photos,
        }}
      />
    </div>
  );
}
