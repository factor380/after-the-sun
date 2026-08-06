"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LocationPickerClient from "@/components/map/LocationPickerClient";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  ALLOWED_SPOT_PHOTO_TYPES,
  MAX_SPOT_PHOTO_BYTES,
} from "@/lib/spot-photo";

export default function SpotForm() {
  const router = useRouter();
  const { t } = useLocale();
  const photoInputId = useId();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  function clearPhoto() {
    setPhotoFile(null);
    setPhotoUrl("");
  }

  function onPhotoSelected(fileList: FileList | null) {
    setError(null);
    const file = fileList?.[0] ?? null;
    if (!file) {
      clearPhoto();
      return;
    }

    if (file.size > MAX_SPOT_PHOTO_BYTES) {
      setError(t("photoTooLarge"));
      clearPhoto();
      return;
    }

    if (
      file.type &&
      !(ALLOWED_SPOT_PHOTO_TYPES as readonly string[]).includes(file.type)
    ) {
      setError(t("photoInvalidType"));
      clearPhoto();
      return;
    }

    setPhotoFile(file);
    setPhotoUrl("");
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

    setSaving(true);
    try {
      let resolvedPhotoUrl = photoUrl.trim() || null;
      if (photoFile) {
        resolvedPhotoUrl = await uploadPhoto(photoFile);
      }

      const res = await fetch("/api/spots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          region: region || null,
          lat,
          lng,
          photoUrl: resolvedPhotoUrl,
        }),
      });

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
          onChange={(e) => onPhotoSelected(e.target.files)}
          className="block w-full text-sm text-[var(--sand-muted)] file:me-3 file:border-0 file:bg-[var(--ember)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white file:transition hover:file:brightness-110"
        />
        <p className="mt-1 text-xs text-[var(--sand-muted)]">{t("photoHint")}</p>

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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="bg-[var(--ember)] px-5 py-2.5 font-medium text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {saving ? t("saving") : t("shareSpot")}
      </button>
    </form>
  );
}
