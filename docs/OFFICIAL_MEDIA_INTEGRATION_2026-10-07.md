# Official Al Somman media integration plan

**Prepared:** 2026-10-07

## Direction

The supplied real quarry photography becomes the primary visual evidence across
the site. The existing professional equipment imagery is intentionally retained
inside the Fleet experience and supplemented with real equipment photographs.
Most other illustrative quarry/production/facility imagery should be replaced.

## Supplied real-photo inventory

- 77 WebP site photographs
- 56 production/crushing/conveyor photographs
- 8 equipment photographs, including 2 mobile-equipment views
- 11 facilities/infrastructure photographs
- 2 raw-quarry photographs

The separate supplied archive also contains licence/certificate images and a
transparent logo. Those documents must remain evidence content, not decorative
hero imagery.

## Primary hero candidates

1. `DJI_0146.webp` — wide production/site overview
2. `DJI_0183.webp` — wide plant overview
3. `equipment/DJI_0166.webp` — real equipment lineup
4. `equipment/DJI_0168.webp` — real equipment lineup
5. `تكامل النفق والجدار الاستنادي مع خط الانتاج 2.webp` — tunnel/retaining-wall integration
6. `صورة للمحجر.webp` — raw quarry overview
7. `مدخل 2.webp` — site entrance/infrastructure
8. `موقع المحجر.webp` — raw quarry geometry

## Existing illustrative images to retain

Keep the current professional equipment assets in the Fleet section as
supporting visuals:

- `src/assets/excavators.jpg`
- `src/assets/loaders-maintenance.jpg`
- `src/assets/generators-weighbridge.jpg`
- `src/assets/equipment.jpg`

Real equipment photography should be added alongside these rather than replacing
all four.

## Replacement policy

- Hero: prefer real quarry/production photography and video.
- Production journey: replace illustrative photos with real crushing,
  screening, conveyor and loading imagery.
- Quarry transition: replace with real raw-quarry + real production imagery.
- Facilities/site gallery: replace illustrative facility photos entirely with
  real offices, workshop, housing, tanks, weighbridge and entrance photos.
- Fleet: retain the professional illustrative equipment imagery and add a real
  equipment gallery/secondary frame.
- Captions that currently say imagery is illustrative must be removed only when
  the displayed asset is verified real site photography.

## Loading strategy

Do not preload all 77 photographs. The cinematic loader should wait only for:

- the decoded first hero photograph,
- critical fonts and UI assets.

The hero prefetches only one next frame after readiness. The 77-photo archive
is closed initially and mounts thumbnails eight at a time after opt-in. Only
a selected full-size archive photograph loads into its lightbox.

Everything else should be section-aware lazy loaded. Galleries should pause
autoplay when not visible.

## Video integration

Completed by the verified video integration on 2026-10-08. The supplied
176.984-second 1080p VP9 recording has no audio. Five continuous scene cuts,
bilingual controls, an explicit full tour and a bounded critical-media loader
are documented in `OFFICIAL_VIDEO_INTEGRATION_2026-10-08.md`. Exact source and
derivative hashes are in `official-video-source-manifest.json`.
