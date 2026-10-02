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

- Keep the investment presentation as a single Arabic RTL page at `/`, with all sections in one route; the user requested a cinematic one-page experience rather than multiple pages.
- Keep presentation imagery in `src/assets` and label generated images as illustrative; actual site and equipment photos have not been supplied.
- Store investment inquiries through a validated public server function into a locked Cloud table; public visitors must never read submitted contact details.
- After saving a validated investment inquiry, offer visitor-initiated prefilled email to the fixed employee address or WhatsApp to the fixed company number; do not send automatic notices, so visitors review and send their own message.
- Keep each gallery subject's slide timer and visibility handling in its own GallerySlides instance; this isolates autoplay and pauses off-screen or for reduced motion.
- Keep main visual transitions in independent AutoVisual instances so each pauses off-screen and when the page is hidden or reduced motion is requested.
- Keep the hero as ten independently staged illustrative full-frame photographs with visibility-aware autoplay (pause on reduced motion or hidden tab); load only first image eagerly and prefetch one frame ahead, never stitch unrelated equipment into a false operation. Preserve passive scroll-driven Fleet/Material chapter masks and avoid scroll-jacking.
- Keep blueprint SVG motifs as decorative source assets behind light sections only; this preserves legibility and separates editorial art from real site evidence.
