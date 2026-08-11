"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LocationPickerClient from "@/components/map/LocationPickerClient";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { compressSpotPhoto } from "@/lib/compress-spot-photo";
import {
  ALLOWED_SPOT_PHOTO_TYPES,
  MAX_SPOT_PHOTO_INPUT_BYTES,
} from "@/lib/spot-photo";

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
  const [lat, setLat] = useState<number | null>(initial?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initial?.lng ?? null);
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoObjectUrl, setPhotoObjectUrl] = useState<string | null>(null);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    if (!photoFile) {
      setPhotoObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const photoPreview =
    photoObjectUrl ??
    (photoUrl.trim().startsWith("https://") ? photoUrl.trim() : null);

  function clearPhoto() {
    setPhotoFile(null);
    setPhotoUrl("");
  }

  async function onPhotoSelected(fileList: FileList | null) {
    setError(null);
    const file = fileList?.[0] ?? null;
    if (!file) {
      clearPhoto();
      return;
    }

    if (file.size > MAX_SPOT_PHOTO_INPUT_BYTES) {
      setError(t("photoTooLarge"));
      clearPhoto();
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }

    if (
      file.type &&
      !(ALLOWED_SPOT_PHOTO_TYPES as readonly string[]).includes(file.type)
    ) {
      setError(t("photoInvalidType"));
      clearPhoto();
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }

    setCompressing(true);
    try {
      const compressed = await compressSpotPhoto(file);
      setPhotoFile(compressed);
      setPhotoUrl("");
    } catch {
      setError(t("photoCompressFailed"));
      clearPhoto();
      if (photoInputRef.current) photoInputRef.current.value = "";
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
      throw new Error(data.error ?? t("photoUploadFailed"));
    }
    if (typeof data.photoUrl !== "string" || !data.photoUrl.startsWith("https://")) {
      throw new Error(t("photoUploadFailed"));
    }
    return data.photoUrl;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (lat === null || lng === null) {
      setError(t("clickMapError"));
      return;
    }

    if (!isEdit && !acceptedGuidelines) {
      setError(t("uploadTermsRequired"));
      return;
    }

    setSaving(true);
    try {
      let resolvedPhotoUrl = photoUrl.trim() || null;
      if (photoFile) {
        resolvedPhotoUrl = await uploadPhoto(photoFile);
      }

      const payload = {
        name,
        description,
        region: region || null,
        lat,
        lng,
        photoUrl: resolvedPhotoUrl,
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
        throw new Error(data.error ?? t("saveFailed"));
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
          {t("photoOptional")}
        </label>
        <input
          id={photoInputId}
          ref={photoInputRef}
          type="file"
          accept={ALLOWED_SPOT_PHOTO_TYPES.join(",")}
          onChange={(e) => {
            void onPhotoSelected(e.target.files);
          }}
          disabled={compressing || saving}
          className="block w-full text-sm text-[var(--sand-muted)] file:me-3 file:border-0 file:bg-[var(--ember)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white file:transition hover:file:brightness-110 disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-[var(--sand-muted)]">{t("photoHint")}</p>
        {compressing ? (
          <p className="mt-2 text-sm text-[var(--ember)]">{t("photoCompressing")}</p>
        ) : (
          <p className="mt-2 text-sm text-[var(--sand-muted)]">
            {t("photoLandscapeGuide")}
          </p>
        )}

        {photoPreview ? (
          <div className="relative mt-3 overflow-hidden rounded-sm border border-[var(--line)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
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

        {!photoFile ? (
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
          {lat !== null && lng !== null
            ? ` · ${lat.toFixed(5)}, ${lng.toFixed(5)}`
            : ""}
        </p>
        <div className="h-64 w-full overflow-hidden rounded-sm">
          <LocationPickerClient
            lat={lat}
            lng={lng}
            onPick={(nextLat, nextLng) => {
              setLat(nextLat);
              setLng(nextLng);
            }}
          />
        </div>
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
