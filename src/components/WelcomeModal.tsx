"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const SEEN_KEY = "ats-afterglow-entrance";

export default function WelcomeModal() {
  const { t, dir } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const primaryRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode */
    }
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
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {
      /* show once if storage blocked */
    }
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    primaryRef.current?.focus();

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
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center"
      role="presentation"
    >
      <div className="sky-afterglow absolute inset-0 ats-fade-in" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        dir={dir}
        className="relative z-10 flex min-h-[100dvh] w-full max-w-lg flex-col justify-center px-6 py-16 sm:min-h-0 sm:py-12"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("welcomeClose")}
          className="absolute top-4 end-4 flex size-10 items-center justify-center text-[var(--sand)]/70 transition hover:text-[var(--sand)]"
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

        <div className="ats-fade-up flex flex-col items-center text-center">
          <BrandLogo
            title={t("brand")}
            markClassName="size-14 sm:size-16"
            titleClassName="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--sand)] sm:text-4xl"
            className="inline-flex flex-col items-center gap-3"
          />
        </div>

        <h2 id={titleId} className="sr-only">
          {t("welcomeTitle")}
        </h2>

        <p
          id={descriptionId}
          className="ats-fade-up-delay mt-5 max-w-md text-center text-base leading-relaxed text-[var(--sand)]/80 sm:mx-auto sm:text-lg"
        >
          {t("tagline")}
        </p>

        <div className="ats-fade-up-delay-2 mt-10 flex w-full flex-col gap-3 sm:mx-auto sm:max-w-sm">
          <button
            ref={primaryRef}
            type="button"
            onClick={viewMap}
            className="w-full bg-[var(--ember)] px-5 py-3 font-medium text-white transition hover:brightness-110"
          >
            {t("welcomeViewMap")}
          </button>
          <button
            type="button"
            onClick={addSpot}
            className="w-full border border-[var(--sand)]/25 bg-[var(--surface)]/55 px-5 py-3 font-medium text-[var(--sand)] backdrop-blur-sm transition hover:border-[var(--sand)]/40 hover:bg-[var(--surface)]/80"
          >
            {t("welcomeAddSpot")}
          </button>
        </div>
      </div>
    </div>
  );
}
