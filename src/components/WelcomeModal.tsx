"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandLogo";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function WelcomeModal() {
  const { t, dir } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const dismiss = useCallback(() => {
    setOpen(false);
    previouslyFocused.current?.focus?.();
  }, []);

  const viewMap = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const addSpot = useCallback(() => {
    dismiss();
    router.push("/spots/new");
  }, [dismiss, router]);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={t("welcomeClose")}
        className="absolute inset-0 bg-[var(--ink)]/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        dir={dir}
        className="relative z-10 w-full max-w-md border border-white/15 bg-[var(--dusk-deep)]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={dismiss}
          aria-label={t("welcomeClose")}
          className="absolute top-3 end-3 flex size-9 items-center justify-center text-[var(--sand-muted)] transition hover:text-[var(--sand)]"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="mb-4">
          <BrandMark className="size-12 sm:size-14" />
        </div>

        <h2
          id={titleId}
          className="pe-8 font-[family-name:var(--font-display)] text-2xl leading-snug text-[var(--sand)] sm:text-3xl"
        >
          {t("welcomeTitle")}
        </h2>

        <p
          id={descriptionId}
          className="mt-4 text-sm leading-relaxed text-[var(--sand-muted)] sm:text-base"
        >
          {t("welcomeBody")}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={viewMap}
            className="w-full bg-[var(--ember)] px-5 py-2.5 font-medium text-[var(--ink)] transition hover:brightness-110 sm:w-auto"
          >
            {t("welcomeViewMap")}
          </button>
          <button
            type="button"
            onClick={addSpot}
            className="w-full border border-white/25 bg-transparent px-5 py-2.5 font-medium text-[var(--sand)] transition hover:border-white/40 hover:bg-white/5 sm:w-auto"
          >
            {t("welcomeAddSpot")}
          </button>
        </div>
      </div>
    </div>
  );
}
