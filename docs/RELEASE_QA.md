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
- Firefox and WebKit run focused, read-only compatibility checks in separate Linux jobs; these complement Chromium but do not substitute for physical Safari/Android testing. See `docs/BROWSER_COMPATIBILITY_QA.md`.
- Tests do **not** submit investment inquiries, read private data or use
  actual company credentials.

## Additional launch gate — shared quotas and private investor data

- [x] Operator confirmed the configured Supabase project and executed the reviewed checks on the intended project only.
- [x] Aggregate-only shared quota migration applied and verified: anon/authenticated cannot execute the RPC or read the counter table, while service_role can.
- [x] Invalid quota scopes are rejected with PostgreSQL error 22023 as designed.
- [ ] Enable \`SOMMAN_SHARED_QUOTA_ENABLED=true\` server-side **only after**
      staging tests confirm assistant and inquiry flows. It defaults off.
- [ ] Set a provider spending ceiling and CDN/WAF anti-abuse controls.
- [x] Add explicitly unchecked investor data-use checkbox validated client/server, with bilingual rights contact.
- [ ] Approve retention, access and deletion practices for investor leads.
- [ ] Decide whether legal review requires storing a notice version and consent timestamp; the current table does not persist a consent receipt. See `docs/INVESTOR_CONTACT_PRIVACY.md`.
- [x] Current branch no longer tracks a runtime `.env`; only a placeholder
      `.env.example` is allowed, and CI rejects tracked runtime env files.
- [ ] Historical commits that contained `.env` still require a private credential
      review and rotation if any formerly committed value was sensitive. Removing
      the current working-tree file does not erase historical Git data.


## HTTP response hardening
- [x] All app responses set `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, a strict-origin referrer policy, same-origin opener isolation and a restrictive Permissions Policy for unused camera/microphone/geolocation/payment/USB capabilities.
- [x] POST and public API responses are `Cache-Control: no-store`; normal GET/static caching remains owned by the framework/platform.
- [x] HSTS is emitted only for HTTPS requests and is deliberately absent on local HTTP development.
- [ ] Add a production Content-Security-Policy only after inventorying TanStack-generated inline script/style requirements and the external font origins; do not deploy an untested CSP that can blank the investor presentation.
- [ ] Confirm these headers survive the actual CDN/hosting edge and that the chosen domain/subdomains are appropriate for the HSTS `includeSubDomains` directive before public launch.

## Search and keyboard release checks
- [x] English-first fallback metadata matches the default UI and company identity.
- [x] Public presentation is crawlable while `/api/` is excluded in `robots.txt`.
- [x] Bilingual, brand-aligned keyboard skip navigation targets the main content.
- [ ] Approve the final public HTTPS domain before emitting an absolute canonical,
      sitemap or social-share URL. See `docs/SEO_ACCESSIBILITY_RELEASE.md`.
- [ ] Approve a dedicated social preview image; do not present illustrative
      quarry artwork as verified site photography.

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
- [x] Runtime `.env` is removed from the current tree and repository hygiene CI
      prevents it from being reintroduced.
- [ ] Security reviewer: a file named `.env` exists in historical Git commits.
      **Do not print or share its contents.** Audit it privately for secrets;
      if any sensitive credential was ever committed, revoke/rotate it and perform
      coordinated history remediation as appropriate.
- [ ] Confirm the inquiry form saves only to the intended protected table with
      current production Row-Level Security using synthetic staging data; read-only
      browser CI intentionally never submits real investor personal information.

## Constraints
The build and automated tests cannot certify active permits, certificate
authenticity, cross-browser visual quality, actual 60fps scrolling or platform
credential security. Keep the deployment/publication decision separate from
merge approval. Project imagery currently remains illustrative.
