import {
  declaredSpotPhotoType,
  detectSpotPhotoMime,
  extensionForSpotPhotoType,
  MAX_SPOT_PHOTO_BYTES,
  MAX_SPOT_PHOTO_EDGE,
  MAX_SPOT_PHOTO_INPUT_BYTES,
  TARGET_SPOT_PHOTO_BYTES,
  type AllowedSpotPhotoType,
} from "@/lib/spot-photo";

/** Budget for reading a picked photo (including a cloud download) and compressing it. */
export const SPOT_PHOTO_LOAD_TIMEOUT_MS = 25_000;

export class SpotPhotoLoadTimeoutError extends Error {
  constructor() {
    super("PHOTO_LOAD_TIMEOUT");
    this.name = "SpotPhotoLoadTimeoutError";
  }
}

export class SpotPhotoTooLargeError extends Error {
  constructor() {
    super("PHOTO_TOO_LARGE");
    this.name = "SpotPhotoTooLargeError";
  }
}

/**
 * Resolve when `work` settles, or reject when `timeoutMs` elapses first.
 * A late result from `work` is ignored so a cloud download cannot surface twice.
 */
export function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new SpotPhotoLoadTimeoutError());
    }, timeoutMs);

    work.then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to compress image"));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function drawToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to compress image");
  }
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function scaledSize(width: number, height: number, maxEdge: number) {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width, height };
  }
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function namedPhotoFile(
  buffer: ArrayBuffer,
  originalName: string,
  type: AllowedSpotPhotoType,
  lastModified: number,
): File {
  const baseName = originalName.replace(/\.[^.]+$/, "") || "sunset";
  return new File([buffer], `${baseName}.${extensionForSpotPhotoType(type)}`, {
    type,
    lastModified,
  });
}

/**
 * Read the whole file, then resize and recompress it to JPEG when needed.
 * `arrayBuffer` is what downloads a cloud photo, and it also copies a small
 * file into a fresh handle. Mobile browsers can invalidate the original
 * input file before upload.
 */
async function readAndCompressSpotPhoto(file: File): Promise<File> {
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to read photo");
  }
  if (buffer.byteLength > MAX_SPOT_PHOTO_INPUT_BYTES) {
    throw new SpotPhotoTooLargeError();
  }

  const declared = declaredSpotPhotoType(file.type);
  if (declared && buffer.byteLength <= TARGET_SPOT_PHOTO_BYTES) {
    return new File([buffer], file.name || "sunset.jpg", {
      type: declared,
      lastModified: file.lastModified,
    });
  }

  const detected = detectSpotPhotoMime(new Uint8Array(buffer));
  if (detected && buffer.byteLength <= TARGET_SPOT_PHOTO_BYTES) {
    return namedPhotoFile(buffer, file.name, detected, file.lastModified);
  }

  if (buffer.byteLength <= TARGET_SPOT_PHOTO_BYTES) {
    return new File([buffer], file.name || "sunset", {
      type: file.type,
      lastModified: file.lastModified,
    });
  }

  if (typeof document === "undefined") {
    return file;
  }

  const decodeType = detected ?? declared;
  const bitmap = await createImageBitmap(
    decodeType ? new Blob([buffer], { type: decodeType }) : new Blob([buffer]),
  );
  try {
    const { width, height } = scaledSize(
      bitmap.width,
      bitmap.height,
      MAX_SPOT_PHOTO_EDGE,
    );
    const canvas = drawToCanvas(bitmap, width, height);

    let quality = 0.82;
    let blob = await canvasToBlob(canvas, "image/jpeg", quality);

    while (blob.size > TARGET_SPOT_PHOTO_BYTES && quality > 0.5) {
      quality -= 0.08;
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
    }

    if (blob.size > MAX_SPOT_PHOTO_BYTES) {
      quality = Math.max(0.4, quality - 0.1);
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
    }

    if (blob.size > MAX_SPOT_PHOTO_BYTES) {
      throw new Error("COMPRESS_TOO_LARGE");
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "sunset";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

/**
 * Resize + recompress a spot photo in the browser (JPEG) to keep Storage cheap.
 * Files already under the target size are still copied into memory. Reading
 * and encoding give up after {@link SPOT_PHOTO_LOAD_TIMEOUT_MS}.
 */
export async function compressSpotPhoto(
  file: File,
  timeoutMs = SPOT_PHOTO_LOAD_TIMEOUT_MS,
): Promise<File> {
  return withTimeout(readAndCompressSpotPhoto(file), timeoutMs);
}
