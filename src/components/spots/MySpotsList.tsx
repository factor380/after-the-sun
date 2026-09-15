"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { messageKeyForRequestFailure } from "@/lib/i18n/user-facing-error";
import {
  PhotoCountBadge,
  SpotThumbnail,
} from "@/components/spots/SpotThumbnail";

export type MySpotItem = {
  id: string;
  name: string;
  region: string | null;
  photoUrl: string | null;
  photoCount: number;
  createdAt: string;
};

type MySpotsListProps = {
  spots: MySpotItem[];
};

export default function MySpotsList({ spots }: MySpotsListProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDelete(spot: MySpotItem) {
    const confirmed = window.confirm(
      t("deleteSpotConfirm").replace("{name}", spot.name),
    );
    if (!confirmed) return;

    setError(null);
    setDeletingId(spot.id);
    try {
      const res = await fetch(`/api/spots/${spot.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          t(
            messageKeyForRequestFailure(
              res.status,
              data.error,
              "deleteSpotFailed",
            ),
          ),
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("deleteSpotFailed"));
    } finally {
      setDeletingId(null);
    }
  }

  if (spots.length === 0) {
    return (
      <div className="space-y-4 text-[var(--sand-muted)]">
        <p>{t("mySpotsEmpty")}</p>
        <Link
          href="/spots/new"
          className="inline-block bg-[var(--ember)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
        >
          {t("addSpot")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="divide-y divide-[var(--line)] border border-[var(--line)]">
        {spots.map((spot) => (
          <li
            key={spot.id}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              {spot.photoUrl ? (
                <Link
                  href={`/spots/${spot.id}`}
                  aria-hidden
                  tabIndex={-1}
                  className="relative h-14 w-16 shrink-0 overflow-hidden rounded-sm border border-[var(--line)]"
                >
                  <SpotThumbnail
                    url={spot.photoUrl}
                    alt=""
                    className="h-full w-full"
                  />
                  <PhotoCountBadge count={spot.photoCount} />
                </Link>
              ) : null}
              <div className="min-w-0">
                <Link
                  href={`/spots/${spot.id}`}
                  className="font-[family-name:var(--font-display)] font-medium text-[var(--sand)] transition hover:text-[var(--ember)]"
                >
                  {spot.name}
                </Link>
                {spot.region ? (
                  <p className="mt-1 text-sm text-[var(--ember)]">
                    {spot.region}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link
                href={`/spots/${spot.id}`}
                className="border border-[var(--line)] px-3 py-1.5 text-[var(--sand-muted)] transition hover:border-[var(--ember)] hover:text-[var(--sand)]"
              >
                {t("viewSpot")}
              </Link>
              <Link
                href={`/spots/${spot.id}/edit`}
                className="border border-[var(--line)] px-3 py-1.5 text-[var(--sand-muted)] transition hover:border-[var(--ember)] hover:text-[var(--sand)]"
              >
                {t("editSpot")}
              </Link>
              <button
                type="button"
                disabled={deletingId === spot.id}
                onClick={() => onDelete(spot)}
                className="border border-[var(--line)] px-3 py-1.5 text-red-500/90 transition hover:border-red-500 hover:text-red-400 disabled:opacity-60"
              >
                {deletingId === spot.id ? t("deletingSpot") : t("deleteSpot")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
