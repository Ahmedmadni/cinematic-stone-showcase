# Al Somman Quarry — Investor Presentation

Single-page bilingual investor presentation for Al Somman Quarry, built as a cinematic web experience rather than a conventional multi-page website.

## Product scope

- English-first interface with persistent Arabic support.
- Cinematic hero, galleries and scroll-driven presentation.
- Quarry project facts are separated from illustrative imagery.
- Public project assistant is restricted to approved project information.
- Investor inquiry flow includes explicit bilingual data-use consent.
- Public AI/inquiry quotas, response hardening and read-only browser QA are covered by automated checks.

## Local development

Requirements:

- Node.js 22+
- Bun

```sh
git clone https://github.com/Ahmedmadni/cinematic-stone-showcase.git
cd cinematic-stone-showcase
cp .env.example .env
bun install --frozen-lockfile
bun run dev
```

Provide only the required public Supabase browser values in local `.env`. Server-only credentials, provider keys and service-role secrets must be configured through the hosting platform and must never be committed or exposed with a `VITE_` prefix.

## Verification

```sh
bun run test:cinematic
bunx tsc --noEmit
bun run lint
bun run build
```

GitHub Actions also runs Chromium, Firefox/WebKit compatibility checks and an isolated PostgreSQL integration test for shared quota behavior.

## Release documentation

Release and launch controls are documented under `docs/`, especially:

- `docs/RELEASE_QA.md`
- `docs/SEO_ACCESSIBILITY_RELEASE.md`
- `docs/INVESTOR_CONTACT_PRIVACY.md`
- `docs/SHARED_QUOTA_ROLLOUT.md`
- `docs/ASSISTANT_PUBLIC_SAFETY.md`

The production hostname, canonical URL, sitemap, social preview asset, final privacy-retention policy, production Supabase activation and official quarry imagery/document verification remain explicit launch decisions and must not be inferred from development/staging configuration.
