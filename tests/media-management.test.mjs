import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateMediaFile, selectMediaOverride } from "../src/lib/media-rules.ts";
import { quarrySites } from "../src/data/experience-data.ts";

test("upload validation accepts web formats and exactly 50 MiB", () => {
  for (const type of ["image/webp", "image/jpeg", "image/png", "video/mp4", "video/webm"])
    assert.equal(validateMediaFile({ type, size: 52428800 }), null);
});
test("upload validation rejects oversized, empty, nonfinite and unsafe formats", () => {
  for (const size of [0, -1, 52428801, Infinity, NaN])
    assert.ok(validateMediaFile({ type: "image/webp", size }));
  for (const type of [
    "image/svg+xml",
    "text/html",
    "video/quicktime",
    "application/octet-stream",
    "",
  ])
    assert.ok(validateMediaFile({ type, size: 10 }));
});
test("per-location replacement overrides global and never leaks to other photos", () => {
  const global = { target_key: "*:photo-033" };
  const local = { target_key: "ProductionLines:photo-033" };
  assert.equal(selectMediaOverride([global, local], "ProductionLines", "photo-033"), local);
  assert.equal(selectMediaOverride([global, local], "HeroGallery", "photo-033"), global);
  assert.equal(selectMediaOverride([global, local], "HeroGallery", "photo-032"), undefined);
});
test("owner corrections preserve historical permit caveats", () => {
  assert.match(quarrySites[0].operationEn, /houses the crushing plant/);
  assert.match(quarrySites[1].operationEn, /60% utilization/);
  assert.match(quarrySites[2].operationEn, /unexploited.*subsidiary.*wholly owned/);
  assert.ok(quarrySites.every((q) => q.documentStatus && q.license));
});
test("media migration removes automatic admin grants and restricts mutations", () => {
  const sql = readFileSync(
    new URL("../supabase/migrations/20261009010000_managed_media_library.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /drop trigger if exists on_auth_user_created_assign_admin/);
  assert.match(sql, /alter table public.media_overrides enable row level security/);
  assert.match(sql, /create or replace function private\.is_admin\(\)/);
  assert.match(
    sql,
    /for all to authenticated[\s\S]*with check\(\(select private\.is_admin\(\)\)\)/,
  );
  assert.match(sql, /Anyone can read registered site media files/);
  assert.match(sql, /Admins can read pending site media files/);
  assert.doesNotMatch(sql, /grant execute on function public\.has_role/);
  assert.doesNotMatch(sql, /with check\(public\.has_role|using\(public\.has_role/);
  assert.match(sql, /52428800/);
  assert.doesNotMatch(sql, /insert into public.user_roles|new\.email/);
});
test("all supplied photos and six videos are catalogued from canonical sources", () => {
  const catalog = readFileSync(new URL("../src/data/media-catalog.ts", import.meta.url), "utf8");
  assert.match(catalog, /\.\.\.sitePhotoLibrary.map/);
  assert.match(catalog, /Object.values\(officialVideo\).map/);
  const hero = readFileSync(
    new URL("../src/components/cinematic/HeroGallery.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(hero, /@\/assets\/(excavators|loaders|equipment|generators)/);
});
test("decorative motifs are managed and old editorial raster backdrops are not rendered", () => {
  const catalog = readFileSync(new URL("../src/data/media-catalog.ts", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/styles/editorial-rebuild.css", import.meta.url), "utf8");
  assert.match(catalog, /decorative-limestone-strata/);
  assert.match(catalog, /decorative-crusher-flow/);
  assert.match(catalog, /decorative-quarry-contours/);
  assert.match(css, /var\(--motif-limestone\)/);
  assert.doesNotMatch(css, /quarry-aerial(?:-alt)?\.jpg/);
});
