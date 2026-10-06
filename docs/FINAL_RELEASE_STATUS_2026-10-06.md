# Al Somman — Final Release Status

**Status date:** 2026-10-06  
**Repository:** `Ahmedmadni/cinematic-stone-showcase`  
**Production branch:** `main`  
**Current main SHA:** `696a5c2bd78a97b05b3d59e037d9a4e96e9a3ed0`  
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
- **#37** — reduced private GitHub Actions consumption using concurrency,
  lightweight PR coverage and full release coverage on `main`/manual runs.

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

### Last fully executed GitHub-hosted release matrix

Before the current account/runner issue, GitHub Actions run
`37282308894` completed successfully with:

- validate
- disposable PostgreSQL quota integration
- Chromium visual interaction smoke
- Firefox cross-engine QA
- WebKit cross-engine QA

### Independent Lovable QA after the larger release merge

A QA-only Lovable pass on commit `b70896f...` reported:

- `bun run test:cinematic`: **PASS — 68/68**
- `bunx tsc --noEmit`: **PASS**
- `bun run build`: **PASS**
- ESLint: one `no-useless-escape` failure
- Chromium browser smoke: one lightbox Tab focus-trap failure

The two reported failures were fixed in merged PR **#36**. The source-level
changes are small and focused, but a fresh full post-fix GitHub runner execution
is still pending.

## Current GitHub Actions limitation

On the current private repository, workflow jobs are currently created but fail
**before runner assignment** with zero executed steps and no job log. This was
observed on PR and `main` runs even after the public GitHub Actions incident was
resolved.

The connected GitHub integration cannot read account billing/minute balances,
so the exact account-side cause cannot be certified here. The behavior is
consistent with an account-level Actions minutes/spending/runner entitlement
constraint rather than a test failure.

PR **#37** reduces future private-runner usage:

- superseded runs are cancelled automatically;
- docs/Markdown-only changes do not trigger the workflow;
- PRs run validate + Chromium;
- `main`/manual runs add PostgreSQL + performance + Firefox + WebKit.

## Remaining launch gates — external or approval-dependent

These are intentionally **not** marked complete by code alone:

1. **GitHub Actions account:** restore/confirm Actions minutes or spending and
   run the current full workflow once on the final `main`.
2. **Provider/CDN controls:** set an AI/provider spending ceiling and approved
   CDN/WAF anti-abuse controls for broad public traffic.
3. **Investor privacy operations:** approve retention period, access/deletion
   process, and decide whether a durable consent notice version/timestamp must
   be stored.
4. **Production domain:** approve the final HTTPS hostname, redirects,
   canonical URL, sitemap URL and indexing decision.
5. **Social preview:** approve a dedicated OpenGraph/Twitter image; illustrative
   quarry photography must not be presented as verified site photography.
6. **Edge verification:** confirm security headers and HSTS behavior on the
   actual production domain/CDN, including whether `includeSubDomains` is
   appropriate.
7. **Physical QA:** verify current release on Safari/Firefox/Chromium, real
   phone/tablet/desktop, 100%/200% zoom, reduced motion, focus trapping and
   throttled mobile performance.
8. **Due diligence content:** replace illustrative imagery with approved
   official quarry photographs and verify licences, holder/transfer rights and
   certification status from current documents.
9. **Financial disclosure:** obtain approval before publishing any additional
   financial data, valuation, revenue, return or pricing information.
10. **Repository governance:** repository rulesets for this private repository
    currently return an upgrade-required response from GitHub; branch-protection
    administration is not writable through the connected integration.

## Release sequence once approvals are available

1. Resolve GitHub Actions account/minute access and run the full current
   `Cinematic Quality` workflow.
2. Approve privacy retention/consent-record requirements and implement any
   resulting schema/policy change.
3. Replace/verify official photography, licence and certification evidence.
4. Approve the custom domain and social preview card.
5. Configure provider spend ceiling + CDN/WAF controls.
6. Validate live edge headers and complete physical browser/device QA.
7. Enable indexing only on the approved custom domain.
8. Publish the final release and archive the completed QA evidence.

