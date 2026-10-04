# Public response security headers

The server entry applies a conservative baseline to HTML, API responses and
fallback error pages:

- \`Content-Security-Policy: base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'\`
- \`X-Frame-Options: DENY\`
- \`X-Content-Type-Options: nosniff\`
- \`Referrer-Policy: strict-origin-when-cross-origin\`
- \`Permissions-Policy\` disables camera, microphone, geolocation, payment, USB
  and interest-cohort features that the presentation does not use.
- \`Cross-Origin-Opener-Policy: same-origin\`
- HTTPS responses advertise one-year HSTS for the current host only. `includeSubDomains` is intentionally omitted until every company subdomain is confirmed HTTPS.
- Error and 429/503 responses default to \`Cache-Control: no-store\`.

Lovable editor preview hosts under `*.lovable.app` are a deliberate exception to the public anti-frame rule: only `lovable.dev` / `*.lovable.dev` may frame those preview hosts, and the legacy `X-Frame-Options` header is omitted there because it cannot express that allowlist. Public/custom domains continue to use `frame-ancestors 'none'` plus `X-Frame-Options: DENY`.

This intentionally does **not** define broad \`default-src\`, \`script-src\`,
\`style-src\` or \`frame-src\` policies yet. TanStack Start/React streaming,
Google Fonts and the optional Google Maps iframe need a separately tested
nonce/source policy before enforcing a full CSP. A broad untested policy would
risk breaking the site.

Before production sign-off:
1. Confirm the deployment host serves HTTPS on the intended domain/subdomains.
2. Verify Google Maps, fonts, language switching, the specialist assistant and
   investor form on the published domain.
3. If a strict source CSP is introduced later, deploy it in report-only mode
   first, collect only non-sensitive violation telemetry, then add exact
   required origins/nonces before enforcement.
4. Never loosen \`frame-ancestors\` to support third-party embedding unless the
   company explicitly approves those origins.

## Third-party map privacy

The Google Maps iframe now starts **unloaded**. The conceptual local quarry
visual remains available immediately, but the browser does not create the
Google iframe until the visitor explicitly presses the load button. The normal
external "Open in Google Maps" link remains a separate visitor-initiated
navigation. Browser QA covers desktop and reduced-motion mobile opt-in.

This reduces passive third-party contact but is not a comprehensive cookie/
tracking consent system; Google Maps policies and any company privacy notice
still require operator/legal review.

