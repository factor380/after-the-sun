"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export type GalleryPhoto = {
  /** `null` for the spot's own cover photo, which is managed from the edit form. */
  id: string | null;
  url: string;
  canDelete: boolean;
};

type SpotGalleryProps = {
  spotId: string;
  spotName: string;
  photos: GalleryPhoto[];
};

export default function SpotGallery({
  spotId,
  spotName,
  photos,
}: SpotGalleryProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const count = photos.length;

  const close = useCallback(() => {
    setOpenIndex(null);
    setError(null);
    previouslyFocused.current?.focus?.();
  }, []);

  const open = useCallback((index: number) => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    setError(null);
    setOpenIndex(index);
  }, []);

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) =>
        current === null ? current : (current + delta + count) % count,
      );
    },
    [count],
  );

  useEffect(() => {
    if (openIndex === null) return;

    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(-1);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openIndex, close, step]);

  async function onDelete(photo: GalleryPhoto) {
    if (!photo.id) return;
    if (!window.confirm(t("photoDeleteConfirm"))) return;

    setError(null);
    setDeletingId(photo.id);
    try {
      const res = await fetch(`/api/spots/${spotId}/photos/${photo.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(t("photoDeleteFailed"));
      close();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("photoDeleteFailed"));
    } finally {
      setDeletingId(null);
    }
  }

  const active = openIndex === null ? null : photos[openIndex];

  if (count === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => open(0)}
        aria-label={t("photoOpenFull")}
        className="group relative -mt-16 block aspect-[4/3] w-full cursor-zoom-in overflow-hidden sm:aspect-[16/9]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[0].url}
          alt={spotName}
          className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--dusk-deep)] to-transparent"
          aria-hidden
        />
        {count > 1 ? (
          <span className="pointer-events-none absolute bottom-3 end-4 bg-black/55 px-2 py-1 text-xs font-medium text-white">
            {t("photoCount").replace("{count}", String(count))}
          </span>
        ) : null}
      </button>

      {count > 1 ? (
        <div className="mx-auto w-full max-w-2xl px-5 pt-3">
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((photo, index) => (
              <li key={photo.id ?? "cover"} className="shrink-0">
                <button
                  type="button"
                  onClick={() => open(index)}
                  aria-label={`${t("photoOpenFull")} ${index + 1}`}
                  className="block h-16 w-20 overflow-hidden rounded-sm border border-[var(--line)] transition hover:border-[var(--ember)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-center"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {active ? (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center"
          role="presentation"
        >
          <button
            type="button"
            aria-label={t("photoClose")}
            className="absolute inset-0 bg-black/85"
            onClick={close}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={spotName}
            className="relative z-10 flex max-h-full w-full max-w-4xl flex-col items-center gap-3 p-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={spotName}
              className="max-h-[75vh] w-auto max-w-full object-contain"
            />

            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={close}
                  className="border border-white/30 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
                >
                  {t("photoClose")}
                </button>
                {active.canDelete ? (
                  <button
                    type="button"
                    disabled={deletingId === active.id}
                    onClick={() => onDelete(active)}
                    className="border border-white/30 px-3 py-1.5 text-sm text-red-300 transition hover:bg-white/10 disabled:opacity-60"
                  >
                    {deletingId === active.id
                      ? t("photoDeleting")
                      : t("photoDelete")}
                  </button>
                ) : null}
              </div>

              {count > 1 ? (
                <div className="flex items-center gap-2 text-sm text-white">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label={t("photoPrevious")}
                    className="border border-white/30 px-3 py-1.5 transition hover:bg-white/10"
                  >
                    <span aria-hidden>›</span>
                  </button>
                  <span dir="ltr" className="tabular-nums">
                    {(openIndex ?? 0) + 1} / {count}
                  </span>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label={t("photoNext")}
                    className="border border-white/30 px-3 py-1.5 transition hover:bg-white/10"
                  >
                    <span aria-hidden>‹</span>
                  </button>
                </div>
              ) : null}
            </div>

            {error ? (
              <p className="w-full text-sm text-red-300" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
