"use client";

import Link from "next/link";
import AddSpotPhoto from "@/components/spots/AddSpotPhoto";
import NavigateToSpot from "@/components/spots/NavigateToSpot";
import ReportSpot from "@/components/spots/ReportSpot";
import { T } from "@/components/T";
import { MAX_PHOTOS_PER_SPOT } from "@/lib/spot-photo";
import { useCurrentUserId } from "@/lib/supabase/use-current-user-id";

type SpotContributorToolsProps = {
  spotId: string;
  createdById: string;
  photoCount: number;
  lat: number;
  lng: number;
  name: string;
};

/**
 * Owner links and signed-in actions resolve in the browser.
 * The cached spot page is the same for every visitor.
 */
export default function SpotContributorTools({
  spotId,
  createdById,
  photoCount,
  lat,
  lng,
  name,
}: SpotContributorToolsProps) {
  const userId = useCurrentUserId();
  const isAuthenticated = userId !== null;
  const isOwner = userId === createdById;

  return (
    <>
      {isOwner ? (
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            href={`/spots/${spotId}/edit`}
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

      <NavigateToSpot lat={lat} lng={lng} name={name} />

      <AddSpotPhoto
        spotId={spotId}
        isAuthenticated={isAuthenticated}
        isFull={photoCount >= MAX_PHOTOS_PER_SPOT}
      />

      <ReportSpot spotId={spotId} isAuthenticated={isAuthenticated} />
    </>
  );
}
