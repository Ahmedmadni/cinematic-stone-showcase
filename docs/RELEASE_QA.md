# AL SOMMAN — Final launch QA and sign-off

This document is a **verification checklist**, not evidence that all real-device
or production security checks have been completed.

## Automated gates (phase 05)
- Locked Bun dependency install, existing unit tests, TypeScript and scoped ESLint.
- 6 MiB collective / 512 KiB per-asset budget for illustrative raster imagery.
- A separate Chromium job boots this pull request's **localhost Vite app** and
  performs read-only checks for RTL, required sections, native scrolling,
  keyboard-accessible gallery, evidence navigation, reduced-motion fallback and
  mobile layout.
- Browser screenshots and a JSON test summary are retained as a GitHub Actions
  artifact for seven days.
- Tests do **not** submit investment inquiries, read private data or use
  actual company credentials.

## Additional launch gate — shared quotas and private investor data

- [ ] Verify the exact configured Supabase project is connected and authorized.
      Do not apply the checked-in global quota SQL to any other project.
- [ ] Apply/review the new aggregate-only SQL migration on that project.
- [ ] Enable \`SOMMAN_SHARED_QUOTA_ENABLED=true\` server-side **only after**
      staging tests confirm assistant and inquiry flows. It defaults off.
- [ ] Set a provider spending ceiling and CDN/WAF anti-abuse controls.
- [x] Add explicitly unchecked investor data-use checkbox validated client/server, with bilingual rights contact.
- [ ] Approve retention, access and deletion practices for investor leads.
- [ ] Decide whether legal review requires storing a notice version and consent timestamp; the current table does not persist a consent receipt. See `docs/INVESTOR_CONTACT_PRIVACY.md`.
- [ ] Tracked \`.env\` from historical commits requires a private credential
      review and rotation if sensitive. New \`.gitignore\` rules do not remove
      a file that is already tracked or erase historical Git data.


## Manual release review required
- [ ] Review hero typography, photo cropping and motion on Firefox, Safari and Chromium.
- [ ] Review 390px mobile, tablet and 1366px desktop at 100% and 200% zoom.
- [ ] Verify the native photo dialog focuses its close button, traps Tab,
      supports arrow navigation/Escape and returns focus to the gallery button.
- [ ] With reduced motion enabled, confirm no pinned transition or animated fog
      prevents navigation, and every section remains readable.
- [ ] Inspect production performance on a throttled mobile device, recording
      LCP, CLS, INP and a representative scroll frame trace.
- [ ] Review official quarry photographs and replace all clearly labelled
      illustrative placeholders before claiming they are site photography.
- [ ] Verify current licence status, holder, transfer rights and certification
      surveillance using original documents and the official issuing bodies.
- [ ] Obtain review approval before disclosing any further financial data,
      valuation or licensed document scan.
- [ ] Security reviewer: a file named .env is currently tracked in Git history.
      **Do not print or share its contents.** Audit it privately for secrets;
      if any are present, revoke and rotate them and remove the file from Git
      history through a coordinated credential-remediation procedure. Removing
      a current working-tree file alone does not erase leaked history.
- [ ] Confirm the inquiry form saves only to the intended protected table with
      current production Row-Level Security; there is no browser test that
      submits real investor personal information.

## Constraints
The build and automated tests cannot certify active permits, certificate
authenticity, cross-browser visual quality, actual 60fps scrolling or platform
credential security. Keep the deployment/publication decision separate from
merge approval. Project imagery currently remains illustrative.
