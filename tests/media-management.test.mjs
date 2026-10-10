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
test("media workflow migration registers posters, ordering and admin-only audit history", () => {
  const sql = readFileSync(
    new URL("../supabase/migrations/20261010130000_media_workflow_controls.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /add column if not exists poster_path text/);
  assert.match(sql, /site_media_section_sort_order_idx/);
  assert.match(sql, /create table if not exists public\.media_audit_log/);
  assert.match(sql, /alter table public\.media_audit_log enable row level security/);
  assert.match(sql, /Admins read media audit log/);
  assert.match(sql, /security definer[\s\S]*set search_path = ''/);
  assert.match(sql, /media\.storage_path = name or media\.poster_path = name/);
  assert.doesNotMatch(
    sql,
    /grant (insert|update|delete|all) on public\.media_audit_log to authenticated/,
  );
});
test("upload pipeline creates WebP images and optional video posters", () => {
  const upload = readFileSync(new URL("../src/lib/media-upload.ts", import.meta.url), "utf8");
  const studio = readFileSync(
    new URL("../src/components/MediaStudio.tsx", import.meta.url),
    "utf8",
  );
  assert.match(upload, /image\/webp/);
  assert.match(upload, /MAX_IMAGE_EDGE = 2400/);
  assert.match(upload, /createVideoPoster/);
  assert.match(studio, /poster_path: posterPath/);
  assert.match(studio, /optimizeImageForUpload/);
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
test("generated concepts are restricted to equipment and public media stays uncluttered", () => {
  const catalog = readFileSync(new URL("../src/data/media-catalog.ts", import.meta.url), "utf8");
  assert.match(catalog, /equipmentEditorialFiles/);
  for (const excluded of [
    "quarry-aerial.jpg",
    "site-roads.jpg",
    "offices-workshop.jpg",
    "worker-housing-recreation.jpg",
  ])
    assert.doesNotMatch(
      catalog.match(/const equipmentEditorialFiles[\s\S]*?\]\);/)?.[0] ?? "",
      new RegExp(excluded.replace(".", "\\.")),
    );

  const publicSources = [
    "../src/components/cinematic/HeroGallery.tsx",
    "../src/components/GallerySlides.tsx",
    "../src/components/GalleryLightbox.tsx",
    "../src/components/SiteVideoLoop.tsx",
    "../src/components/cinematic/QuarryAtlas.tsx",
    "../src/routes/index.tsx",
  ]
    .map((url) => readFileSync(new URL(url, import.meta.url), "utf8"))
    .join("\n");
  assert.doesNotMatch(
    publicSources,
    /hero-gallery__toolbar|gallery-slide-controls|site-video__toggle|quarry-cards__autoplay-tools/,
  );
  assert.doesNotMatch(
    publicSources,
    /صور وفيديوهات فعلية|تصوير فعلي من موقع الصمان|ACTUAL SITE \+ CURATED EDITORIAL/,
  );
});
