/**
 * Browser-only image helpers for community photo uploads. We generate two
 * JPEG versions client-side (no server image library needed on Workers): a
 * small thumbnail for the album grid and a capped "full" image for the
 * viewer. EXIF orientation is baked in so portrait photos aren't sideways.
 */

async function resize(
  file: File,
  maxDim: number,
  quality: number,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, "image/jpeg", quality),
  );
  if (!blob) throw new Error("Image encoding failed");
  return blob;
}

export const FULL_MAX_DIM = 2000;
export const THUMB_MAX_DIM = 600;

/** Returns `{ full, thumb }` JPEG blobs resized from a user-selected image. */
export async function makeUploadVersions(
  file: File,
): Promise<{ full: Blob; thumb: Blob }> {
  const [full, thumb] = await Promise.all([
    resize(file, FULL_MAX_DIM, 0.85),
    resize(file, THUMB_MAX_DIM, 0.72),
  ]);
  return { full, thumb };
}
