"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { compressSpotPhoto } from "@/lib/compress-spot-photo";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { messageKeyForRequestFailure } from "@/lib/i18n/user-facing-error";
import {
  ALLOWED_SPOT_PHOTO_TYPES,
  MAX_SPOT_PHOTO_INPUT_BYTES,
} from "@/lib/spot-photo";

type AddSpotPhotoProps = {
  spotId: string;
  isAuthenticated: boolean;
  /** Hides the form once the spot reached its photo cap. */
  isFull: boolean;
};

export default function AddSpotPhoto({
  spotId,
  isAuthenticated,
  isFull,
}: AddSpotPhotoProps) {
  const { t } = useLocale();
  const router = useRouter();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  function pickFile(next: File | null) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = next ? URL.createObjectURL(next) : null;
    setFile(next);
    setObjectUrl(objectUrlRef.current);
  }

  function reset() {
    pickFile(null);
    setAcceptedGuidelines(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onFileSelected(fileList: FileList | null) {
    setError(null);
    setDone(false);
    const picked = fileList?.[0] ?? null;
    if (!picked) {
      reset();
      return;
    }

    if (picked.size > MAX_SPOT_PHOTO_INPUT_BYTES) {
      setError(t("photoTooLarge"));
      reset();
      return;
    }

    if (
      picked.type &&
      !(ALLOWED_SPOT_PHOTO_TYPES as readonly string[]).includes(picked.type)
    ) {
      setError(t("photoInvalidType"));
      reset();
      return;
    }

    setCompressing(true);
    try {
      pickFile(await compressSpotPhoto(picked));
    } catch {
      setError(t("photoCompressFailed"));
      reset();
    } finally {
      setCompressing(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError(t("photoAddPickFirst"));
      return;
    }
    if (!acceptedGuidelines) {
      setError(t("uploadTermsRequired"));
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const uploadRes = await fetch("/api/spots/upload", {
        method: "POST",
        body,
      });
      const uploaded = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || typeof uploaded.photoUrl !== "string") {
        throw new Error(
          t(
            messageKeyForRequestFailure(
              uploadRes.status,
              uploaded.error,
              "photoUploadFailed",
            ),
          ),
        );
      }

      const attachRes = await fetch(`/api/spots/${spotId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: uploaded.photoUrl,
          acceptedGuidelines: true,
        }),
      });
      const attached = await attachRes.json().catch(() => ({}));
      if (!attachRes.ok) {
        if (attachRes.status === 429) throw new Error(t("photoAddTooMany"));
        throw new Error(
          t(
            messageKeyForRequestFailure(
              attachRes.status,
              attached.error,
              "photoAddFailed",
            ),
          ),
        );
      }

      reset();
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("photoAddFailed"));
    } finally {
      setUploading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="mt-8 border-t border-[var(--line)] pt-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]">
          {t("photoAddTitle")}
        </h2>
        <Link
          href={`/login?next=/spots/${encodeURIComponent(spotId)}`}
          className="mt-2 inline-block text-sm text-[var(--sand-muted)] underline-offset-2 transition hover:text-[var(--sand)] hover:underline"
        >
          {t("photoAddSignIn")}
        </Link>
      </section>
    );
  }

  if (isFull) {
    return (
      <section className="mt-8 border-t border-[var(--line)] pt-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]">
          {t("photoAddTitle")}
        </h2>
        <p className="mt-2 text-sm text-[var(--sand-muted)]">
          {t("photoAddSpotLimit")}
        </p>
      </section>
    );
  }

  const busy = compressing || uploading;

  return (
    <section className="mt-8 border-t border-[var(--line)] pt-6">
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]">
        {t("photoAddTitle")}
      </h2>
      <p className="mt-1 text-sm text-[var(--sand-muted)]">
        {t("photoAddSubtitle")}
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor={inputId} className="sr-only">
            {t("photoAddTitle")}
          </label>
          <input
            id={inputId}
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_SPOT_PHOTO_TYPES.join(",")}
            disabled={busy}
            onChange={(e) => {
              void onFileSelected(e.target.files);
            }}
            className="block w-full text-sm text-[var(--sand-muted)] file:me-3 file:border-0 file:bg-[var(--ember)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white file:transition hover:file:brightness-110 disabled:opacity-60"
          />
          <p className="mt-1 text-xs text-[var(--sand-muted)]">{t("photoHint")}</p>
          {compressing ? (
            <p className="mt-2 text-sm text-[var(--ember)]">
              {t("photoCompressing")}
            </p>
          ) : null}
        </div>

        {objectUrl ? (
          <div className="relative overflow-hidden rounded-sm border border-[var(--line)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={objectUrl} alt="" className="max-h-48 w-full object-cover" />
            <button
              type="button"
              onClick={reset}
              className="absolute end-2 top-2 bg-[var(--dusk-deep)]/80 px-2 py-1 text-xs text-[var(--sand)]"
            >
              {t("photoRemove")}
            </button>
          </div>
        ) : null}

        <p className="text-sm text-[var(--sand-muted)]">
          {t("photoLandscapeGuide")}
        </p>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-[var(--sand)]">
          <input
            type="checkbox"
            checked={acceptedGuidelines}
            onChange={(e) => setAcceptedGuidelines(e.target.checked)}
            className="mt-1 size-4 shrink-0 accent-[var(--ember)]"
          />
          <span>{t("uploadTermsCheckbox")}</span>
        </label>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {done ? (
          <p className="text-sm text-[var(--ember)]" role="status">
            {t("photoAddThanks")}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || !file}
          className="bg-[var(--ember)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {uploading ? t("photoAddUploading") : t("photoAddSubmit")}
        </button>
      </form>
    </section>
  );
}
