# Verified site film and bounded entry

Continues the merged 77-photo release (PR #42) from main
`0daf0bf80634c3cdbcb69c7cd6a7336f470651fe`. Preserves the subsequent Lovable
admin/media changes and published history.

## Source and treatment

The supplied `فيديو كسارة الصمان Al-Summan Crusher Video(1).webm` was recovered
and inspected: 55,344,203 bytes, VP9, 1920 × 1080, 30 fps, 176.984 seconds,
with no audio stream. Its SHA-256 and every derivative/poster SHA-256 are in
`official-video-source-manifest.json`.

Continuous cuts preserve the filmed site and equipment geometry. Changes are
scaling, compression, frame-rate conversion and reversible CSS display grading.
The original supplied recording remains intact.

| Chapter | Source start | Length | Delivery |
| --- | ---: | ---: | --- |
| Hero: plant and conveyors | 40 s | 9 s | 1280 × 720, 24 fps |
| Production: processing lines | 64 s | 9 s | 1280 × 720, 24 fps |
| Fleet: site equipment | 136 s | 8 s | 1280 × 720, 24 fps |
| Facilities: staff buildings | 108 s | 9 s | 1280 × 720, 24 fps |
| Quarry: benches and mobile crusher | 167 s | 9 s | 1280 × 720, 24 fps |
| Full uncut tour | 0 s | approximately 177 s | 960 × 540, 24 fps |

Each film has VP9 WebM and H.264 MP4 sources; the browser selects a supported
format and downloads only that source. This addresses the decoder gap found in
the Chromium QA runtime. Each cut is bounded to 1.2 MiB per format and the
opt-in tour to 11.5 MiB per format. Posters remain under 200 KiB.

H.264 MP4 is offered first, consistent with Apple's
[Safari delivery guidance](https://developer.apple.com/documentation/webkit/delivering-video-content-for-safari);
engines without H.264 select the VP9 fallback. Metadata preparation and the
native autoplay flag are enabled only after the same visibility/entry/motion
guards that mount a film. Closing the tour restores focus to its explicit
trigger even on engines that do not focus a button on mouse click.

## Playback and entry

- The entry dialog waits for the first hero photograph's decode and document
  fonts only. Its progress reports those two actual milestones. It allows
  Enter/Escape, stops waiting after 4.5 seconds, and clears listeners/timers and
  scroll locking on exit or unmount. Videos start after entry.
- Section film sources mount on intersection, and pause offscreen or when the
  document is hidden. Reduced motion and data saver defer automatic video;
  explicit Play remains available. Each section owns its lifecycle.
- The ten-photo hero remains available with manual choice and swipe controls.
  Its timer pauses while the decoded film covers it. The photographic fallback
  persists until film decoding succeeds and survives a film failure.
- The full tour is opt-in: no video/source mounts before the visitor opens it.
  Native controls, Escape, close, keyboard focus restoration, bilingual copy
  and original no-audio disclosure remain available.
- Existing admin uploads take priority. Failed uploaded videos fall back to
  the verified built-in clip; failed uploaded images advance to that clip.
  Storage, database, roles and authentication are unchanged.

## Reproduction and release checks

Run `python scripts/prepare-official-video.py --source /path/to/source.webm`
with ffmpeg/ffprobe installed. Temporary outputs are renamed only after a
successful encode. Run the asset/hash/container budgets through
`npm run test:cinematic`, plus TypeScript, scoped ESLint and the production build.

`tests/video-browser-smoke.mjs` covers actual decoding, entry request boundaries,
all five cuts, offscreen/manual pauses, opt-in full-tour decoding, error
fallback, reduced motion and Arabic mobile fit. Chromium additionally checks
data saver, hidden-tab pause and held first-image timeout/Enter/Escape exits.
The workflow runs it alongside the existing interaction suite and in both
Firefox and WebKit release jobs.
