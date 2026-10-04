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
- HTTPS responses advertise one-year HSTS with subdomains.
- Error and 429/503 responses default to \`Cache-Control: no-store\`.

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
