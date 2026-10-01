import test from "node:test";
import assert from "node:assert/strict";
import {
  fleetFacts,
  productionSteps,
  quarrySites,
  totalQuarryArea,
} from "../src/data/experience-data.ts";

test("three independently identified quarry areas sum to the stated total", () => {
  assert.equal(quarrySites.length, 3);
  assert.equal(totalQuarryArea, 743282);
  assert.equal(new Set(quarrySites.map((site) => site.id)).size, 3);
  assert.equal(new Set(quarrySites.map((site) => site.license)).size, 3);
});

test("licence holder and source status are never dropped or presented as live verification", () => {
  for (const site of quarrySites) {
    assert.ok(site.permitHolder.length > 4);
    assert.ok(site.documentStatus.includes("بحسب نسخة العرض"));
    assert.ok(site.note.length > 20);
    assert.ok(site.area > 0);
  }
  assert.equal(quarrySites.filter((site) => site.documentStatus.startsWith("منتهية")).length, 2);
  assert.equal(quarrySites.find((site) => site.id === "birzeit")?.permitHolder, "شركة بير زيت للخدمات البترولية");
});

test("equipment quantities reproduce documented source inventory", () => {
  const amounts = Object.fromEntries(fleetFacts.map((item) => [item.id, item.count]));
  assert.deepEqual(amounts, { excavators: 14, loaders: 6, weighbridges: 2, power: 3 });
  assert.equal(new Set(fleetFacts.map((item) => item.number)).size, fleetFacts.length);
});

test("production sequence is complete and non-overlapping", () => {
  assert.deepEqual(productionSteps.map((item) => item.number), ["01", "02", "03"]);
  assert.equal(new Set(productionSteps.map((item) => item.id)).size, 3);
  assert.ok(productionSteps.every((item) => item.title && item.detail && item.indicator));
});

test("public equipment and quarry summaries do not accidentally introduce financial valuations", () => {
  const text = JSON.stringify({ fleetFacts, quarrySites, productionSteps });
  assert.doesNotMatch(text, /23,?702,?791|9,?195,?278|9,?170,?000|[0-9]\s*ر\.س/);
});
