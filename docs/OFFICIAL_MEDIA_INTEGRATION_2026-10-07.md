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

The video has not yet been received in this photo delivery. Its provisional
~2:56 WebM specification must be verified from the actual file. It should remain the full-tour source and be cut into short
silent section loops for hero, production, equipment, facilities and quarry
chapters. The full tour remains available as an explicit user-played experience.

## Color treatment

Use restrained documentary color grading only: neutral limestone whites,
controlled highlights, slightly deeper sky/contrast, natural equipment colors,
and no generative content replacement. Site geometry, equipment and documentary
details must remain truthful.

## Implemented photo release

- Every one of the 77 source photographs is accessible through a filtered archive.
- Full web photographs total 11.01 MiB, down from 86.87 MiB of sources; thumbnails total 1.10 MiB.
- Twelve previously corrupt curated assets are replaced. Four actual photographs lead the ten-frame hero; retained editorial frames remain labeled supplementary.
- Production, quarry transitions and facilities use actual photography. Fleet combines supplied equipment photographs with the four retained editorial equipment assets.
- The supplied transparent logo is local. Three certificate scans and three permit scans open on demand; original scan files are copied without modification.
- ISO certificate identifiers are transcribed from the scans. Displaying documents does not establish present validity, surveillance completion or permit renewal. Historical permit status remains unchanged.
- `scripts/prepare-official-media.py` reproduces resize/encoding from the source directory. CSS applies restrained reversible display grading; document scans are not graded.
- Asset tests verify all 77 derivative hashes and delivery budgets. Browser checks cover opt-in batches, category filters, decode, document caveats and keyboard focus restoration.

Video integration and video-specific loading behavior follow once the video file is supplied.
