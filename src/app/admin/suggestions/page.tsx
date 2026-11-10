import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { dictionary } from "@/lib/i18n/dictionaries";
import { noIndexRobots } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { listPendingSuggestions } from "@/services/spots";

export const metadata: Metadata = {
  title: dictionary.adminSuggestionsTitle,
  description: dictionary.adminSuggestionsDescription,
  alternates: { canonical: "/admin/suggestions" },
  robots: noIndexRobots,
};

export const dynamic = "force-dynamic";

const when = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jerusalem",
});

export default async function AdminSuggestionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/suggestions");
  if (!isAdminEmail(user.email)) {
    return (
      <div className="mx-auto max-w-xl px-5 py-12">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--sand)]">
          {dictionary.adminSuggestionsTitle}
        </h1>
        <p className="mt-3 text-[var(--sand-muted)]">{dictionary.adminForbidden}</p>
      </div>
    );
  }

  const suggestions = await listPendingSuggestions();

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--sand)]">
        {dictionary.adminSuggestionsTitle}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--sand-muted)]">
        {dictionary.adminSuggestionsSubtitle}
      </p>
      <p className="mt-3">
        <Link href="/admin/spots" className="text-sm text-[var(--ember)] underline">
          {dictionary.adminAllSpots}
        </Link>
      </p>

      {suggestions.length === 0 ? (
        <p className="mt-8 text-[var(--sand-muted)]">{dictionary.adminSuggestionsEmpty}</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {suggestions.map((spot) => (
            <li
              key={spot.id}
              className="border border-[var(--line)] bg-[var(--surface)] p-4"
            >
              <h2 className="text-xl text-[var(--sand)]">{spot.name}</h2>
              <p className="mt-1 text-sm text-[var(--sand-muted)]">
                {spot.contributorName
                  ? `${dictionary.addedByPrefix} ${spot.contributorName}`
                  : dictionary.adminNoName}
              </p>
              <p dir="ltr" className="mt-1 text-start text-sm tabular-nums text-[var(--sand-muted)]">
                {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}
              </p>
              <p className="mt-1 text-xs text-[var(--sand-muted)]">
                <time dateTime={spot.createdAt.toISOString()}>{when.format(spot.createdAt)}</time>
              </p>
              {spot.description.trim() ? (
                <p className="mt-3 text-sm leading-relaxed text-[var(--sand)]">{spot.description}</p>
              ) : null}
              {spot.region ? (
                <p className="mt-2 text-sm text-[var(--ember)]">{spot.region}</p>
              ) : null}
              {spot.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={spot.photoUrl}
                  alt=""
                  className="mt-3 max-h-48 w-full object-cover"
                />
              ) : null}
              <p className="mt-4">
                <Link
                  href={`/admin/spots/${spot.id}`}
                  className="text-sm text-[var(--ember)] underline"
                >
                  {dictionary.adminEditSpot}
                </Link>
              </p>
              <div className="mt-3 flex gap-3">
                <form action={`/api/admin/suggestions/${spot.id}`} method="post" className="flex-1">
                  <input type="hidden" name="action" value="approve" />
                  <button
                    type="submit"
                    className="min-h-12 w-full bg-[var(--ember)] text-base font-medium text-white"
                  >
                    {dictionary.adminApprove}
                  </button>
                </form>
                <form action={`/api/admin/suggestions/${spot.id}`} method="post" className="flex-1">
                  <input type="hidden" name="action" value="reject" />
                  <button
                    type="submit"
                    className="min-h-12 w-full border border-[var(--line)] text-base text-[var(--sand)]"
                  >
                    {dictionary.adminReject}
                  </button>
                </form>
              </div>
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
