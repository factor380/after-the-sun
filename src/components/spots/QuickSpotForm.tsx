"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LocationPickerClient from "@/components/map/LocationPickerClient";
import SpotAmenityFields from "@/components/spots/SpotAmenityFields";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cleanAmenityNote } from "@/lib/spot-amenities";
import {
  compressSpotPhoto,
  SpotPhotoTooLargeError,
} from "@/lib/compress-spot-photo";
import {
  fetchWithNetworkRetry,
  readResponseJson,
  submitErrorText,
} from "@/lib/fetch-with-network-retry";
import { isWithinIsraelBounds } from "@/lib/geo/israel";
import { messageKeyForRequestFailure } from "@/lib/i18n/user-facing-error";
import {
  clearNewSpotDraft,
  loadNewSpotDraft,
  saveNewSpotDraft,
  writeNewSpotDraftText,
  type SaveNewSpotDraftInput,
} from "@/lib/new-spot-draft";
import {
  isAcceptableSpotPhotoFile,
  MAX_SPOT_PHOTO_INPUT_BYTES,
  SPOT_PHOTO_INPUT_ACCEPT,
} from "@/lib/spot-photo";
import { AMENITY_NOTE_MAX, type Accessibility, type Parking } from "@/types/spot";

type ReadyPhoto = { file: File; previewUrl: string };

function responseField(data: unknown, key: string): unknown {
  if (!data || typeof data !== "object") return undefined;
  return (data as Record<string, unknown>)[key];
}

function noteOrNull(value: string): string | null {
  const cleaned = cleanAmenityNote(value).slice(0, AMENITY_NOTE_MAX);
  return cleaned.length > 0 ? cleaned : null;
}

type QuickSpotFormProps = {
  signedIn: boolean;
  displayName: string | null;
};

