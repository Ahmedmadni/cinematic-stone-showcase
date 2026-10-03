import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkSharedPublicQuota } from "../src/lib/shared-public-quota.ts";

test("disabled shared counter preserves existing per-worker admission without database calls", async () => {
  let calls = 0;
  const result = await checkSharedPublicQuota({
    enabled: false,
    invoke: async () => {
      calls++;
      throw new Error("unreachable");
    },
  });
  assert.deepEqual(result, { allowed: true, mode: "local-only" });
  assert.equal(calls, 0);
});

test("server RPC accepts exactly one valid service-role counter response", async () => {
  const accepted = await checkSharedPublicQuota({
    enabled: true,
    invoke: async () => ({ error: null, data: [{ allowed: true, retry_after_seconds: 0 }] }),
  });
  assert.deepEqual(accepted, { allowed: true, mode: "shared" });
});

test("shared usage limit yields a bounded, explicit retry-after for caller", async () => {
  const rejected = await checkSharedPublicQuota({
    enabled: true,
    invoke: async () => ({ error: null, data: [{ allowed: false, retry_after_seconds: 23 }] }),
  });
  assert.deepEqual(rejected, { allowed: false, reason: "limited", retryAfterSeconds: 23 });
});

test("malformed and multiply returned database records always fail closed", async () => {
  for (const data of [
    null, [], [{ allowed: "true", retry_after_seconds: 0 }],
    [{ allowed: true, retry_after_seconds: 9999 }],
    [{ allowed: true, retry_after_seconds: 1.5 }],
    [{ allowed: true, retry_after_seconds: 0 }, { allowed: false, retry_after_seconds: 5 }],
    { allowed: true, retry_after_seconds: 0 },
  ]) {
    const result = await checkSharedPublicQuota({
      enabled: true, invoke: async () => ({ data, error: null }),
    });
    assert.deepEqual(result, { allowed: false, reason: "unavailable", retryAfterSeconds: 30 });
  }
});

test("network and permission errors fail closed when shared counter is activated", async () => {
  for (const invoke of [
    async () => { throw new Error("Private DB connection error"); },
    async () => ({ data: null, error: { message: "permission denied" } }),
  ]) {
    const result = await checkSharedPublicQuota({ enabled: true, invoke });
    assert.deepEqual(result, { allowed: false, reason: "unavailable", retryAfterSeconds: 30 });
  }
});

test("checked-in migration is restrictive and does not collect visitor identities", () => {
  // Static preflight, NOT a claim that this SQL has been executed on a live DB.
  const sql = readFileSync(new URL(
    "../supabase/migrations/20261003143000_somman_global_public_quotas.sql",
    import.meta.url,
  ), "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.somman_public_usage_windows/i);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /REVOKE ALL ON TABLE .* FROM PUBLIC, anon, authenticated/i);
  assert.match(sql, /SECURITY DEFINER/i);
  assert.match(sql, /SET search_path = ''/i);
  assert.match(sql, /REVOKE ALL ON FUNCTION .* FROM PUBLIC, anon, authenticated/i);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION .* TO service_role/i);
  assert.match(sql, /ON CONFLICT\s*\(scope, window_started_at\)[\s\S]*?WHERE w\.request_count < v_limit/i);
  assert.match(sql, /WHEN 'assistant' THEN[\s\S]*?v_seconds := 60;[\s\S]*?v_limit := 48/i);
  assert.match(sql, /WHEN 'inquiry' THEN[\s\S]*?v_seconds := 600;[\s\S]*?v_limit := 12/i);
  const ddl = sql.split(/CREATE TABLE IF NOT EXISTS/i)[1]?.split(/\);/)[0] ?? "";
  assert.doesNotMatch(ddl, /\b(ip|email|contact|session|prompt|user_id)\b/i);
});
