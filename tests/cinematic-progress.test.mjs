import test from "node:test";
import assert from "node:assert/strict";
import { clampUnit, normalizedPointer, pinnedProgress, segmentProgress, signedPointer, smoothStep } from "../src/lib/cinematic-progress.ts";

test("clampUnit bounds and sanitizes non-finite progress", () => {
  assert.equal(clampUnit(-1), 0);
  assert.equal(clampUnit(2), 1);
  assert.equal(clampUnit(0.3), 0.3);
  assert.equal(clampUnit(NaN), 0);
  assert.equal(clampUnit(Infinity), 0);
});

test("pinnedProgress starts at entrance and completes after pinned travel", () => {
  assert.equal(pinnedProgress(0, 2000, 1000), 0);
  assert.equal(pinnedProgress(-500, 2000, 1000), 0.5);
  assert.equal(pinnedProgress(-1000, 2000, 1000), 1);
  assert.equal(pinnedProgress(200, 2000, 1000), 0);
  assert.equal(pinnedProgress(0, 500, 1000), 0);
});

test("segmentProgress maps each caption and portal handoff", () => {
  assert.equal(segmentProgress(0.1, 0.2, 0.8), 0);
  assert.ok(Math.abs(segmentProgress(0.5, 0.2, 0.8) - 0.5) < 1e-10);
  assert.equal(segmentProgress(0.9, 0.2, 0.8), 1);
  assert.equal(segmentProgress(0.9, 0.3, 0.3), 1);
});

test("smoothStep is stable at endpoints and midpoint", () => {
  assert.equal(smoothStep(-10), 0);
  assert.equal(smoothStep(0), 0);
  assert.equal(smoothStep(0.5), 0.5);
  assert.equal(smoothStep(1), 1);
  assert.equal(smoothStep(10), 1);
});

test("mouse positions remain bounded inside and outside viewport and scene rectangles", () => {
  assert.equal(normalizedPointer(50, 0, 100), 0.5);
  assert.equal(normalizedPointer(-99, 0, 100), 0);
  assert.equal(normalizedPointer(999, 0, 100), 1);
  assert.equal(normalizedPointer(180, 80, 200), 0.5);
  assert.equal(signedPointer(0, 0, 100), -1);
  assert.equal(signedPointer(50, 0, 100), 0);
  assert.equal(signedPointer(100, 0, 100), 1);
});

test("pointer math falls back to center for zero, negative, or invalid dimensions", () => {
  for (const invalid of [0, -10, NaN, Infinity]) {
    assert.equal(normalizedPointer(60, 10, invalid), 0.5);
    assert.equal(signedPointer(60, 10, invalid), 0);
  }
  assert.equal(normalizedPointer(NaN, 0, 100), 0.5);
  assert.equal(signedPointer(Infinity, 0, 100), 0);
  assert.equal(normalizedPointer(30, Infinity, 100), 0.5);
});
