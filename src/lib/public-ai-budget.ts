/**
 * Small, per-process cost guard for the PUBLIC, metered quarry assistant.
 *
 * This protects a single application worker against bursts and stranded
 * upstream streams. It is NOT an IP-based or distributed rate limit: a CDN /
 * shared datastore limit is still required before a larger public launch.
 * Never trust client-supplied X-Forwarded-For headers for spending controls.
 */
export type Admission =
  | { allowed: true; release: () => void }
  | { allowed: false; retryAfterSeconds: number };

type Clock = () => number;

export function createPublicAiBudget({
  maxPerMinute = 24,
  maxConcurrent = 3,
  now = Date.now,
}: { maxPerMinute?: number; maxConcurrent?: number; now?: Clock } = {}) {
  if (!Number.isSafeInteger(maxPerMinute) || maxPerMinute < 1 ||
      !Number.isSafeInteger(maxConcurrent) || maxConcurrent < 1) {
    throw new Error("AI spending limits must be positive integers");
  }
  const acceptedAt: number[] = [];
  let active = 0;
  const WINDOW_MS = 60_000;

  function acquire(): Admission {
    const time = now();
    while (acceptedAt.length > 0 && (acceptedAt[0] ?? Number.POSITIVE_INFINITY) <= time - WINDOW_MS) {
      acceptedAt.shift();
    }
    if (active >= maxConcurrent) {
      return { allowed: false, retryAfterSeconds: 5 };
    }
    if (acceptedAt.length >= maxPerMinute) {
      const first = acceptedAt[0] ?? time;
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((first + WINDOW_MS - time) / 1000)) };
    }

    acceptedAt.push(time);
    active++;
    let released = false;
    return {
      allowed: true,
      release() {
        if (released) return;
        released = true;
        active = Math.max(0, active - 1);
      },
    };
  }

  // Diagnostics omit questions, browser IDs, IPs, emails, and contact details.
  function counts() { return { requestsInWindow: acceptedAt.length, active }; }
  return { acquire, counts };
}

/** Reject a huge JSON body before allocating an unbounded buffer. */
export async function readBoundedJson(request: Request, maxBytes = 24_576): Promise<unknown> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error("Invalid request byte limit");
  const declared = request.headers.get("content-length");
  if (declared && Number.isFinite(Number(declared)) && Number(declared) > maxBytes) {
    throw new Error("Request body too large");
  }
  if (!request.body) throw new Error("Empty request");
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let length = 0;
  let payload = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel("Request exceeds allowed size");
        throw new Error("Request body too large");
      }
      payload += decoder.decode(value, { stream: true });
    }
    payload += decoder.decode();
    return JSON.parse(payload);
  } finally {
    reader.releaseLock();
  }
}

/**
 * Backpressure-aware relay for AI text/event-stream. Counts bytes and always
 * releases the admission permit on EOF, failure, or client cancellation.
 */
export function relayAiStream(
  upstream: ReadableStream<Uint8Array>,
  release: () => void,
  maxOutputBytes = 131_072,
): ReadableStream<Uint8Array> {
  const reader = upstream.getReader();
  let bytes = 0;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    release();
  };
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          finish();
          controller.close();
          return;
        }
        bytes += value.byteLength;
        if (bytes > maxOutputBytes) {
          finish();
          await reader.cancel("AI response exceeded maximum output size").catch(() => {});
          controller.error(new Error("AI response exceeded safe size"));
          return;
        }
        controller.enqueue(value);
      } catch (error) {
        finish();
        controller.error(error);
      }
    },
    async cancel(reason) {
      finish();
      await reader.cancel(reason).catch(() => {});
    },
  });
}
