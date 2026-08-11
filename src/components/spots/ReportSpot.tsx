"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import {
  REPORT_REASONS,
  type ReportReason,
} from "@/lib/validations/report";

type ReportSpotProps = {
  spotId: string;
  isAuthenticated: boolean;
};

const REASON_MESSAGE_KEYS = {
  inappropriatePhoto: "reportReasonInappropriatePhoto",
  wrongLocation: "reportReasonWrongLocation",
  spam: "reportReasonSpam",
  other: "reportReasonOther",
} as const satisfies Record<ReportReason, MessageKey>;

export default function ReportSpot({
  spotId,
  isAuthenticated,
}: ReportSpotProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("inappropriatePhoto");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const titleId = useId();
  const firstFieldRef = useRef<HTMLSelectElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setError(null);
    previouslyFocused.current?.focus?.();
  }, []);

  const openSheet = useCallback(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    setDone(false);
    setError(null);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    firstFieldRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/spots/${spotId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          details: details.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(t("reportNeedSignIn"));
        }
        if (res.status === 429) {
          throw new Error(t("reportTooMany"));
        }
        throw new Error(
          typeof data.error === "string" ? data.error : t("reportFailed"),
        );
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reportFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mt-8 border-t border-[var(--line)] pt-6">
        <Link
          href={`/login?next=/spots/${encodeURIComponent(spotId)}`}
          className="text-sm text-[var(--sand-muted)] underline-offset-2 transition hover:text-[var(--sand)] hover:underline"
        >
          {t("reportSignInLink")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-[var(--line)] pt-6">
      <button
        type="button"
        onClick={openSheet}
        className="text-sm text-[var(--sand-muted)] underline-offset-2 transition hover:text-[var(--sand)] hover:underline"
      >
        {t("reportSpot")}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center"
          role="presentation"
        >
          <button
            type="button"
            aria-label={t("reportCancel")}
            className="absolute inset-0 bg-black/50"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-md border border-[var(--line)] bg-[var(--dusk-deep)] px-5 py-6 shadow-lg sm:mx-4"
          >
            <h2
              id={titleId}
              className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]"
            >
              {t("reportTitle")}
            </h2>

            {done ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-[var(--sand-muted)]">
                  {t("reportThanks")}
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="bg-[var(--ember)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                >
                  {t("reportClose")}
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-4 space-y-4">
                <p className="text-sm text-[var(--sand-muted)]">
                  {t("reportSubtitle")}
                </p>

                <div>
                  <label
                    htmlFor={`${titleId}-reason`}
                    className="mb-1 block text-sm text-[var(--sand-muted)]"
                  >
                    {t("reportReason")}
                  </label>
                  <select
                    id={`${titleId}-reason`}
                    ref={firstFieldRef}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value as ReportReason)}
                    className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
                  >
                    {REPORT_REASONS.map((value) => (
                      <option key={value} value={value}>
                        {t(REASON_MESSAGE_KEYS[value])}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`${titleId}-details`}
                    className="mb-1 block text-sm text-[var(--sand-muted)]"
                  >
                    {t("reportDetailsOptional")}
                  </label>
                  <textarea
                    id={`${titleId}-details`}
                    rows={3}
                    maxLength={500}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
                    placeholder={t("reportDetailsPlaceholder")}
                  />
                </div>

                {error ? (
                  <p className="text-sm text-red-600">{error}</p>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[var(--ember)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
                  >
                    {saving ? t("reportSubmitting") : t("reportSubmit")}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="px-4 py-2 text-sm text-[var(--sand-muted)] transition hover:text-[var(--sand)]"
                  >
                    {t("reportCancel")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
