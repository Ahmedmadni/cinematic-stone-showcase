# Al Somman media readiness review — 2026-10-07

Repository: `Ahmedmadni/cinematic-stone-showcase`.
Reviewed main: `628736fcbad6b39c8ab6a3d2aa1ffc818f792f34`.
Reviewed PR #42 head: `4872ccf759668124e9d2b9640b44984935454718`.

## Original blocking finding (resolved by supplied-photo integration)

All twelve files under `src/assets/official/` in PR #42 contain only 16 bytes.
They have neither the RIFF/WEBP header nor a decodable image payload. The failed
hero readiness assertion in run `37583434891` is an asset corruption problem,
not evidence that the 6500 ms readiness timeout should be increased.

The twelve invalid binaries have now been replaced from the received archive.
All 77 supplied photographs have decodable web derivatives and source/derivative
SHA-256 hashes in `official-media-source-manifest.json`. The photo release also
contains the supplied transparent logo and six original document scans.
Integration must pass the browser and CI checks before merging PR #42.

## Foundation changes

- Recursively check raster containers under `src/assets/`, including future
  nested official-media folders. Reject truncated files and malformed WebP
  lengths/chunks, and verify JPEG/PNG/AVIF container signatures. This is a
  container integrity check; browser decode checks remain necessary.
- Start hero autoplay and next-frame prefetch only after the current image
  decodes successfully. An image failure never sets readiness to true.
- Keep the last decoded scene during slow downloads and rapid manual choices.
  Ignore decode completions from replaced image elements.
- Return to the last decoded visitor selection on a later image failure and
  pause playback. Keep manual recovery possible if the initial image fails.
- Exercise held requests, rapid choices, initial failure and later failure in
  the browser suite without relaxing readiness assertions.

## Next media work

1. Receive the original photo archive; inspect and map source filenames to the
   twelve curated destinations in PR #42. Replace every invalid binary.
2. Bring main foundation fixes into #42 with a regular merge; preserve history
   and the official media plan. Keep the four approved equipment images.
3. Validate full image decoding, origin labels, layout and budgets; merge #42
   only after green CI, then run the complete main release matrix.
4. Curate the remaining site photos. Use restrained documentary grading and
   lazy loading, without preloading all 77 files.
5. Receive and inspect the full video by frames; create section loops and
   an explicit user-played full tour. Build the loader around critical hero
   readiness with a bounded failure path, not the complete photo/video library.
6. Add supplied permit/certificate scans to the evidence UI while retaining
   historical-document and current-validity caveats.
7. Verify mobile, reduced motion, bilingual layouts and performance before
   publishing the media release.

Video specifications and photo-category counts in the handoff are provisional
until the newly supplied files are inspected. No production database changes
are part of this foundation repair.
