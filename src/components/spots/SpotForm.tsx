"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LocationPickerClient from "@/components/map/LocationPickerClient";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { compressSpotPhoto } from "@/lib/compress-spot-photo";
import { messageKeyForRequestFailure } from "@/lib/i18n/user-facing-error";
import {
  ALLOWED_SPOT_PHOTO_TYPES,
  MAX_PHOTOS_ON_CREATE,
  MAX_SPOT_PHOTO_INPUT_BYTES,
} from "@/lib/spot-photo";

type DraftPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

export type SpotFormInitial = {
  id: string;
  name: string;
  description: string;
  region: string | null;
  lat: number;
  lng: number;
  photoUrl: string | null;
};

type SpotFormProps = {
  initial?: SpotFormInitial;
};

export default function SpotForm({ initial }: SpotFormProps) {
  const router = useRouter();
  const { t } = useLocale();
  const isEdit = Boolean(initial);
  const photoInputId = useId();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [region, setRegion] = useState(initial?.region ?? "");
  const [draftLat, setDraftLat] = useState<number | null>(initial?.lat ?? null);
  const [draftLng, setDraftLng] = useState<number | null>(initial?.lng ?? null);
  const [confirmedLat, setConfirmedLat] = useState<number | null>(
    initial?.lat ?? null,
  );
  const [confirmedLng, setConfirmedLng] = useState<number | null>(
    initial?.lng ?? null,
  );
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [photoFiles, setPhotoFiles] = useState<DraftPhoto[]>([]);
  const photoFilesRef = useRef<DraftPhoto[]>([]);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const maxPhotos = isEdit ? 1 : MAX_PHOTOS_ON_CREATE;

  useEffect(() => {
    photoFilesRef.current = photoFiles;
  }, [photoFiles]);

  useEffect(
    () => () => {
      for (const photo of photoFilesRef.current) {
        URL.revokeObjectURL(photo.previewUrl);
      }
    },
    [],
  );

  const pastedPhotoUrl = photoUrl.trim().startsWith("https://")
    ? photoUrl.trim()
    : null;

  const hasDraftLocation = draftLat !== null && draftLng !== null;
  const isLocationConfirmed =
    hasDraftLocation &&
    draftLat === confirmedLat &&
    draftLng === confirmedLng;

  function releasePhotos(photos: DraftPhoto[]) {
    for (const photo of photos) URL.revokeObjectURL(photo.previewUrl);
  }

  function clearPhoto() {
    setPhotoFiles((current) => {
      releasePhotos(current);
      return [];
    });
    setPhotoUrl("");
  }

  function removePhoto(id: string) {
    setPhotoFiles((current) => {
      const removed = current.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
  }

  async function onPhotoSelected(fileList: FileList | null) {
    setError(null);
    const picked = Array.from(fileList ?? []);
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (picked.length === 0) return;

    const room = isEdit ? maxPhotos : maxPhotos - photoFiles.length;
    if (picked.length > room) {
      setError(t("photoCreateLimit"));
      return;
    }

    for (const file of picked) {
      if (file.size > MAX_SPOT_PHOTO_INPUT_BYTES) {
        setError(t("photoTooLarge"));
        return;
      }
      if (
        file.type &&
        !(ALLOWED_SPOT_PHOTO_TYPES as readonly string[]).includes(file.type)
      ) {
        setError(t("photoInvalidType"));
        return;
      }
    }

    setCompressing(true);
    try {
      const compressed: DraftPhoto[] = [];
      for (const file of picked) {
        compressed.push({
          id: crypto.randomUUID(),
          file: await compressSpotPhoto(file),
          previewUrl: "",
        });
      }
      for (const photo of compressed) {
        photo.previewUrl = URL.createObjectURL(photo.file);
      }
      let rejected = false;
      setPhotoFiles((current) => {
        if (isEdit) {
          releasePhotos(current);
          return compressed.slice(0, 1);
        }
        const room = MAX_PHOTOS_ON_CREATE - current.length;
        if (compressed.length > room) {
          rejected = true;
          releasePhotos(compressed);
          return current;
        }
        return [...current, ...compressed];
      });
      if (rejected) {
        setError(t("photoCreateLimit"));
        return;
      }
      setPhotoUrl("");
    } catch {
      setError(t("photoCompressFailed"));
    } finally {
      setCompressing(false);
    }
  }

  async function uploadPhoto(file: File): Promise<string> {
    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/spots/upload", {
      method: "POST",
      body,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        t(messageKeyForRequestFailure(res.status, data.error, "photoUploadFailed")),
      );
    }
    if (typeof data.photoUrl !== "string" || !data.photoUrl.startsWith("https://")) {
      throw new Error(t("photoUploadFailed"));
    }
    return data.photoUrl;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!hasDraftLocation) {
      setError(t("clickMapError"));
      return;
    }

    if (confirmedLat === null || confirmedLng === null || !isLocationConfirmed) {
      setError(t("confirmLocationFirst"));
      return;
    }

    if (!isEdit && !acceptedGuidelines) {
      setError(t("uploadTermsRequired"));
      return;
    }

    setSaving(true);
    try {
      let resolvedPhotoUrl = photoUrl.trim() || null;
      let extraPhotoUrls: string[] = [];
      if (photoFiles.length > 0) {
        const uploaded: string[] = [];
        for (const photo of photoFiles) {
          uploaded.push(await uploadPhoto(photo.file));
        }
        resolvedPhotoUrl = uploaded[0] ?? null;
        extraPhotoUrls = uploaded.slice(1);
      }

      const payload = {
        name,
        description,
        region: region || null,
        lat: confirmedLat,
        lng: confirmedLng,
        photoUrl: resolvedPhotoUrl,
        ...(extraPhotoUrls.length > 0 ? { extraPhotoUrls } : {}),
        ...(isEdit ? {} : { acceptedGuidelines: true as const }),
      };

      const res = await fetch(
        isEdit ? `/api/spots/${initial!.id}` : "/api/spots",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          t(messageKeyForRequestFailure(res.status, data.error, "saveFailed")),
        );
      }

      router.push(`/spots/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm text-[var(--sand-muted)]">
          {t("name")}
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
          placeholder={t("namePlaceholder")}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--sand-muted)]">
          {t("description")}
        </label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
          placeholder={t("descriptionPlaceholder")}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--sand-muted)]">
          {t("regionOptional")}
        </label>
        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
          placeholder={t("regionPlaceholder")}
        />
      </div>

      <div>
        <label
          htmlFor={photoInputId}
          className="mb-1 block text-sm text-[var(--sand-muted)]"
        >
          {isEdit ? t("photoOptional") : t("photoOptionalCreate")}
        </label>
        <input
          id={photoInputId}
          ref={photoInputRef}
          type="file"
          accept={ALLOWED_SPOT_PHOTO_TYPES.join(",")}
          multiple={!isEdit}
          onChange={(e) => {
            void onPhotoSelected(e.target.files);
          }}
          disabled={compressing || saving || photoFiles.length >= maxPhotos}
          className="block w-full text-sm text-[var(--sand-muted)] file:me-3 file:border-0 file:bg-[var(--ember)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white file:transition hover:file:brightness-110 disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-[var(--sand-muted)]">{t("photoHint")}</p>
        {!isEdit ? (
          <p className="mt-1 text-xs text-[var(--sand-muted)]">
            {t("photoCreateHint")}
          </p>
        ) : null}
        {compressing ? (
          <p className="mt-2 text-sm text-[var(--ember)]">{t("photoCompressing")}</p>
        ) : (
          <p className="mt-2 text-sm text-[var(--sand-muted)]">
            {t("photoLandscapeGuide")}
          </p>
        )}

        {photoFiles.length > 0 ? (
          <ul
            className={`mt-3 grid gap-3 ${photoFiles.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {photoFiles.map((photo, index) => (
              <li
                key={photo.id}
                className="relative overflow-hidden rounded-sm border border-[var(--line)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt=""
                  className="max-h-48 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  aria-label={`${t("photoRemove")} ${index + 1}`}
                  className="absolute end-2 top-2 bg-[var(--dusk-deep)]/80 px-2 py-1 text-xs text-[var(--sand)]"
                >
                  {t("photoRemove")}
                </button>
              </li>
            ))}
          </ul>
        ) : pastedPhotoUrl ? (
          <div className="relative mt-3 overflow-hidden rounded-sm border border-[var(--line)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pastedPhotoUrl}
              alt=""
              className="max-h-48 w-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                clearPhoto();
                if (photoInputRef.current) photoInputRef.current.value = "";
              }}
              className="absolute end-2 top-2 bg-[var(--dusk-deep)]/80 px-2 py-1 text-xs text-[var(--sand)]"
            >
              {t("photoRemove")}
            </button>
          </div>
        ) : null}

        {photoFiles.length === 0 ? (
          <div className="mt-3">
            <label className="mb-1 block text-xs text-[var(--sand-muted)]">
              {t("photoUrlOptional")}
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--sand)] outline-none focus:border-[var(--ember)]"
              placeholder="https://..."
              pattern="https://.*"
              title="HTTPS URL only"
            />
          </div>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-sm text-[var(--sand-muted)]">
          {t("tapMap")}
          {hasDraftLocation
            ? ` · ${draftLat!.toFixed(5)}, ${draftLng!.toFixed(5)}`
            : ""}
        </p>
        <div className="h-64 w-full overflow-hidden rounded-sm">
          <LocationPickerClient
            lat={draftLat}
            lng={draftLng}
            onPick={(nextLat, nextLng) => {
              setDraftLat(nextLat);
              setDraftLng(nextLng);
            }}
          />
        </div>

        {hasDraftLocation ? (
          <div className="mt-3 flex items-center gap-3">
            {isLocationConfirmed ? (
              <>
                <span className="text-sm font-medium text-[var(--ember)]">
                  ✓ {t("locationConfirmed")}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedLat(null);
                    setConfirmedLng(null);
                  }}
                  className="text-sm text-[var(--sand-muted)] underline"
                >
                  {t("changeLocation")}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setConfirmedLat(draftLat);
                  setConfirmedLng(draftLng);
                  setError(null);
                }}
                className="border border-[var(--ember)] px-4 py-2 text-sm font-medium text-[var(--ember)] transition hover:bg-[var(--ember)] hover:text-white"
              >
                {t("confirmLocation")}
              </button>
            )}
          </div>
        ) : null}
      </div>

      {!isEdit ? (
        <div className="space-y-3 border border-[var(--line)] bg-[var(--surface)] px-3 py-3">
          <p className="text-sm text-[var(--sand-muted)]">
            {t("uploadTermsNotice")}
          </p>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-[var(--sand)]">
            <input
              type="checkbox"
              required
              checked={acceptedGuidelines}
              onChange={(e) => setAcceptedGuidelines(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-[var(--ember)]"
            />
            <span>{t("uploadTermsCheckbox")}</span>
          </label>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={saving || compressing}
        className="bg-[var(--ember)] px-5 py-2.5 font-medium text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {saving ? t("saving") : isEdit ? t("saveChanges") : t("shareSpot")}
      </button>
    </form>
  );
}
