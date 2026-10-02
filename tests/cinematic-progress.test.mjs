import test from "node:test";
import assert from "node:assert/strict";
import { clampUnit, fleetLocalProgress, fleetSceneIndex, fleetSceneTarget, normalizedPointer, pinnedProgress, segmentProgress, signedPointer, smoothStep } from "../src/lib/cinematic-progress.ts";

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

test("scroll-driven fleet selects exactly four chapters including endpoints", () => {
  const values = [0, .125, .24999, .25, .375, .49999, .5, .625, .74999, .75, .875, .99999, 1];
  const expected = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3];
  assert.deepEqual(values.map((p) => fleetSceneIndex(p, 4)), expected);
  assert.equal(fleetSceneIndex(-999, 4), 0);
  assert.equal(fleetSceneIndex(999, 4), 3);
  assert.equal(fleetSceneIndex(Number.NaN, 4), 0);
  assert.equal(fleetSceneIndex(.5, 0), 0);
});

test("in-chapter scroll camera progress resets on boundaries", () => {
  for (let index = 0; index < 4; index++) {
    assert.equal(fleetLocalProgress(index / 4, 4), 0);
    assert.equal(fleetLocalProgress((index + .5) / 4, 4), .5);
  }
  assert.equal(fleetLocalProgress(1, 4), 1);
  assert.equal(fleetLocalProgress(-2, 4), 0);
  assert.equal(fleetLocalProgress(.3, 0), 0);
});

test("manual fleet buttons navigate to safe chapter midpoints", () => {
  assert.deepEqual([0, 1, 2, 3].map((i) => fleetSceneTarget(i, 4)), [.125, .375, .625, .875]);
  assert.equal(fleetSceneTarget(-10, 4), .125);
  assert.equal(fleetSceneTarget(44, 4), .875);
  assert.equal(fleetSceneTarget(2, 0), 0);
  assert.equal(fleetSceneTarget(Number.NaN, 4), 0);
});

test("material scroll milestones select three documentary chapters and bounded centers", () => {
  assert.deepEqual([0, .1, .3334, .65, .6667, .9999, 1].map(p => fleetSceneIndex(p, 3)), [0, 0, 1, 1, 2, 2, 2]);
  assert.ok(Math.abs(fleetLocalProgress(.5, 3) - .5) < 1e-10);
  assert.ok(Math.abs(fleetSceneTarget(1, 3) - .5) < 1e-10);
  assert.ok(Math.abs(fleetSceneTarget(2, 3) - (5/6)) < 1e-10);
});
