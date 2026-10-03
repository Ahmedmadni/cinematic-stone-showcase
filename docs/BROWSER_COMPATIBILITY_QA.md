# AL SOMMAN — Engine compatibility release checks

This pull request adds *automated* independent Firefox and WebKit browser checks
alongside the existing 25-scenario Chromium suite. Both engines are installed
with their native Linux dependencies into a temporary Playwright environment
in GitHub Actions, leaving the locked Bun application dependencies unchanged.

## Automated checks for each engine
- English-first document language/direction, title/description, six galleries,
  ten separate hero slides and icon-only floating utility buttons.
- RTL language switch, persisted Arabic preference after reload, and return
  to English without new pages.
- Manual selection of a separate hero photo, and fully disabled autoplay when
  the operating-system preference is "reduce motion".
- A real \`<dialog>\` lightbox with manual navigation and Escape dismissal.
- An unselected and reversible investor-consent checkbox. **No form is sent**.
- Floating specialist assistant can open/close without AI gateway requests.
- No uncaught hydration errors in the desktop experience.
- A 360px mobile viewport with no significant horizontal overflow, ten tappable
  hero markers and manual image selection.
- Engine-specific read-only screenshots and JSON summaries, retained for seven days.

## Boundaries and remaining release work
These are Linux runners running the **browser engines**, not a certification
on physical macOS Safari, iOS Safari or a real Android phone. Some operating-
system features, fonts, GPU/scroll performance and touch input differ from
production devices. Motion/screen reader/manual accessibility reviews remain.

Both engines run only against a local staging dev server. The tests do not
connect to real lead tables, do not verify current licences and do not show
unapproved site photographs as authentic evidence.

## Default-language metadata
Fallback/root route metadata is now English to match \`<html lang="en" dir="ltr">\`,
the user-requested initial language. Arabic stays accessible through the
persistent floating language control. A production absolute canonical domain
is deliberately not invented before the final public host name is approved.

## Sign-off
- [ ] Chromium, Firefox, WebKit jobs all green on same PR head
- [ ] Desktop/mobile screenshots reviewed manually
- [ ] Real-device Safari/Android checks
- [ ] Source imagery/permit claims reviewed by company
- [ ] Verified correct Supabase project and production data/privacy settings
