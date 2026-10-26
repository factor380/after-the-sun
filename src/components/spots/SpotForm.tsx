"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LocationPickerClient from "@/components/map/LocationPickerClient";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  compressSpotPhoto,
  SpotPhotoTooLargeError,
} from "@/lib/compress-spot-photo";
import { messageKeyForRequestFailure } from "@/lib/i18n/user-facing-error";
import {
  clearNewSpotDraft,
  loadNewSpotDraft,
  saveNewSpotDraft,
} from "@/lib/new-spot-draft";
import {
  isAcceptableSpotPhotoFile,
  MAX_PHOTOS_ON_CREATE,
  MAX_SPOT_PHOTO_INPUT_BYTES,
  SPOT_PHOTO_INPUT_ACCEPT,
  spotPhotoPickRoom,
} from "@/lib/spot-photo";

type DraftPhoto =
  | {
      id: string;
      status: "loading";
    }
  | {
      id: string;
      status: "ready";
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
  /** Create flow only. Edit always posts to the API. */
  signedIn?: boolean;
};

export default function SpotForm({ initial, signedIn = false }: SpotFormProps) {
  const router = useRouter();
  const { t } = useLocale();
  const isEdit = Boolean(initial);
  const canSubmitDirectly = isEdit || signedIn;
  const touchedRef = useRef(false);
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
  const compressingRef = useRef(false);
  const mountedRef = useRef(true);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [photosMissing, setPhotosMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const maxPhotos = isEdit ? 1 : MAX_PHOTOS_ON_CREATE;
  const photoLoading = photoFiles.some((photo) => photo.status === "loading");

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      for (const photo of photoFilesRef.current) {
        if (photo.status === "ready") URL.revokeObjectURL(photo.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    void (async () => {
      const restoredDraft = await loadNewSpotDraft();
      if (cancelled || !restoredDraft || touchedRef.current) return;
      const { fields, photos } = restoredDraft;
      setName(fields.name);
      setDescription(fields.description);
      setRegion(fields.region);
      setDraftLat(fields.lat);
      setDraftLng(fields.lng);
      setConfirmedLat(fields.confirmedLat);
      setConfirmedLng(fields.confirmedLng);
      setPhotoUrl(fields.photoUrl);
      setAcceptedGuidelines(fields.acceptedGuidelines);
      if (photos.length > 0) {
        const restoredPhotos: DraftPhoto[] = photos.map((file) => ({
          id: crypto.randomUUID(),
          status: "ready",
          file,
          previewUrl: URL.createObjectURL(file),
        }));
        photoFilesRef.current = restoredPhotos;
        setPhotoFiles(restoredPhotos);
      }
      setPhotosMissing(restoredDraft.photosMissing);
      setRestored(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit]);

  const pastedPhotoUrl = photoUrl.trim().startsWith("https://")
    ? photoUrl.trim()
    : null;

  const hasDraftLocation = draftLat !== null && draftLng !== null;
  const isLocationConfirmed =
    hasDraftLocation &&
    draftLat === confirmedLat &&
    draftLng === confirmedLng;

  function releasePhotos(photos: DraftPhoto[]) {
    for (const photo of photos) {
      if (photo.status === "ready") URL.revokeObjectURL(photo.previewUrl);
    }
  }

  function commitPhotos(next: DraftPhoto[]) {
    photoFilesRef.current = next;
    setPhotoFiles(next);
  }

  function readyFiles(photos: DraftPhoto[]): File[] {
    return photos.flatMap((photo) =>
      photo.status === "ready" ? [photo.file] : [],
    );
  }

  function clearPhoto() {
    releasePhotos(photoFilesRef.current);
    commitPhotos([]);
    setPhotoUrl("");
  }

  function removePhoto(id: string) {
    const removed = photoFilesRef.current.find((photo) => photo.id === id);
    if (removed?.status === "ready") URL.revokeObjectURL(removed.previewUrl);
    commitPhotos(photoFilesRef.current.filter((photo) => photo.id !== id));
  }

  async function onPhotoSelected(fileList: FileList | null) {
    touchedRef.current = true;
    // Copy first. Clearing the input empties the live FileList.
    const picked = Array.from(fileList ?? []);
    if (photoInputRef.current) photoInputRef.current.value = "";
    // A second change event can arrive while the first cloud photo is still
    // downloading. Drop it instead of racing the in-flight read.
    if (compressingRef.current || saving) return;
    if (picked.length === 0) return;

    setError(null);
    setPhotosMissing(false);

    const room = spotPhotoPickRoom(
      photoFilesRef.current.length,
      maxPhotos,
      isEdit,
    );
    if (picked.length > room) {
      setError(t("photoCreateLimit"));
      return;
    }

    for (const file of picked) {
      if (file.size > MAX_SPOT_PHOTO_INPUT_BYTES) {
        setError(t("photoTooLarge"));
        return;
      }
      if (!isAcceptableSpotPhotoFile(file)) {
        setError(t("photoInvalidType"));
        return;
      }
    }

    const incoming: DraftPhoto[] = picked.map(() => ({
      id: crypto.randomUUID(),
      status: "loading",
    }));

    compressingRef.current = true;
    setCompressing(true);
    try {
      if (isEdit) {
        releasePhotos(photoFilesRef.current);
        commitPhotos(incoming);
      } else {
        commitPhotos([...photoFilesRef.current, ...incoming]);
      }

      let anyReady = false;
      for (const [index, file] of picked.entries()) {
        const placeholder = incoming[index];
        if (!placeholder) continue;
        const id = placeholder.id;
        try {
          const compressed = await compressSpotPhoto(file);
          if (!mountedRef.current) return;
          if (!photoFilesRef.current.some((photo) => photo.id === id)) continue;
          commitPhotos(
            photoFilesRef.current.map((photo) =>
              photo.id === id
                ? {
                    id,
                    status: "ready",
                    file: compressed,
                    previewUrl: URL.createObjectURL(compressed),
                  }
                : photo,
            ),
          );
          anyReady = true;
        } catch (error) {
          if (!mountedRef.current) return;
          const stillThere = photoFilesRef.current.some((photo) => photo.id === id);
          if (!stillThere) continue;
          commitPhotos(photoFilesRef.current.filter((photo) => photo.id !== id));
          setError(
            error instanceof SpotPhotoTooLargeError
              ? t("photoTooLarge")
              : t("photoLoadFailed"),
          );
        }
      }
      if (anyReady) setPhotoUrl("");
    } finally {
      compressingRef.current = false;
      if (mountedRef.current) setCompressing(false);
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
    if (compressingRef.current || saving) return;
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

    if (!canSubmitDirectly) {
      setSaving(true);
      try {
        const saved = await saveNewSpotDraft({
          name,
          description,
          region,
          lat: draftLat,
          lng: draftLng,
          confirmedLat,
          confirmedLng,
          photoUrl,
          acceptedGuidelines,
          photos: readyFiles(photoFiles),
        });
        if (!saved.stored) {
          setError(t("draftSaveFailed"));
          return;
        }
        router.push("/login?next=/spots/new");
      } catch {
        setError(t("draftSaveFailed"));
      } finally {
        setSaving(false);
      }
      return;
    }

    setSaving(true);
    try {
      let resolvedPhotoUrl = photoUrl.trim() || null;
      let extraPhotoUrls: string[] = [];
      const photosToUpload = readyFiles(photoFiles);
      if (photosToUpload.length > 0) {
        const uploaded: string[] = [];
        for (const file of photosToUpload) {
          uploaded.push(await uploadPhoto(file));
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

      if (!isEdit) await clearNewSpotDraft();
      router.push(`/spots/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      onChange={() => {
        touchedRef.current = true;
      }}
      className="space-y-5"
    >
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

      <div aria-busy={compressing}>
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
          accept={SPOT_PHOTO_INPUT_ACCEPT}
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
        <p className="mt-2 text-sm text-[var(--sand-muted)]">
          {t("photoLandscapeGuide")}
        </p>
        {compressing && !photoLoading ? (
          <p className="mt-2 text-sm text-[var(--ember)]" role="status">
            {t("photoLoading")}
          </p>
        ) : null}
        {photosMissing ? (
          <p className="mt-2 text-sm text-[var(--ember)]">{t("draftPhotosMissing")}</p>
        ) : null}

        {photoFiles.length > 0 ? (
          <ul
            className={`mt-3 grid gap-3 ${photoFiles.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {photoFiles.map((photo, index) => (
              <li
                key={photo.id}
                className="relative overflow-hidden rounded-sm border border-[var(--line)]"
              >
                {photo.status === "loading" ? (
                  <div
                    className="flex h-48 w-full flex-col items-center justify-center gap-3 bg-[var(--surface)] px-3 text-center text-sm text-[var(--sand-muted)]"
                    role="status"
                  >
                    <svg
                      className="size-6 animate-spin text-[var(--ember)] motion-reduce:animate-none"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeOpacity="0.25"
                        strokeWidth="3"
                      />
                      <path
                        d="M21 12a9 9 0 0 0-9-9"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>{t("photoLoading")}</span>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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
        <div className="relative z-10 h-64 w-full rounded-sm">
          <LocationPickerClient
            lat={draftLat}
            lng={draftLng}
            onPick={(nextLat, nextLng) => {
              touchedRef.current = true;
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

      {restored ? (
        <p className="text-sm text-[var(--ember)]">{t("draftRestored")}</p>
      ) : null}
      {!canSubmitDirectly ? (
        <p className="text-sm leading-relaxed text-[var(--sand-muted)]">
          {t("draftSignInHint")}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

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
