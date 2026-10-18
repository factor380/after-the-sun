import {
  ALLOWED_SPOT_PHOTO_TYPES,
  MAX_PHOTOS_ON_CREATE,
  MAX_SPOT_PHOTO_BYTES,
} from "@/lib/spot-photo";

/**
 * Anonymous add-spot drafts survive the Google OAuth redirect.
 * Text stays in localStorage. Photo bytes stay in IndexedDB because
 * localStorage cannot reliably hold compressed images.
 * Nothing here is sent to the server; the create API still requires a session.
 */

const STORAGE_KEY = "ats-new-spot-draft-v1";
const DB_NAME = "ats-new-spot-draft";
const DB_VERSION = 1;
const STORE = "files";
const PHOTO_KEY = "selected";
const TTL_MS = 24 * 60 * 60 * 1000;

const NAME_MAX = 80;
const DESCRIPTION_MAX = 1000;
const REGION_MAX = 80;
const PHOTO_URL_MAX = 2048;

export type NewSpotDraftFields = {
  name: string;
  description: string;
  region: string;
  lat: number | null;
  lng: number | null;
  confirmedLat: number | null;
  confirmedLng: number | null;
  photoUrl: string;
  acceptedGuidelines: boolean;
  expectedPhotoCount: number;
  savedAt: number;
};

export type SaveNewSpotDraftInput = {
  name: string;
  description: string;
  region: string;
  lat: number | null;
  lng: number | null;
  confirmedLat: number | null;
  confirmedLng: number | null;
  photoUrl: string;
  acceptedGuidelines: boolean;
  photos: File[];
};

export type LoadedNewSpotDraft = {
  fields: NewSpotDraftFields;
  photos: File[];
  photosMissing: boolean;
};

type StoredPhoto = {
  type: string;
  blob: Blob;
};

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  return value.slice(0, max);
}

function coord(value: unknown, min: number, max: number): number | null | undefined {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value < min || value > max) return undefined;
  return value;
}

function httpsPhotoUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, PHOTO_URL_MAX);
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function hasContent(fields: NewSpotDraftFields): boolean {
  return Boolean(
    fields.name ||
      fields.description ||
      fields.region ||
      fields.photoUrl ||
      fields.lat !== null ||
      fields.lng !== null ||
      fields.expectedPhotoCount > 0,
  );
}

/** Parse a stored draft. Returns null when the payload is missing, stale, or corrupt. */
export function parseNewSpotDraft(raw: string, now = Date.now()): NewSpotDraftFields | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  const name = text(record.name, NAME_MAX);
  const description = text(record.description, DESCRIPTION_MAX);
  const region = text(record.region, REGION_MAX);
  const photoUrl = httpsPhotoUrl(record.photoUrl);
  const lat = coord(record.lat, -90, 90);
  const lng = coord(record.lng, -180, 180);
  const confirmedLat = coord(record.confirmedLat, -90, 90);
  const confirmedLng = coord(record.confirmedLng, -180, 180);
  if (
    name === null ||
    description === null ||
    region === null ||
    photoUrl === null ||
    lat === undefined ||
    lng === undefined ||
    confirmedLat === undefined ||
    confirmedLng === undefined
  ) {
    return null;
  }

  const savedAt = record.savedAt;
  if (typeof savedAt !== "number" || !Number.isFinite(savedAt)) return null;
  if (savedAt > now + 60_000) return null;
  if (now - savedAt > TTL_MS) return null;

  let expectedPhotoCount = 0;
  if (
    typeof record.expectedPhotoCount === "number" &&
    Number.isInteger(record.expectedPhotoCount) &&
    record.expectedPhotoCount >= 0 &&
    record.expectedPhotoCount <= MAX_PHOTOS_ON_CREATE
  ) {
    expectedPhotoCount = record.expectedPhotoCount;
  }

  const fields: NewSpotDraftFields = {
    name,
    description,
    region,
    lat,
    lng,
    confirmedLat,
    confirmedLng,
    photoUrl,
    acceptedGuidelines: record.acceptedGuidelines === true,
    expectedPhotoCount,
    savedAt,
  };
  if (!hasContent(fields)) return null;
  return fields;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("indexedDB open failed"));
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        let settled = false;
        const finish = (fn: () => void) => {
          if (settled) return;
          settled = true;
          try {
            db.close();
          } catch {
            // The transaction result is what matters.
          }
          fn();
        };

        const tx = db.transaction(STORE, mode);
        const request = run(tx.objectStore(STORE));
        let result = undefined as T;
        request.onsuccess = () => {
          result = request.result;
        };
        tx.oncomplete = () => finish(() => resolve(result));
        tx.onabort = () =>
          finish(() => reject(tx.error ?? request.error ?? new Error("indexedDB aborted")));
        tx.onerror = () =>
          finish(() => reject(tx.error ?? request.error ?? new Error("indexedDB request failed")));
      }),
  );
}

