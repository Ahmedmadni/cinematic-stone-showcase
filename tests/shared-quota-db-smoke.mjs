/**
 * Ephemeral PostgreSQL integration QA. Runs only against a fresh CI container,
 * NEVER against the actual Supabase project or any investor contact data.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const uri = process.env.SOMMAN_TEST_DATABASE_URL;
let parsed;
try {
  parsed = new URL(uri ?? "");
} catch {
  throw new Error("Only a local ephemeral PostgreSQL instance is permitted");
}
if (!["postgres:", "postgresql:"].includes(parsed.protocol) ||
    !["localhost", "127.0.0.1"].includes(parsed.hostname) ||
    parsed.pathname !== "/somman_qa") {
  throw new Error("Only the local ephemeral somman_qa database is permitted");
}
const require = createRequire(import.meta.url);
const { Pool } = require("/tmp/somman-dbqa/node_modules/pg");
const pool = new Pool({ connectionString: uri, max: 12, connectionTimeoutMillis: 7000 });

function permitScope(scope) {
  return pool.query("SELECT allowed, retry_after_seconds FROM public.somman_try_public_action($1)", [scope]);
}

try {
  // CI's test DB has none of Supabase's roles yet; never do this on production.
  await pool.query("CREATE ROLE anon NOLOGIN");
  await pool.query("CREATE ROLE authenticated NOLOGIN");
  await pool.query("CREATE ROLE service_role NOLOGIN");

  const migration = await readFile(new URL(
    "../supabase/migrations/20261003143000_somman_global_public_quotas.sql",
    import.meta.url,
  ), "utf8");
  await pool.query(migration);
  console.log("[DB] quota migration applies to disposable PostgreSQL: PASS");

  const privileges = await pool.query(
    "SELECT " +
    "has_function_privilege('anon', 'public.somman_try_public_action(text)', 'EXECUTE') AS anon_function, " +
    "has_function_privilege('authenticated', 'public.somman_try_public_action(text)', 'EXECUTE') AS auth_function, " +
    "has_function_privilege('service_role', 'public.somman_try_public_action(text)', 'EXECUTE') AS server_function, " +
    "has_table_privilege('anon', 'public.somman_public_usage_windows', 'SELECT') AS anon_reads, " +
    "has_table_privilege('authenticated', 'public.somman_public_usage_windows', 'SELECT') AS auth_reads",
  );
  assert.deepEqual(privileges.rows[0], {
    anon_function: false,
    auth_function: false,
    server_function: true,
    anon_reads: false,
    auth_reads: false,
  });
  const rls = await pool.query(
    "SELECT relrowsecurity FROM pg_class " +
    "WHERE oid = 'public.somman_public_usage_windows'::regclass",
  );
  assert.equal(rls.rows[0]?.relrowsecurity, true);
  console.log("[DB] RLS and service-role-only execution: PASS");

  await assert.rejects(permitScope("not_a_public_action"), /Unsupported quota scope/);
  const pre = await pool.query("SELECT extract(epoch FROM clock_timestamp())::bigint AS epoch");
  const initialMinute = Math.floor(Number(pre.rows[0].epoch) / 60);
  const results = await Promise.all(Array.from({ length: 54 }, () => permitScope("assistant")));
  const post = await pool.query("SELECT extract(epoch FROM clock_timestamp())::bigint AS epoch");
  const finalMinute = Math.floor(Number(post.rows[0].epoch) / 60);
  const accepted = results.filter(r => r.rows[0]?.allowed === true).length;
  const denied = results.filter(r => r.rows[0]?.allowed === false).length;
  assert.equal(accepted + denied, 54);
  if (initialMinute === finalMinute) {
    assert.equal(accepted, 48);
    assert.equal(denied, 6);
  } else {
    // Fixed windows naturally admit more across a minute boundary.
    assert.ok(accepted >= 48 && accepted <= 54);
  }
  console.log("[DB] concurrent atomic 48/minute assistant admission: PASS");

  const leads = await Promise.all(Array.from({ length: 14 }, () => permitScope("inquiry")));
  assert.equal(leads.filter(r => r.rows[0]?.allowed === true).length, 12);
  assert.equal(leads.filter(r => r.rows[0]?.allowed === false).length, 2);
  assert.ok(leads.at(-1)?.rows[0]?.retry_after_seconds >= 1);
  console.log("[DB] separate 12/10-minute inquiry admission: PASS");

  const columns = await pool.query(
    "SELECT column_name FROM information_schema.columns " +
    "WHERE table_schema='public' AND table_name='somman_public_usage_windows' " +
    "ORDER BY ordinal_position",
  );
  assert.deepEqual(columns.rows.map(row => row.column_name), [
    "scope", "window_started_at", "request_count",
  ]);
  console.log("[DB] aggregate-only counters without personal data: PASS");
} finally {
  await pool.end();
}
