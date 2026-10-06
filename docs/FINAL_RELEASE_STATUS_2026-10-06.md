# Al Somman — Final Release Status

**Status date:** 2026-10-06  
**Repository:** `Ahmedmadni/cinematic-stone-showcase`  
**Production branch:** `main`  
**Validated application/test SHA:** `d4a5a5a0501b1ec409bd095afcc1b2da81acc5e3`  
**Lovable project:** Samman Quarry Vision  
**Published host:** `https://cinematic-stone-showcase.lovable.app`

## Current release state

The application code is feature-complete for the current approved scope and the
Lovable project is synchronized to the current `main` commit and reports
`ready` with no project error.

The temporary Lovable hostname is deliberately non-indexable. Final public
search metadata remains intentionally incomplete until the company approves the
production custom domain and social preview asset.

## Recent merged release work

- **#31** — calmer cinematic motion, accessibility/zoom QA, performance
  diagnostics, Google Maps opt-in loading, lightbox interaction improvements.
- **#33** — minimized public assistant request/output cost and removed unused
  history/reasoning payloads.
- **#34** — `X-Robots-Tag: noindex, nofollow` on temporary
  `*.lovable.app` hostnames.
- **#35** — privacy-safe server diagnostics and Lovable error telemetry.
- **#36** — fixed the final QA findings (ESLint regex + explicit lightbox focus
  trap) and reverted unintended files changed by the QA-only Lovable turn.
- **#37** — reduced GitHub Actions consumption using concurrency,
  lightweight PR coverage and full release coverage on `main`/manual runs.
- **#39** — corrected the conceptual-map hover-state browser assertion.
- **#40** — made the synthetic mobile performance profile realistic and
  resilient under CI throttling.

## Verified technical controls

### Public assistant

- Browser sends only current `question + language`.
- Question length remains capped at 500 characters.
- Request JSON is bounded to **4 KiB**.
- Paid upstream timeout remains **35 seconds**.
- SSE relay is bounded to **32 KiB**.
- Off-topic requests are rejected before paid AI use.
- Per-worker request/concurrency limits remain in place.
- Shared PostgreSQL public-action quotas were verified against the intended
  production database.
- Encrypted reasoning content and reasoning summaries are not requested.

### Investor inquiry

- Explicit consent is required by the browser and server validation.
- Direct client access to the inquiry table is denied.
- Production table RLS/client grants and privileged server access were
  previously verified.
- Shared inquiry quota and local burst control are implemented.
- Personal details are not intentionally written to quota/logging tables.

### Browser/privacy hardening

- Security response middleware applies CSP, HSTS on HTTPS, no-sniff,
  frame denial, referrer policy, permissions policy and COOP.
- Temporary Lovable hosts receive `X-Robots-Tag: noindex, nofollow`.
- Google Maps is **opt-in**: the iframe is not created until the visitor chooses
  to load it.
- Diagnostic redaction removes/avoids raw error messages, email/phone-like
  values, credential-like values and URL query/fragment data before telemetry.
- Reduced-motion fallbacks remain implemented across cinematic effects.

### Repository hygiene

- Runtime `.env` is not tracked; `.env.example` is the allowed template.
- Historical `.env` history contains one introduction and one removal only.
- The historical file was audited privately by key/value class without exposing
  values: six Supabase project/publishable/browser configuration variables were
  present; no service-role variable, provider API key, private key block,
  GitHub token pattern or JWT-like secret was detected.
- CI contains repository hygiene checks for tracked runtime env files and
  private-key blocks.

## QA evidence

### Current full GitHub-hosted release matrix

After the repository was made public, GitHub-hosted Actions resumed normally.
Run `37428830664` on validated SHA
`d4a5a5a0501b1ec409bd095afcc1b2da81acc5e3` completed successfully:

- validate — **PASS**
- disposable PostgreSQL shared-quota integration — **PASS**
- Chromium visual/browser smoke — **PASS**
- Firefox cross-engine QA — **PASS**
- WebKit cross-engine QA — **PASS**
- throttled mobile performance diagnostic — **PASS**

The Chromium browser suite completed **29/29** read-only interaction checks.

Synthetic performance baseline from the same run:

- viewport: 390×844
- CPU throttle: 4×
- network: 100 ms latency, 800,000 B/s down, 400,000 B/s up
- LCP: **1,584 ms**
- CLS: **0**
- interaction timing candidate: **16 ms**
- long tasks: **3**, totaling **684 ms**
- 120 representative scroll-frame samples
- average frame time: **16.51 ms**
- p95 frame time: **16.7 ms**
- frames over 32 ms: **0**
- frames over 50 ms: **0**

These are CI trend diagnostics, not a substitute for a physical-device
performance measurement.

### Independent Lovable QA

An earlier QA-only Lovable pass reported:

- `bun run test:cinematic`: **PASS — 68/68**
- `bunx tsc --noEmit`: **PASS**
- `bun run build`: **PASS**

It found one ESLint regex issue and one lightbox focus-trap issue; both were
fixed in merged PR **#36** and are now covered by the successful current GitHub
release matrix.

### GitHub Actions usage model

The previous runner-assignment failures were caused by exhausting the account's
included private-repository Actions minutes while paid usage was blocked at a
zero-dollar budget. After this repository was made **public**, standard
GitHub-hosted runners resumed immediately without using that private-repository
minute allowance.

CI remains cost-conscious:

- superseded runs are cancelled automatically;
- docs/Markdown-only changes do not trigger the workflow;
- pull requests run validate + Chromium;
- `main`/manual runs add PostgreSQL + performance + Firefox + WebKit.

## Remaining launch gates — external or approval-dependent

These are intentionally **not** marked complete by code alone:

1. **Provider/CDN controls:** set an AI/provider spending ceiling and approved
   CDN/WAF anti-abuse controls for broad public traffic.
2. **Investor privacy operations:** approve retention period, access/deletion
   process, and decide whether a durable consent notice version/timestamp must
   be stored.
3. **Production domain:** approve the final HTTPS hostname, redirects,
   canonical URL, sitemap URL and indexing decision.
4. **Social preview:** approve a dedicated OpenGraph/Twitter image; illustrative
   quarry photography must not be presented as verified site photography.
5. **Edge verification:** confirm security headers and HSTS behavior on the
   actual production domain/CDN, including whether `includeSubDomains` is
   appropriate.
6. **Physical QA:** verify current release on Safari/Firefox/Chromium, real
   phone/tablet/desktop, 100%/200% zoom, reduced motion, focus trapping and
   throttled mobile performance.
7. **Due diligence content:** replace illustrative imagery with approved
   official quarry photographs and verify licences, holder/transfer rights and
   certification status from current documents.
8. **Financial disclosure:** obtain approval before publishing any additional
   financial data, valuation, revenue, return or pricing information.
9. **Repository governance:** no repository ruleset is currently configured;
   the connected integration cannot administer branch protection. Consider
   requiring pull requests/status checks on `main` through GitHub settings.

## Release sequence once approvals are available

1. Approve privacy retention/consent-record requirements and implement any
   resulting schema/policy change.
2. Replace/verify official photography, licence and certification evidence.
3. Approve the custom domain and social preview card.
4. Configure provider spend ceiling + CDN/WAF controls.
5. Validate live edge headers and complete physical browser/device QA.
6. Enable indexing only on the approved custom domain.
7. Publish the final release and archive the completed QA evidence.

