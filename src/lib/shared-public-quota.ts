/**
 * Pure adapter for the optional Supabase-backed, atomic public action quotas.
 * No user-identifying values are persisted, and no database credentials live here.
 *
 * The reviewed SQL migration and production RLS/RPC permissions have been
 * verified on the matching deployment database. Production therefore defaults
 * to shared quotas when the flag is omitted. Development remains local-only by
 * default; an explicit server-only true/false flag always overrides the default.
 * When enabled, unavailable database accounting fails CLOSED before any paid AI
 * request or contact data insert.
 */
export type PublicActionScope = "assistant" | "inquiry";

export type QuotaDecision =
  | { allowed: true; mode: "local-only" | "shared" }
  | { allowed: false; reason: "limited"; retryAfterSeconds: number }
  | { allowed: false; reason: "unavailable"; retryAfterSeconds: number };

export type RpcReply = { data: unknown; error: unknown };

export function resolveSharedQuotaEnabled(
  flag: string | undefined,
  nodeEnv: string | undefined,
): boolean {
  if (flag === "true") return true;
  if (flag === "false") return false;
  return nodeEnv === "production";
}

export async function checkSharedPublicQuota({
  enabled,
  invoke,
}: {
  enabled: boolean;
  invoke: () => Promise<RpcReply>;
}): Promise<QuotaDecision> {
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
