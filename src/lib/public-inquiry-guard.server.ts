import { createPublicAiBudget } from "@/lib/public-ai-budget";
import { consumeSharedPublicQuota } from "@/lib/shared-public-quota.server";

// Intake is much lower volume than the public AI chat. This is a burst bound
// per worker, NOT an identity/IP-based abuse solution; the optional SQL quota
// additionally protects across multiple application instances.
const intakeBudget = createPublicAiBudget({ maxPerMinute: 6, maxConcurrent: 2 });

/**
 * Acquire admission BEFORE inserting contact details with service-role access.
 * The returned idempotent release must run in a finally block. Neither the
 * quota system nor error logs keep names, emails, messages or IP addresses.
 */
export async function acquirePublicInquiryPermit(): Promise<() => void> {
  const local = intakeBudget.acquire();
  if (!local.allowed) {
    throw new Error("The form is receiving too many requests. Please try again shortly.");
  }

  try {
    const shared = await consumeSharedPublicQuota("inquiry");
    if (!shared.allowed) {
      throw new Error(shared.reason === "limited"
        ? "The form is receiving too many requests. Please try again shortly."
        : "The contact form is temporarily unavailable. Please try again later.");
    }
    return local.release;
  } catch {
    local.release();
    // Do not reflect database permission/details or a contact submission body.
    throw new Error("The contact form is temporarily unavailable. Please try again later.");
  }
}
