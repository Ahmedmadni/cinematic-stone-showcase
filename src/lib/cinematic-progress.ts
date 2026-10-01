/** Pure, bounded progress helpers shared by the scroll-driven cinematic director. */
export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Progress while a tall section's inner frame is pinned to the viewport. */
export function pinnedProgress(
  sectionTop: number,
  sectionHeight: number,
  viewportHeight: number,
): number {
  if (![sectionTop, sectionHeight, viewportHeight].every(Number.isFinite)) return 0;
  return clampUnit(-sectionTop / Math.max(1, sectionHeight - viewportHeight));
}

/** Maps a chapter interval to the normalized 0–1 range. */
export function segmentProgress(
  progress: number,
  start: number,
  end: number,
): number {
  if (![progress, start, end].every(Number.isFinite)) return 0;
  if (end <= start) return progress >= end ? 1 : 0;
  return clampUnit((progress - start) / (end - start));
}

/** Ease in/out without introducing non-deterministic spring or ticker state. */
export function smoothStep(progress: number): number {
  const value = clampUnit(progress);
  return value * value * (3 - 2 * value);
}

/** A bounded 0–1 cursor position inside a measured rectangle. */
export function normalizedPointer(position: number, start: number, extent: number): number {
  if (![position, start, extent].every(Number.isFinite) || extent <= 0) return 0.5;
  return clampUnit((position - start) / extent);
}

/** Signed -1 to 1 for parallax, centered when there is no valid pointer. */
export function signedPointer(position: number, start: number, extent: number): number {
  return normalizedPointer(position, start, extent) * 2 - 1;
}
