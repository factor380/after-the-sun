"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import LocationPickerClient from "@/components/map/LocationPickerClient";
import SpotAmenityFields from "@/components/spots/SpotAmenityFields";
import { resolveAdminSpotCover } from "@/lib/admin-cover";
import {
  compressSpotPhoto,
  SpotPhotoTooLargeError,
} from "@/lib/compress-spot-photo";
import {
  fetchWithNetworkRetry,
  readResponseJson,
  submitErrorText,
} from "@/lib/fetch-with-network-retry";
import { messageKeyForRequestFailure } from "@/lib/i18n/user-facing-error";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cleanAmenityNote } from "@/lib/spot-amenities";
import {
  isAcceptableSpotPhotoFile,
  MAX_SPOT_PHOTO_INPUT_BYTES,
  SPOT_PHOTO_INPUT_ACCEPT,
} from "@/lib/spot-photo";
import {
  AMENITY_NOTE_MAX,
  SPOT_STATUS_VALUES,
  type Accessibility,
  type Parking,
  type SpotStatus,
} from "@/types/spot";
import type { MessageKey } from "@/lib/i18n/dictionaries";

const STATUS_LABEL: Record<SpotStatus, MessageKey> = {
  pending: "adminStatusPending",
  approved: "adminStatusApproved",
  rejected: "adminStatusRejected",
};

export type AdminSpotFormInitial = {
  id: string;
  name: string;
  description: string;
  region: string | null;
  lat: number;
  lng: number;
  photoUrl: string | null;
  parking: Parking | null;
  parkingNote: string | null;
  accessibility: Accessibility | null;
  accessibilityNote: string | null;
  contributorName: string | null;
  status: SpotStatus;
  photos: { id: string; url: string }[];
};

function responseField(data: unknown, key: string): unknown {
  if (!data || typeof data !== "object") return undefined;
  return (data as Record<string, unknown>)[key];
}

function noteOrNull(value: string): string | null {
  const cleaned = cleanAmenityNote(value).slice(0, AMENITY_NOTE_MAX);
  return cleaned.length > 0 ? cleaned : null;
}

function failureText(
  status: number,
  serverError: unknown,
  fallback: MessageKey,
  t: (key: MessageKey) => string,
): string {
  if (typeof serverError === "string" && /[\u0590-\u05FF]/.test(serverError)) {
    return serverError;
  }
  return t(messageKeyForRequestFailure(status, serverError, fallback));
}

