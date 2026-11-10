"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Shown only after the server says this session is an admin.
 * The allowlist is not sent to the browser. The cached spot HTML stays the
 * same for every visitor; this link is added in the client.
 */
export default function AdminSpotEditLink({ spotId }: { spotId: string }) {
  const { t } = useLocale();
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/session", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { admin?: unknown };
      })
      .then((data) => {
        if (!cancelled && data?.admin === true) setAdmin(true);
      })
      .catch(() => {
        /* Fail closed: no link when the check cannot be read. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!admin) return null;

  return (
    <p className="mt-6">
      <Link
        href={`/admin/spots/${spotId}`}
        className="inline-block border border-[var(--line)] px-4 py-2 text-sm text-[var(--sand-muted)] transition hover:border-[var(--ember)] hover:text-[var(--sand)]"
      >
        {t("adminEditSpot")}
      </Link>
    </p>
  );
}
