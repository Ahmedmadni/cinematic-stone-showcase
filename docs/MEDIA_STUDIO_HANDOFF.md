# Media studio implementation — 9 October 2026

## Implemented locally

- `/admin` displays 116 built-in assets without requiring a cloud connection: 77 actual photographs, 6 videos, 6 posters, 6 document scans, 1 logo, 3 managed engineering motifs and 17 separately labelled legacy editorial images. Thumbnails map to the same canonical asset as the full photograph.
- Search by ID, Arabic/English description, or original filename. Original photograph SHA-256 provenance is shown in the editor.
- Global or component-specific replacement, bilingual alternative text/video descriptions, contain/cover and focal positioning. Missing replacements fall back to bundled assets. Legacy editorial assets cannot replace actual-site assets.
- Admin-only upload with a 50 MiB/type limit, checked database insertion and compensating storage cleanup. Upload organization supports title, order, section and checked deletion; referenced uploads require clearing their saved overrides before deletion.
- Private storage, refreshed signed URLs, public read of registered site media only and admin-only changes through a private, caller-bound authorization function. No new automatic administrator assignment.
- Updated quarry operating facts in Arabic/English and the assistant knowledge. Historical permit status remains distinct from owner-provided operating/ownership information.
- Ten real hero photographs and real equipment photographs replace the previous synthetic equipment scenes. The map's image now uses a real aerial photograph with explicit non-survey annotation caveats.
- Production line 1 is the blue smaller assembly (`photo-033`); line 2 is the larger branching conveyor installation (`photo-025`). Product views use actual stockpiles, without asserting unverified grades, test results or quantities.
- Original source photographs and film remain unmodified. The uploaded 77 photograph hashes and full-video hash match the existing source manifests. Existing MP4 fast-start and VP9 WebM derivatives are retained, with lazy activation, reduced-motion support and on-demand full tour.
- Loading screen keeps a bounded skip path and now explains actual readiness work, with a shorter exit transition.

## Required before release

1. Apply `supabase/migrations/20261009010000_managed_media_library.sql` to the correct connected Supabase project after reviewing existing policies/roles. It was NOT applied remotely in this session.
2. Review existing administrator roles; the migration stops future first-signup/email-based grants but deliberately does not remove existing users' roles. Assign the owner by a verified `auth.users.id` through the secured owner console, never through public signup or user metadata.
3. Configure build-time `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` using the project's public credentials. Keep service-role/secret keys server-only. The current local workspace does not contain live credentials. Do not paste a secret into the browser.
4. Verify admin login and save/restore/upload/delete with the actual owner account in staging, plus signed URL refresh and RLS denial for anonymous/non-admin users. These live integrations could not be verified here.
5. Review each image in its target section after changes. Component-scoped overrides distinguish rendering contexts; galleries that reuse a single context share the override for that asset. Titles embedded in the presentation are not rewritten by alternative-text edits. No fabricated geographical identity is assigned to the three quarry photos.
6. Merge/deploy only after those checks. Nothing was pushed to GitHub or published to Lovable during this implementation session.

## Verification

- Existing 72 tests passed before final polish; seven new media tests cover MIME/size limits, override precedence, corrected quarry facts, catalog coverage, controlled decorative motifs and migration safeguards.
- TypeScript and production build passed during implementation; final results are recorded in the delivery note.
- Read-only browser QA verified the final local library with 116 entries, search by photo ID and original filename, the decorative category, editor preview, disabled unauthenticated saving, corrected quarry content and zero console errors/warnings. A connected authenticated pass remains required.
- A 390 × 844 browser viewport pass verified both the public site and `/admin`: no horizontal overflow was detected, the public hero retained its hierarchy, and the administration statistics and disconnected-state notice reflowed correctly.
- PostgreSQL execution/RLS integration and authenticated storage operations remain unverified until a connected staging environment is provided.

## Working directory relocation

The whole project and supplied originals remain in the existing C workspace. D is readable but not writable in this session. No source file was removed from C and no D relocation is claimed. Open a D-based folder as an authorized workspace before transferring the complete folder; verify hashes and Git status after copying, then delete the C copy only after that verification and with explicit authorization.

## References used for implementation

- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase auth state callbacks](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