export default function QuickSpotForm({ signedIn, displayName }: QuickSpotFormProps) {
  const router = useRouter();
  const { t } = useLocale();
  const photoInputId = useId();
  const honeypotId = useId();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const previewRef = useRef<string | null>(null);
  const touchedRef = useRef(false);
  const keepDraftRef = useRef(true);
  const draftReadyRef = useRef(false);
  const draftRef = useRef<SaveNewSpotDraftInput | null>(null);

  const [name, setName] = useState("");
  const [contributorName, setContributorName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [parking, setParking] = useState<Parking | null>(null);
  const [parkingNote, setParkingNote] = useState("");
  const [accessibility, setAccessibility] = useState<Accessibility | null>(null);
  const [accessibilityNote, setAccessibilityNote] = useState("");
  const [photo, setPhoto] = useState<ReadyPhoto | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState<{ photoSkipped: boolean } | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [photosMissing, setPhotosMissing] = useState(false);

  function touch() {
    touchedRef.current = true;
  }

  const draftInput: SaveNewSpotDraftInput = {
    name,
    description,
    region,
    lat,
    lng,
    confirmedLat: lat,
    confirmedLng: lng,
    photoUrl: "",
    acceptedGuidelines: false,
    parking,
    parkingNote,
    accessibility,
    accessibilityNote,
    contributorName,
    photos: photo ? [photo.file] : [],
  };
  draftRef.current = draftInput;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const restoredDraft = await loadNewSpotDraft();
      if (cancelled) return;
      if (restoredDraft && !touchedRef.current) {
        const { fields, photos } = restoredDraft;
        setName(fields.name);
        setDescription(fields.description);
        setRegion(fields.region);
        setLat(fields.lat ?? fields.confirmedLat);
        setLng(fields.lng ?? fields.confirmedLng);
        setParking(fields.parking);
        setParkingNote(fields.parkingNote);
        setAccessibility(fields.accessibility);
        setAccessibilityNote(fields.accessibilityNote);
        setContributorName(fields.contributorName);
        const file = photos[0];
        if (file) {
          setReadyPhoto({ file, previewUrl: URL.createObjectURL(file) });
        }
        setPhotosMissing(restoredDraft.photosMissing);
        setRestored(true);
      }
      draftReadyRef.current = true;
      if (!cancelled) setDraftReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    const timer = window.setTimeout(() => {
      if (!keepDraftRef.current || !draftRef.current) return;
      void saveNewSpotDraft(draftRef.current);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [
    draftReady,
    name,
    description,
    region,
    lat,
    lng,
    parking,
    parkingNote,
    accessibility,
    accessibilityNote,
    contributorName,
    photo,
  ]);

  useEffect(() => {
    function flush() {
      if (!keepDraftRef.current || !draftRef.current) return;
      if (!draftReadyRef.current && !touchedRef.current) return;
      writeNewSpotDraftText(draftRef.current);
    }
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  function setReadyPhoto(next: ReadyPhoto | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next?.previewUrl ?? null;
    setPhoto(next);
  }

  function chooseLocation(nextLat: number, nextLng: number) {
    touch();
    if (!isWithinIsraelBounds(nextLat, nextLng)) {
      setError(t("locationOutsideIsrael"));
      return;
    }
    setLat(nextLat);
    setLng(nextLng);
    setError(null);
  }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError(t("locationUnavailable"));
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current) return;
        setLocating(false);
        chooseLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        if (!mountedRef.current) return;
        setLocating(false);
        setError(t("locationDenied"));
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  async function onPhotoSelected(fileList: FileList | null) {
    touch();
    const file = fileList?.[0];
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (!file || compressing || saving) return;
    setError(null);

    if (file.size > MAX_SPOT_PHOTO_INPUT_BYTES) {
      setError(t("photoTooLarge"));
      return;
    }
    if (!isAcceptableSpotPhotoFile(file)) {
      setError(t("photoInvalidType"));
      return;
    }

    setCompressing(true);
    try {
      const compressed = await compressSpotPhoto(file);
      if (!mountedRef.current) return;
      setReadyPhoto({
        file: compressed,
        previewUrl: URL.createObjectURL(compressed),
      });
    } catch (caught) {
      if (!mountedRef.current) return;
      setError(
        caught instanceof SpotPhotoTooLargeError ? t("photoTooLarge") : t("photoLoadFailed"),
      );
    } finally {
      if (mountedRef.current) setCompressing(false);
    }
  }

  async function uploadPhoto(file: File): Promise<{ url: string | null; skipped: boolean }> {
    const body = new FormData();
    body.append("file", file);
    const endpoint = signedIn ? "/api/spots/upload" : "/api/spots/suggestions/upload";
    const res = await fetchWithNetworkRetry(endpoint, { method: "POST", body });
    const data = await readResponseJson(res);
    if (!signedIn && res.status === 503) return { url: null, skipped: true };
    if (!res.ok) {
      throw new Error(
        t(
          messageKeyForRequestFailure(
            res.status,
            responseField(data, "error"),
            "photoUploadFailed",
          ),
        ),
      );
    }
    const photoUrl = responseField(data, "photoUrl");
    if (typeof photoUrl !== "string" || !photoUrl.startsWith("https://")) {
      throw new Error(t("photoUploadFailed"));
    }
    return { url: photoUrl, skipped: false };
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving || compressing || locating) return;
    setError(null);

    if (lat === null || lng === null) {
      setError(t("clickMapError"));
      return;
    }

    setSaving(true);
    try {
      let photoUrl: string | null = null;
      let photoSkipped = false;
      if (photo) {
        const uploaded = await uploadPhoto(photo.file);
        photoUrl = uploaded.url;
        photoSkipped = uploaded.skipped;
      }

      const payload = {
        name,
        description: description.trim() || undefined,
        region: region.trim() || null,
        lat,
        lng,
        photoUrl,
        parking,
        parkingNote: noteOrNull(parkingNote),
        accessibility,
        accessibilityNote: noteOrNull(accessibilityNote),
        website,
        ...(signedIn
          ? { acceptedGuidelines: true as const, clientRequestId: crypto.randomUUID() }
          : {
              contributorName: contributorName.trim() || null,
              clientRequestId: crypto.randomUUID(),
            }),
      };

      const res = await fetchWithNetworkRetry(
        signedIn ? "/api/spots" : "/api/spots/suggestions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await readResponseJson(res);
      if (!res.ok) {
        throw new Error(
          t(messageKeyForRequestFailure(res.status, responseField(data, "error"), "saveFailed")),
        );
      }

      keepDraftRef.current = false;
      await clearNewSpotDraft();

      if (signedIn) {
        const id = responseField(data, "id");
        if (typeof id !== "string" || !id) throw new Error(t("saveFailed"));
        router.push(`/spots/${id}`);
        router.refresh();
        return;
      }

      setThanks({ photoSkipped });
    } catch (caught) {
      setError(submitErrorText(caught, t, "saveFailed"));
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }

  if (thanks) {
    return (
      <div className="border border-[var(--line)] bg-[var(--surface)] px-4 py-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]">
          {t("suggestionThanksTitle")}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--sand-muted)]">
          {t("suggestionThanksBody")}
        </p>
        {thanks.photoSkipped ? (
          <p className="mt-3 text-sm text-[var(--sand-muted)]">{t("photoSkipped")}</p>
        ) : null}
        <Link
          href="/"
          className="mt-6 inline-flex min-h-12 items-center bg-[var(--ember)] px-5 font-medium text-white"
        >
          {t("backToMap")}
        </Link>
      </div>
    );
  }

  const hasLocation = lat !== null && lng !== null;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div
        aria-hidden="true"
        className="absolute h-px w-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)]"
      >
        <label htmlFor={honeypotId}>Website</label>
        <input
          id={honeypotId}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="spot-name" className="mb-1 block text-sm text-[var(--sand-muted)]">
          {t("name")}
        </label>
        <input
          id="spot-name"
          required
          value={name}
          onChange={(event) => {
            touch();
            setName(event.target.value);
          }}
          autoComplete="off"
          enterKeyHint="next"
          className="min-h-12 w-full border border-[var(--line)] bg-[var(--surface)] px-3 text-base text-[var(--sand)] outline-none focus:border-[var(--ember)]"
          placeholder={t("namePlaceholder")}
        />
      </div>

      <div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating || saving}
          className="min-h-12 w-full border border-[var(--ember)] px-4 text-base font-medium text-[var(--ember)] transition hover:bg-[var(--ember)] hover:text-white disabled:opacity-60"
        >
          {locating ? t("locatingMyPosition") : t("useMyLocation")}
        </button>
        <p className="mb-2 mt-4 text-sm text-[var(--sand-muted)]">
          {t("pickOnMapHint")}
          {hasLocation ? (
            <>
              {" "}
              <span className="font-medium text-[var(--ember)]">{t("locationReady")}</span>
              <span dir="ltr" className="ms-2 inline-block tabular-nums">
                {lat!.toFixed(5)}, {lng!.toFixed(5)}
              </span>
            </>
          ) : null}
        </p>
        <div className="relative z-10 h-64 w-full rounded-sm">
          <LocationPickerClient lat={lat} lng={lng} onPick={chooseLocation} />
        </div>
      </div>

      <div aria-busy={compressing}>
        <label htmlFor={photoInputId} className="mb-1 block text-sm text-[var(--sand-muted)]">
          {t("photoOptional")}
        </label>
        <input
          id={photoInputId}
          ref={photoInputRef}
          type="file"
          accept={SPOT_PHOTO_INPUT_ACCEPT}
          onChange={(event) => {
            void onPhotoSelected(event.target.files);
          }}
          disabled={compressing || saving}
          className="block w-full text-sm text-[var(--sand-muted)] file:me-3 file:min-h-12 file:border-0 file:bg-[var(--ember)] file:px-4 file:text-base file:font-medium file:text-white"
        />
        <p className="mt-1 text-xs text-[var(--sand-muted)]">{t("photoLandscapeGuide")}</p>
        {!signedIn ? (
          <p className="mt-1 text-xs text-[var(--sand-muted)]">{t("photoSignedOutNote")}</p>
        ) : null}
        {compressing ? (
          <p className="mt-2 text-sm text-[var(--ember)]" role="status">
            {t("photoLoading")}
          </p>
        ) : null}
        {photosMissing ? (
          <p className="mt-2 text-sm text-[var(--ember)]">{t("draftPhotosMissing")}</p>
        ) : null}
        {photo ? (
          <div className="relative mt-3 overflow-hidden rounded-sm border border-[var(--line)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.previewUrl} alt="" className="max-h-48 w-full object-cover" />
            <button
              type="button"
              onClick={() => {
                touch();
                setReadyPhoto(null);
              }}
              className="absolute end-2 top-2 min-h-10 bg-[var(--dusk-deep)]/80 px-3 text-sm text-[var(--sand)]"
            >
              {t("photoRemove")}
            </button>
          </div>
        ) : null}
      </div>

      {signedIn ? (
        <p className="text-sm leading-relaxed text-[var(--sand-muted)]">
          {displayName ? (
            <>
              {t("signedInCredit")} {displayName}.
            </>
          ) : (
            t("signedInCreditNoName")
          )}
        </p>
      ) : (
        <div>
          <p className="text-sm leading-relaxed text-[var(--sand-muted)]">
            {t("suggestionCreditNote")}{" "}
            <Link
              href="/login?next=/spots/new"
              className="text-[var(--ember)] underline"
              onClick={(event) => {
                event.preventDefault();
                void (async () => {
                  touch();
                  const saved = await saveNewSpotDraft(draftRef.current ?? draftInput);
                  if (!saved.stored) {
                    setError(t("draftSaveFailed"));
                    return;
                  }
                  router.push("/login?next=/spots/new");
                })();
              }}
            >
              {t("signInWithGoogle")}
            </Link>
          </p>
          <label
            htmlFor="contributor-name"
            className="mb-1 mt-3 block text-sm text-[var(--sand-muted)]"
          >
            {t("contributorNameLabel")}
          </label>
          <input
            id="contributor-name"
            value={contributorName}
            onChange={(event) => {
              touch();
              setContributorName(event.target.value);
            }}
            maxLength={80}
            autoComplete="name"
            className="min-h-12 w-full border border-[var(--line)] bg-[var(--surface)] px-3 text-base text-[var(--sand)] outline-none focus:border-[var(--ember)]"
          />
        </div>
      )}

      <details className="border border-[var(--line)] bg-[var(--surface)] px-3 py-3">
        <summary className="cursor-pointer text-sm text-[var(--sand-muted)]">
          {t("moreDetails")}
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="spot-description" className="mb-1 block text-sm text-[var(--sand-muted)]">
              {t("description")}
            </label>
            <textarea
              id="spot-description"
              rows={3}
              value={description}
              onChange={(event) => {
                touch();
                setDescription(event.target.value);
              }}
              className="w-full border border-[var(--line)] bg-[var(--dusk-deep)] px-3 py-2 text-base text-[var(--sand)] outline-none focus:border-[var(--ember)]"
              placeholder={t("descriptionPlaceholder")}
            />
          </div>
          <div>
            <label htmlFor="spot-region" className="mb-1 block text-sm text-[var(--sand-muted)]">
              {t("regionOptional")}
            </label>
            <input
              id="spot-region"
              value={region}
              onChange={(event) => {
                touch();
                setRegion(event.target.value);
              }}
              className="min-h-12 w-full border border-[var(--line)] bg-[var(--dusk-deep)] px-3 text-base text-[var(--sand)] outline-none focus:border-[var(--ember)]"
              placeholder={t("regionPlaceholder")}
            />
          </div>
          <SpotAmenityFields
            parking={parking}
            parkingNote={parkingNote}
            accessibility={accessibility}
            accessibilityNote={accessibilityNote}
            onParking={(value) => {
              touch();
              setParking(value);
            }}
            onParkingNote={(value) => {
              touch();
              setParkingNote(value);
            }}
            onAccessibility={(value) => {
              touch();
              setAccessibility(value);
            }}
            onAccessibilityNote={(value) => {
              touch();
              setAccessibilityNote(value);
            }}
          />
        </div>
      </details>

      <p className="text-sm leading-relaxed text-[var(--sand-muted)]">{t("submitNotice")}</p>
      {restored ? (
        <p className="text-sm text-[var(--ember)]">{t("draftRestored")}</p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-0 -mx-5 border-t border-[var(--line)] bg-[var(--dusk-deep)]/95 px-5 py-3 backdrop-blur">
        <button
          type="submit"
          disabled={saving || compressing || locating}
          className="min-h-12 w-full bg-[var(--ember)] text-base font-medium text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {saving ? t("saving") : signedIn ? t("shareSpot") : t("suggestSubmit")}
        </button>
      </div>
    </form>
  );
}
