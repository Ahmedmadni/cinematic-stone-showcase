import test from "node:test";
import assert from "node:assert/strict";
import { gallerySwipeStep } from "../src/lib/gallery-gestures.ts";

test("horizontal swipes follow English gallery direction", () => {
  assert.equal(gallerySwipeStep(-140, 9, "ltr"), 1, "swiping left advances");
  assert.equal(gallerySwipeStep(140, -9, "ltr"), -1, "swiping right returns");
});

test("RTL swipe direction mirrors English without flipping photos", () => {
  assert.equal(gallerySwipeStep(140, 10, "rtl"), 1, "swiping right advances in Arabic");
  assert.equal(gallerySwipeStep(-140, -10, "rtl"), -1);
});

test("vertical scroll, short taps and diagonal gestures do not hijack page", () => {
  assert.equal(gallerySwipeStep(14, 160, "ltr"), 0);
  assert.equal(gallerySwipeStep(-41, 3, "ltr"), 0);
  assert.equal(gallerySwipeStep(-110, 90, "ltr"), 0);
  assert.equal(gallerySwipeStep(0, 0, "rtl"), 0);
});

test("broken or nonfinite touches never change slides", () => {
  assert.equal(gallerySwipeStep(Number.NaN, 40, "ltr"), 0);
  assert.equal(gallerySwipeStep(100, Number.POSITIVE_INFINITY, "rtl"), 0);
  assert.equal(gallerySwipeStep(120, 4, "ltr", 0), 0);
});
