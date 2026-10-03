/**
 * Pure adapter for the optional Supabase-backed, atomic public action quotas.
 * No user-identifying values are persisted, and no database credentials live here.
 *
 * Keep disabled until the reviewed SQL migration has been applied to the
 * *matching* Supabase project, then turn on SOMMAN_SHARED_QUOTA_ENABLED=true
 * as a server-only environment variable. When enabled, unavailable database
 * accounting fails CLOSED before any paid AI request or contact data insert.
 */
export type PublicActionScope = "assistant" | "inquiry";

export type QuotaDecision =
  | { allowed: true; mode: "local-only" | "shared" }
  | { allowed: false; reason: "limited"; retryAfterSeconds: number }
  | { allowed: false; reason: "unavailable"; retryAfterSeconds: number };

export type RpcReply = { data: unknown; error: unknown };

export async function checkSharedPublicQuota({
  enabled,
  invoke,
}: {
  enabled: boolean;
  invoke: () => Promise<RpcReply>;
}): Promise<QuotaDecision> {
  // Preserve current production behavior until the correct project's SQL
  // and environment setup are confirmed. This does NOT claim the shared
  // rate limit is active by default.
  if (!enabled) return { allowed: true, mode: "local-only" };

  try {
    const response = await invoke();
    if (response.error !== null && response.error !== undefined) {
      return { allowed: false, reason: "unavailable", retryAfterSeconds: 30 };
    }

    // RETURNS TABLE from PostgREST responds with a one-row array.
    const value: unknown =
      Array.isArray(response.data) && response.data.length === 1
        ? response.data[0]
        : null;
    if (!value || typeof value !== "object" ||
        !("allowed" in value) || !("retry_after_seconds" in value)) {
      return { allowed: false, reason: "unavailable", retryAfterSeconds: 30 };
    }

    const record = value as Record<string, unknown>;
    if (typeof record["allowed"] !== "boolean" ||
        !Number.isSafeInteger(record["retry_after_seconds"]) ||
        (record["retry_after_seconds"] as number) < 0 ||
        (record["retry_after_seconds"] as number) > 600) {
      return { allowed: false, reason: "unavailable", retryAfterSeconds: 30 };
    }

    return record["allowed"]
      ? { allowed: true, mode: "shared" }
      : { allowed: false, reason: "limited", retryAfterSeconds: Math.max(1, record["retry_after_seconds"] as number) };
  } catch {
    // Never leak PostgREST or customer information through the response.
    return { allowed: false, reason: "unavailable", retryAfterSeconds: 30 };
  }
}
