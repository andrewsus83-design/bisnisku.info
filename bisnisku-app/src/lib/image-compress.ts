/**
 * Client-side image compression utility.
 * Compresses images to under maxSizeKB using canvas downscaling + JPEG quality reduction.
 */

const DEFAULT_MAX_KB = 200;
const MAX_DIMENSION = 1200; // Max width or height in px

/**
 * Compress an image File to a base64 data URI under the target size.
 * Uses iterative quality reduction to hit the target.
 */
export async function compressImage(
  file: File,
  maxSizeKB: number = DEFAULT_MAX_KB
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const result = compressWithCanvas(img, maxSizeKB);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Gagal membaca gambar"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

function compressWithCanvas(img: HTMLImageElement, maxSizeKB: number): string {
  // Calculate scaled dimensions
  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(img, 0, 0, width, height);

  // Iteratively reduce quality to hit target size
  const maxBytes = maxSizeKB * 1024;
  let quality = 0.85;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);

  // Estimate base64 size → actual bytes ≈ base64.length * 0.75
  while (estimateBytes(dataUrl) > maxBytes && quality > 0.1) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  // If still too big, scale down further
  if (estimateBytes(dataUrl) > maxBytes) {
    const scaleFactor = 0.7;
    canvas.width = Math.round(width * scaleFactor);
    canvas.height = Math.round(height * scaleFactor);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    dataUrl = canvas.toDataURL("image/jpeg", 0.6);
  }

  return dataUrl;
}

function estimateBytes(dataUrl: string): number {
  // Remove data URI prefix, then estimate: base64 chars * 3/4 = bytes
  const base64 = dataUrl.split(",")[1] || "";
  return Math.round(base64.length * 0.75);
}