async function writePhotos(photos: File[]): Promise<boolean> {
  if (photos.length > MAX_PHOTOS_ON_CREATE) return false;
  const stored: StoredPhoto[] = [];
  for (const photo of photos) {
    if (!(ALLOWED_SPOT_PHOTO_TYPES as readonly string[]).includes(photo.type)) return false;
    if (photo.size <= 0 || photo.size > MAX_SPOT_PHOTO_BYTES) return false;
    const buffer = await photo.arrayBuffer();
    stored.push({
      type: photo.type,
      blob: new Blob([buffer], { type: photo.type }),
    });
  }
  await withStore("readwrite", (store) => store.put(stored, PHOTO_KEY));
  return true;
}

async function readPhotos(): Promise<File[]> {
  const stored = await withStore<StoredPhoto[] | undefined>("readonly", (store) =>
    store.get(PHOTO_KEY),
  );
  if (!Array.isArray(stored)) return [];
  const files: File[] = [];
  for (const photo of stored) {
    if (!photo || typeof photo.type !== "string" || !(photo.blob instanceof Blob)) continue;
    if (!(ALLOWED_SPOT_PHOTO_TYPES as readonly string[]).includes(photo.type)) continue;
    if (photo.blob.size <= 0 || photo.blob.size > MAX_SPOT_PHOTO_BYTES) continue;
    const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    files.push(new File([photo.blob], `sunset.${ext}`, { type: photo.type }));
    if (files.length >= MAX_PHOTOS_ON_CREATE) break;
  }
  return files;
}

async function deletePhotos(): Promise<void> {
  try {
    await withStore("readwrite", (store) => store.delete(PHOTO_KEY));
  } catch {
    // The text draft can still be restored; the form asks for the photo again.
  }
}

export async function saveNewSpotDraft(
  input: SaveNewSpotDraftInput,
): Promise<{ stored: boolean; photosStored: boolean }> {
  const fields: NewSpotDraftFields = {
    name: input.name.slice(0, NAME_MAX),
    description: input.description.slice(0, DESCRIPTION_MAX),
    region: input.region.slice(0, REGION_MAX),
    lat: input.lat,
    lng: input.lng,
    confirmedLat: input.confirmedLat,
    confirmedLng: input.confirmedLng,
    photoUrl: httpsPhotoUrl(input.photoUrl) ?? "",
    acceptedGuidelines: input.acceptedGuidelines,
    expectedPhotoCount: Math.min(input.photos.length, MAX_PHOTOS_ON_CREATE),
    savedAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
  } catch {
    return { stored: false, photosStored: false };
  }

  if (input.photos.length === 0) {
    await deletePhotos();
    return { stored: true, photosStored: true };
  }

  try {
    const photosStored = await writePhotos(input.photos.slice(0, MAX_PHOTOS_ON_CREATE));
    if (!photosStored) await deletePhotos();
    return { stored: true, photosStored };
  } catch {
    await deletePhotos();
    return { stored: true, photosStored: false };
  }
}

export async function loadNewSpotDraft(): Promise<LoadedNewSpotDraft | null> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  const fields = parseNewSpotDraft(raw);
  if (!fields) {
    await clearNewSpotDraft();
    return null;
  }

  let photos: File[] = [];
  try {
    photos = await readPhotos();
  } catch {
    photos = [];
  }

  return {
    fields,
    photos,
    photosMissing: fields.expectedPhotoCount > 0 && photos.length < fields.expectedPhotoCount,
  };
}

export async function clearNewSpotDraft(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore blocked storage; the next successful save overwrites the key.
  }
  await deletePhotos();
}