export default function AdminSpotForm({ initial }: { initial: AdminSpotFormInitial }) {
  const router = useRouter();
  const { t } = useLocale();
  const photoInputId = useId();
  const coverNoteId = useId();
  const statusId = useId();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [region, setRegion] = useState(initial.region ?? "");
  const [draftLat, setDraftLat] = useState<number | null>(initial.lat);
  const [draftLng, setDraftLng] = useState<number | null>(initial.lng);
  const [confirmedLat, setConfirmedLat] = useState<number | null>(initial.lat);
  const [confirmedLng, setConfirmedLng] = useState<number | null>(initial.lng);
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl ?? "");
  const [removeCover, setRemoveCover] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverPreviewRef = useRef<string | null>(null);
  const [photos, setPhotos] = useState(initial.photos);
  const [removePhotoIds, setRemovePhotoIds] = useState<string[]>([]);
  const [parking, setParking] = useState<Parking | null>(initial.parking);
  const [parkingNote, setParkingNote] = useState(initial.parkingNote ?? "");
  const [accessibility, setAccessibility] = useState<Accessibility | null>(
    initial.accessibility,
  );
  const [accessibilityNote, setAccessibilityNote] = useState(
    initial.accessibilityNote ?? "",
  );
  const [contributorName, setContributorName] = useState(initial.contributorName ?? "");
  const [status, setStatus] = useState<SpotStatus>(initial.status);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (coverPreviewRef.current) URL.revokeObjectURL(coverPreviewRef.current);
    };
  }, []);

  function replaceCoverFile(file: File | null) {
    if (coverPreviewRef.current) {
      URL.revokeObjectURL(coverPreviewRef.current);
      coverPreviewRef.current = null;
    }
    setCoverFile(file);
    if (!file) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    coverPreviewRef.current = url;
    setCoverPreview(url);
  }

  const hasDraftLocation = draftLat !== null && draftLng !== null;
  const isLocationConfirmed =
    hasDraftLocation && draftLat === confirmedLat && draftLng === confirmedLng;
  const currentCover = photoUrl.trim();
  const requestedCover = removeCover || coverFile ? null : currentCover || null;
  const coverResolution = resolveAdminSpotCover({
    requestedPhotoUrl: requestedCover,
    existingPhotoUrl: initial.photoUrl,
    photos,
    removePhotoIds,
  });
  const coverReplacedByDeletion =
    requestedCover !== null && coverResolution.photoUrl !== requestedCover;
  const effectiveCover = coverReplacedByDeletion
    ? (coverResolution.photoUrl ?? "")
    : currentCover;

  function clientError(): string | null {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) return t("adminNameTooShort");
    if (trimmedName.length > 80) return t("adminNameTooLong");
    if (description.trim().length > 1000) return t("adminDescriptionTooLong");
    if (region.trim().length > 80) return t("adminRegionTooLong");
    if (contributorName.trim().length > 80) return t("adminContributorTooLong");
    if (
      !removeCover &&
      !coverFile &&
      currentCover &&
      !currentCover.startsWith("https://")
    ) {
      return t("adminPhotoInvalid");
    }
    if (!hasDraftLocation) return t("clickMapError");
    if (confirmedLat === null || confirmedLng === null || !isLocationConfirmed) {
      return t("confirmLocationFirst");
    }
    return null;
  }

  async function uploadCover(file: File): Promise<string> {
    if (file.size > MAX_SPOT_PHOTO_INPUT_BYTES) {
      throw new Error(t("photoTooLarge"));
    }
    if (!isAcceptableSpotPhotoFile(file)) {
      throw new Error(t("photoInvalidType"));
    }
    let compressed: File;
    try {
      compressed = await compressSpotPhoto(file);
    } catch (error) {
      throw new Error(
        error instanceof SpotPhotoTooLargeError ? t("photoTooLarge") : t("photoLoadFailed"),
      );
    }
    const body = new FormData();
    body.append("file", compressed);
    const res = await fetchWithNetworkRetry("/api/spots/upload", {
      method: "POST",
      body,
    });
    const data = await readResponseJson(res);
    if (!res.ok) {
      throw new Error(
        failureText(res.status, responseField(data, "error"), "photoUploadFailed", t),
      );
    }
    const uploaded = responseField(data, "photoUrl");
    if (typeof uploaded !== "string" || !uploaded.startsWith("https://")) {
      throw new Error(t("photoUploadFailed"));
    }
    return uploaded;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setNotice(null);
    const blocked = clientError();
    if (blocked) {
      setError(blocked);
      return;
    }
    if (confirmedLat === null || confirmedLng === null) return;

    setSaving(true);
    setError(null);
    try {
      let nextPhoto: string | null = removeCover ? null : currentCover || null;
      if (!removeCover && coverFile) {
        nextPhoto = await uploadCover(coverFile);
      }
      nextPhoto = resolveAdminSpotCover({
        requestedPhotoUrl: nextPhoto,
        existingPhotoUrl: initial.photoUrl,
        photos,
        removePhotoIds,
      }).photoUrl;

      const res = await fetchWithNetworkRetry(`/api/admin/spots/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          region: region.trim() || null,
          lat: confirmedLat,
          lng: confirmedLng,
          photoUrl: nextPhoto,
          parking,
          parkingNote: noteOrNull(parkingNote),
          accessibility,
          accessibilityNote: noteOrNull(accessibilityNote),
          contributorName: contributorName.trim() || null,
          status,
          removePhotoIds,
        }),
      });
      const data = await readResponseJson(res);
      if (!res.ok) {
        throw new Error(failureText(res.status, responseField(data, "error"), "saveFailed", t));
      }

      const id = responseField(data, "id");
      const savedStatus = responseField(data, "status");
      if (typeof id !== "string" || !id) throw new Error(t("saveFailed"));
      if (savedStatus === "approved") {
        router.push(`/spots/${id}`);
        router.refresh();
        return;
      }
      setNotice(t("adminSavedHidden"));
      replaceCoverFile(null);
      setRemoveCover(false);
      setPhotos((current) => current.filter((photo) => !removePhotoIds.includes(photo.id)));
      setRemovePhotoIds([]);
      const savedPhoto = responseField(data, "photoUrl");
      const shownPhoto =
        savedPhoto === null || typeof savedPhoto === "string" ? savedPhoto : nextPhoto;
      setPhotoUrl(typeof shownPhoto === "string" ? shownPhoto : "");
      router.refresh();
    } catch (err) {
      setError(submitErrorText(err, t, "saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  function togglePhoto(photoId: string) {
    setRemovePhotoIds((current) =>
      current.includes(photoId)
        ? current.filter((id) => id !== photoId)
        : [...current, photoId],
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="admin-spot-name" className="mb-1 block text-sm text-[var(--sand-muted)]">
          {t("name")}
        </label>
        <input
          id="admin-spot-name"
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
        />
      </div>

      <div>
        <label
          htmlFor="admin-spot-description"
          className="mb-1 block text-sm text-[var(--sand-muted)]"
        >
          {t("description")}
        </label>
        <textarea
          id="admin-spot-description"
          rows={4}
          maxLength={1000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
        />
      </div>

      <div>
        <label htmlFor="admin-spot-region" className="mb-1 block text-sm text-[var(--sand-muted)]">
          {t("regionOptional")}
        </label>
        <input
          id="admin-spot-region"
          maxLength={80}
          value={region}
          onChange={(event) => setRegion(event.target.value)}
          className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
          placeholder={t("regionPlaceholder")}
        />
      </div>

      <SpotAmenityFields
        parking={parking}
        parkingNote={parkingNote}
        accessibility={accessibility}
        accessibilityNote={accessibilityNote}
        onParking={setParking}
        onParkingNote={setParkingNote}
        onAccessibility={setAccessibility}
        onAccessibilityNote={setAccessibilityNote}
      />

      <div>
        <label
          htmlFor="admin-spot-credit"
          className="mb-1 block text-sm text-[var(--sand-muted)]"
        >
          {t("adminContributorEditLabel")}
        </label>
        <input
          id="admin-spot-credit"
          maxLength={80}
          value={contributorName}
          onChange={(event) => setContributorName(event.target.value)}
          className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
        />
      </div>

      <div>
        <label htmlFor={statusId} className="mb-1 block text-sm text-[var(--sand-muted)]">
          {t("adminStatusLabel")}
        </label>
        <select
          id={statusId}
          value={status}
          onChange={(event) => setStatus(event.target.value as SpotStatus)}
          className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
        >
          {SPOT_STATUS_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(STATUS_LABEL[value])}
            </option>
          ))}
        </select>
      </div>

      <fieldset
        className="space-y-3"
        aria-describedby={coverReplacedByDeletion ? coverNoteId : undefined}
      >
        <legend className="mb-1 text-sm text-[var(--sand-muted)]">{t("photoOptional")}</legend>
        {!removeCover && coverPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPreview} alt="" className="max-h-48 w-full object-cover" />
        ) : null}
        {!removeCover && !coverPreview && effectiveCover.startsWith("https://") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={effectiveCover} alt="" className="max-h-48 w-full object-cover" />
        ) : null}
        {coverReplacedByDeletion ? (
          <p id={coverNoteId} className="text-sm text-[var(--sand-muted)]" role="status">
            {coverResolution.photoUrl ? t("adminCoverMoved") : t("adminCoverRemoved")}
          </p>
        ) : null}
        {currentCover || coverFile ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--sand)]">
            <input
              type="checkbox"
              checked={removeCover}
              onChange={(event) => {
                setRemoveCover(event.target.checked);
                if (event.target.checked) replaceCoverFile(null);
              }}
              className="size-4 accent-[var(--ember)]"
            />
            {t("adminRemoveCover")}
          </label>
        ) : null}
        <div>
          <label htmlFor={photoInputId} className="mb-1 block text-xs text-[var(--sand-muted)]">
            {t("adminNewCoverLabel")}
          </label>
          <input
            id={photoInputId}
            type="file"
            accept={SPOT_PHOTO_INPUT_ACCEPT}
            disabled={saving || removeCover}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = "";
              replaceCoverFile(file);
              if (file) setRemoveCover(false);
            }}
            className="block w-full text-sm text-[var(--sand-muted)] file:me-3 file:border-0 file:bg-[var(--ember)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white disabled:opacity-40"
          />
        </div>
        <div>
          <label htmlFor="admin-spot-photo-url" className="mb-1 block text-xs text-[var(--sand-muted)]">
            {t("adminCoverUrlLabel")}
          </label>
          <input
            id="admin-spot-photo-url"
            type="url"
            dir="ltr"
            value={coverReplacedByDeletion ? effectiveCover : photoUrl}
            disabled={removeCover || Boolean(coverFile)}
            onChange={(event) => setPhotoUrl(event.target.value)}
            className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-start text-sm text-[var(--sand)] outline-none focus:border-[var(--ember)] disabled:opacity-40"
            placeholder="https://"
          />
        </div>
      </fieldset>

      {photos.length > 0 ? (
        <fieldset>
          <legend className="mb-2 text-sm text-[var(--sand-muted)]">
            {t("adminGalleryLabel")}
          </legend>
          <ul className="space-y-3">
            {photos.map((photo, index) => {
              const marked = removePhotoIds.includes(photo.id);
              return (
                <li key={photo.id} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    className={`h-16 w-24 object-cover ${marked ? "opacity-40" : ""}`}
                  />
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--sand)]">
                    <input
                      type="checkbox"
                      checked={marked}
                      onChange={() => togglePhoto(photo.id)}
                      aria-label={`${t("adminRemoveGalleryPhoto")} ${index + 1}`}
                      className="size-4 accent-[var(--ember)]"
                    />
                    {t("adminRemoveGalleryPhoto")}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : null}

      <div>
        <p className="mb-2 text-sm text-[var(--sand-muted)]">
          {t("tapMap")}
          {hasDraftLocation ? (
            <span dir="ltr" className="ms-1 inline-block text-start tabular-nums">
              {draftLat!.toFixed(5)}, {draftLng!.toFixed(5)}
            </span>
          ) : null}
        </p>
        <div className="relative z-10 h-64 w-full rounded-sm">
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

      {notice ? (
        <p className="text-sm text-[var(--ember)]" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="min-h-12 bg-[var(--ember)] px-5 py-2.5 font-medium text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {saving ? t("saving") : t("saveChanges")}
      </button>
    </form>
  );
}
