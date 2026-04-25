/**
 * Browser image compression util.
 * - Downscales to a max width (default 1024px), preserves aspect ratio.
 * - Re-encodes to JPEG at quality 0.7 by default.
 * - Skips non-image files (returns the original File untouched).
 * - Returns a File so it keeps a filename + can be uploaded directly.
 */
export type CompressOptions = {
  maxWidth?: number;
  quality?: number;
  mimeType?: "image/jpeg" | "image/webp";
};

const DEFAULTS: Required<CompressOptions> = {
  maxWidth: 1024,
  quality: 0.7,
  mimeType: "image/jpeg",
};

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const { maxWidth, quality, mimeType } = { ...DEFAULTS, ...opts };

  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  // No need to upscale tiny images
  const scale = img.width > maxWidth ? maxWidth / img.width : 1;
  const targetW = Math.round(img.width * scale);
  const targetH = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, mimeType, quality),
  );
  if (!blob) return file;

  // If compression made the file larger (e.g. tiny PNG icon), keep original
  if (blob.size >= file.size) return file;

  const ext = mimeType === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.${ext}`, { type: mimeType });
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
