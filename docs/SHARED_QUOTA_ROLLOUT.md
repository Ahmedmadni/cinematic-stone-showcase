# AL SOMMAN — Deploy the optional shared quotas safely

## Why this is staged

The project is configured for Supabase project \`dihmrleqlocxokuxuiur\`
(\`supabase/config.toml\`). The currently connected Supabase integration does
**not** list that project among accessible projects. **No production SQL was
run and no personal investor information was accessed.** Do not use a
different available Supabase project.

The branch adds the migration and app integration, but the shared check is
**OFF BY DEFAULT** until the correct project has been verified and migrated.

## Behavior before activation (default)

\`SOMMAN_SHARED_QUOTA_ENABLED\` absent or not equal to \`true\`:
- AI assistant keeps the existing worker limit (24 per minute, 3 simultaneous
  live requests per worker), 24 KiB input cap, provider timeout and output cap.
- Investor interest form adds a local server-side limit of 6 attempts per
  minute and 2 concurrent writes per worker, plus its existing Zod schema,
  non-visible honeypot, and service-role-only insert / locked RLS table.
- All existing features continue without invoking a missing quota RPC.

**These in-process limits are not shared across autoscaled instances.**

## Database setup (must target the repo's verified project)

1. Verify that the deployment's \`SUPABASE_URL\` project ref equals the ref
   in \`supabase/config.toml\`. Never share the secret service key.
2. Apply only the reviewed migration
   \`supabase/migrations/20261003143000_somman_global_public_quotas.sql\`
   to that project through its authorized migration workflow.
3. Confirm that \`public.somman_try_public_action(text)\` exists and that
   \`anon\` and \`authenticated\` have **no EXECUTE** privilege, and the
   \`somman_public_usage_windows\` table has RLS enabled and no browser SELECT
   privileges. Do not query or export the \`investment_inquiries\` table.
4. Test the server RPC with a service-role-backed staging application.
   The RPC records only \`scope\`, \`window_started_at\` and \`request_count\`.
5. Set the **server-only** environment flag
   \`SOMMAN_SHARED_QUOTA_ENABLED=true\` in the matching staging deployment,
   test Arabic and English assistant questions, off-topic refusals and a
   representative successful inquiry with synthetic data. Only then activate
   on production. Never use \`VITE_SOMMAN_SHARED_QUOTA_ENABLED\`.
6. Verify the configured Lovable provider spending limit, hosted CDN/WAF
   controls and alerting independently.

The server calls \`public.somman_try_public_action\` through the service-role
Supabase client. With the flag on, network failures, missing migrations and
unexpected RPC responses fail **closed** as a generic temporary 503 error;
exhausted quotas return HTTP 429 for assistant questions.

## Shared limits

- Assistant: **48 admitted questions per 60-second UTC-aligned window**
  across the entire connected database.
- Investor interest form: **12 admitted submissions per 600-second fixed
  window**, shared by all app workers.
- PostgreSQL enforces increments atomically with \`INSERT ... ON CONFLICT
  DO UPDATE ... WHERE request_count < limit\`. Bounds are defined inside the
  SQL function; clients cannot ask for a larger limit.
- Counter retention: opportunistic removal of rows older than two days.
  This is an aggregate-only counter, not an access or identity log.

Limits protect total provider costs but are **global**, not per visitor.
A malicious visitor could exhaust them and temporarily prevent legitimate
users from submitting. Add CDN/WAF challenges and vendor billing limits
when promoting the site publicly.

## Tests and rollout boundary

CI performs unit tests of flag behavior and failure modes, a static permission
review, and a **disposable local PostgreSQL 17** integration test covering the
migration, service-role permissions and concurrent atomic quotas. This does not
prove the intended cloud project has been migrated or production secrets and
billing policies are configured correctly.

Rollback: turn \`SOMMAN_SHARED_QUOTA_ENABLED\` back off and redeploy if
necessary. The migration only creates a standalone aggregate table and
function; do not run any destructive rollback against live contact records.

Privacy and data governance: \`investment_inquiries\` includes investor
contact details. Retention duration, notice, access review, and deletion
workflow require company approval before public launch. This feature does not
infer identities from IPs or persist private questions.
