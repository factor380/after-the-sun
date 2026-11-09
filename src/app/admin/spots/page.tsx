import type { Metadata } from "next";
import Link from "next/link";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { requireAdminPage } from "@/lib/admin-session";
import { dictionary } from "@/lib/i18n/dictionaries";
import { noIndexRobots } from "@/lib/seo";
import { isSpotStatus } from "@/types/spot";
import { listSpotsForAdmin } from "@/services/spots";

export const metadata: Metadata = {
  title: dictionary.adminSpotsTitle,
  description: dictionary.adminSpotsDescription,
  alternates: { canonical: "/admin/spots" },
  robots: noIndexRobots,
};

export const dynamic = "force-dynamic";

const when = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jerusalem",
});

function statusLabel(status: string): string {
  if (!isSpotStatus(status)) return dictionary.adminStatusInvalid;
  if (status === "approved") return dictionary.adminStatusApproved;
  if (status === "rejected") return dictionary.adminStatusRejected;
  return dictionary.adminStatusPending;
}

export default async function AdminSpotsPage() {
  const gate = await requireAdminPage("/admin/spots");
  if (!gate.ok) return <AdminAccessDenied title={dictionary.adminSpotsTitle} />;

  const spots = await listSpotsForAdmin();

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--sand)]">
        {dictionary.adminSpotsTitle}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--sand-muted)]">
        {dictionary.adminSpotsSubtitle}
      </p>
      <p className="mt-3">
        <Link href="/admin/suggestions" className="text-sm text-[var(--ember)] underline">
          {dictionary.adminBackToSuggestions}
        </Link>
      </p>

      {spots.length === 0 ? (
        <p className="mt-8 text-[var(--sand-muted)]">{dictionary.adminSpotsEmpty}</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {spots.map((spot) => (
            <li key={spot.id} className="border border-[var(--line)] bg-[var(--surface)] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/admin/spots/${spot.id}`}
                  className="text-xl text-[var(--sand)] underline decoration-[var(--line)] underline-offset-4"
                >
                  {spot.name}
                </Link>
                <span className="text-sm text-[var(--sand-muted)]">{statusLabel(spot.status)}</span>
              </div>
              {spot.region ? (
                <p className="mt-1 text-sm text-[var(--ember)]">{spot.region}</p>
              ) : null}
              <p className="mt-1 text-sm text-[var(--sand-muted)]">
                {spot.contributorName
                  ? `${dictionary.addedByPrefix} ${spot.contributorName}`
                  : dictionary.adminNoName}
              </p>
              <p className="mt-1 text-xs text-[var(--sand-muted)]">
                <time dateTime={spot.updatedAt.toISOString()}>{when.format(spot.updatedAt)}</time>
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8">
        <Link href="/" className="text-sm text-[var(--sand-muted)] underline">
          {dictionary.backToMap}
        </Link>
      </p>
    </div>
  );
}
