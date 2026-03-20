"use client";

const MAX_WIDTH = 1920;
const QUALITY = 0.82;

/**
 * Downscale image in-browser and encode as WebP (fallback JPEG if needed).
 */
export async function resizeImageForCalendarBackground(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, MAX_WIDTH / bitmap.width);
    const w = Math.round(bitmap.width * ratio);
    const h = Math.round(bitmap.height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(bitmap, 0, 0, w, h);

    const webpBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", QUALITY)
    );
    if (webpBlob && webpBlob.size > 0) return webpBlob;

    const jpegBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", QUALITY)
    );
    if (!jpegBlob) throw new Error("No se pudo generar la imagen");
    return jpegBlob;
  } finally {
    bitmap.close();
  }
}
