# Official Al Somman media integration plan

**Prepared:** 2026-10-07

## Direction

The supplied real quarry photography becomes the primary visual evidence across
the site. The existing professional equipment imagery is intentionally retained
inside the Fleet experience and supplemented with real equipment photographs.
Most other illustrative quarry/production/facility imagery should be replaced.

## Supplied real-photo inventory

- 77 WebP site photographs
- 54 production/crushing/conveyor photographs
- 6 real equipment photographs
- 13 facilities/infrastructure photographs
- 2 raw-quarry photographs
- 2 mobile-equipment photographs

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

- hero poster / first hero video frame,
- first 2–3 hero photographs,
- critical fonts and UI assets.

Everything else should be section-aware lazy loaded. Galleries should pause
autoplay when not visible.

## Video integration

The supplied ~2:56 WebM should remain the full-tour source and be cut into short
silent section loops for hero, production, equipment, facilities and quarry
chapters. The full tour remains available as an explicit user-played experience.

## Color treatment

Use restrained documentary color grading only: neutral limestone whites,
controlled highlights, slightly deeper sky/contrast, natural equipment colors,
and no generative content replacement. Site geometry, equipment and documentary
details must remain truthful.
