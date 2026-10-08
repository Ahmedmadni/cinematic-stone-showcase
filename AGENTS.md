<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the investment presentation as a single bilingual page at `/`, **English LTR by default** with a persistent Arabic RTL toggle. Preserve every section in one route, do not create separate language landing routes.
- Keep presentation imagery in `src/assets` and label generated images as supplementary editorial imagery. Verified supplied site photographs live under `src/assets/official`; keep their source hashes in the media manifest.
- Store investment inquiries through a validated public server function into a locked Cloud table; public visitors must never read submitted contact details.
- After saving a validated investment inquiry, offer visitor-initiated prefilled email to the fixed employee address or WhatsApp to the fixed company number; do not send automatic notices, so visitors review and send their own message.
- Keep each gallery subject's slide timer and visibility handling in its own GallerySlides instance; this isolates autoplay and pauses off-screen or for reduced motion.
- Keep main visual transitions in independent AutoVisual instances so each pauses off-screen and when the page is hidden or reduced motion is requested.
- Keep the hero as ten independently staged full-frame photographs led by actual-site imagery and supplemented by clearly labeled editorial equipment visuals with visibility-aware autoplay (pause on reduced motion or hidden tab); load only first image eagerly and prefetch one frame ahead, never stitch unrelated equipment into a false operation. Preserve passive scroll-driven Fleet/Material chapter masks and avoid scroll-jacking.
- Keep blueprint SVG motifs as decorative source assets behind light sections only; this preserves legibility and separates editorial art from real site evidence.

- Respect actual image readiness on the ten-photo hero: keep the prior valid image until the incoming image has finished loading, and fall back safely if the file is missing.
- Pause six subject galleries on real mouse hover, not synthesized touch hover; keep independent timers and reduced-motion/keyboard pauses.
- Keep headline motion isolated to the hero split title, gallery subject rotator and Q&A typing line, with bilingual labels, replay controls and reduced-motion static rendering; this keeps decorative animation out of factual content.
- Uploaded site media lives in a private storage bucket plus a public-read media table; only admins (role table, first signup or listed email) write, and sections prepend uploads to their built-in photos so the site never goes empty.
