/**
 * Classify deliberate one-finger horizontal gallery swipes without hijacking
 * vertical page scrolling or tapping a button/link.
 *
 * -1: previous slide; +1: next slide; 0: no navigation.
 * Language direction controls the navigation semantics, not the page scroll.
 */
export function gallerySwipeStep(
  dx: number,
  dy: number,
  direction: "ltr" | "rtl",
  threshold = 54,
): -1 | 0 | 1 {
  if (![dx, dy, threshold].every(Number.isFinite) || threshold <= 0) return 0;
  const horizontal = Math.abs(dx);
  if (horizontal < threshold || horizontal < Math.abs(dy) * 1.4) return 0;
  const leftToRight = dx > 0;
  if (direction === "rtl") return leftToRight ? 1 : -1;
  return leftToRight ? -1 : 1;
}

export function isInteractiveGalleryTarget(target: EventTarget | null): boolean {
  return target instanceof Element &&
    Boolean(target.closest("button, a, input, textarea, select, [contenteditable='true']"));
}
