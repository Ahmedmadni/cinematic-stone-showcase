import test from "node:test";
import assert from "node:assert/strict";
import {
  dmsToDecimal,
  documentedCornerCoordinates,
  googleMapsOpenUrl,
  googleSatelliteEmbedUrl,
  quarryReferenceCenter,
} from "../src/data/quarry-map.ts";

test("source licence corners from presentation page five convert to geographic decimal degrees", () => {
  assert.equal(documentedCornerCoordinates.length, 4);
  const latitudes = documentedCornerCoordinates.map((point) => dmsToDecimal(point.latitude));
  const longitudes = documentedCornerCoordinates.map((point) => dmsToDecimal(point.longitude));
  assert.ok(latitudes.every((value) => value >= 25.51 && value <= 25.52));
  assert.ok(longitudes.every((value) => value >= 48.35 && value <= 48.37));
  assert.ok(Math.abs(quarryReferenceCenter.latitude - 25.51529167) < 0.000001);
  assert.ok(Math.abs(quarryReferenceCenter.longitude - 48.36245833) < 0.000001);
});

test("map link and iframe both reference the same indicative coordinate", () => {
  const coord = quarryReferenceCenter.latitude.toFixed(6) + "%2C" + quarryReferenceCenter.longitude.toFixed(6);
  assert.ok(googleSatelliteEmbedUrl.startsWith("https://maps.google.com/maps?"));
  assert.ok(googleSatelliteEmbedUrl.includes("t=k"));
  assert.ok(googleSatelliteEmbedUrl.includes("output=embed"));
  assert.ok(googleSatelliteEmbedUrl.includes(coord));
  assert.ok(googleMapsOpenUrl.startsWith("https://www.google.com/maps/search/?api=1"));
  assert.ok(googleMapsOpenUrl.includes(coord));
  assert.doesNotMatch(googleSatelliteEmbedUrl, /25\.7623|47\.1236/);
});

test("DMS helper rejects malformed coordinates", () => {
  assert.throws(() => dmsToDecimal({ degrees: 25, minutes: 60, seconds: 0 }), /Invalid/);
  assert.throws(() => dmsToDecimal({ degrees: 25, minutes: 20, seconds: 60 }), /Invalid/);
  assert.throws(() => dmsToDecimal({ degrees: Number.NaN, minutes: 1, seconds: 2 }), /Invalid/);
  assert.equal(dmsToDecimal({ degrees: -25, minutes: 30, seconds: 0 }), -25.5);
});
