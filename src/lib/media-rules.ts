export const allowedMediaTypes: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "video/mp4": "mp4",
  "video/webm": "webm",
};
export function validateMediaFile(file: { type: string; size: number }) {
  if (!allowedMediaTypes[file.type])
    return "صيغة غير مدعومة. استخدم WebP أو JPEG أو PNG للصور وMP4 أو WebM للفيديو.";
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > 50 * 1024 * 1024)
    return "يجب أن يكون الملف غير فارغ ولا يتجاوز 50 ميجابايت.";
  return null;
}
export function selectMediaOverride<T extends { target_key: string }>(
  overrides: T[],
  context: string,
  assetId: string,
) {
  return (
    overrides.find((o) => o.target_key === `${context}:${assetId}`) ??
    overrides.find((o) => o.target_key === `*:${assetId}`)
  );
}
