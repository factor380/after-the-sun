import {
  MAX_SPOT_PHOTO_BYTES,
  MAX_SPOT_PHOTO_EDGE,
  TARGET_SPOT_PHOTO_BYTES,
} from "@/lib/spot-photo";

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

/**
 * Copy a small photo into a fresh in-memory File.
 * Mobile browsers (Android Chrome cloud photos, iOS) can invalidate the
 * original input handle before upload, which surfaces as a failed fetch.
 * Reading here, at selection time, either captures the bytes or throws so
 * the form can show photoCompressFailed before submit.
 */
async function copyFileIntoMemory(file: File): Promise<File> {
  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to read photo");
  }

  return new File([bytes], file.name, {
    type: file.type,
    lastModified: file.lastModified,
  });
}

/**
 * Resize + recompress a spot photo in the browser (JPEG) to keep Storage cheap.
 * Files already under the target size are still copied into memory; only the
 * canvas path needs a document.
 */
export async function compressSpotPhoto(file: File): Promise<File> {
  if (file.size <= TARGET_SPOT_PHOTO_BYTES) {
    return copyFileIntoMemory(file);
  }

  if (typeof document === "undefined") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
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
