import test from "node:test";
import assert from "node:assert/strict";
import {
  createPublicAiBudget,
  readBoundedJson,
  relayAiStream,
} from "../src/lib/public-ai-budget.ts";

test("public AI budget limits simultaneous paid questions and release is idempotent", () => {
  let now = 10_000;
  const budget = createPublicAiBudget({ maxPerMinute: 4, maxConcurrent: 2, now: () => now });
  const first = budget.acquire();
  const second = budget.acquire();
  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  const third = budget.acquire();
  assert.deepEqual(third, { allowed: false, retryAfterSeconds: 5 });
  if (!first.allowed || !second.allowed) throw new Error("Unexpected quota rejection");
  first.release();
  first.release();
  assert.equal(budget.counts().active, 1);
  const fourth = budget.acquire();
  assert.equal(fourth.allowed, true);
  second.release();
  if (fourth.allowed) fourth.release();
  assert.equal(budget.counts().active, 0);
  now += 100;
  assert.equal(budget.acquire().allowed, true);
  assert.deepEqual(budget.acquire(), { allowed: false, retryAfterSeconds: 60 });
  now += 60_001;
  assert.equal(budget.acquire().allowed, true);
});

test("public AI budget rejects invalid or zero spending limits", () => {
  assert.throws(() => createPublicAiBudget({ maxPerMinute: 0 }));
  assert.throws(() => createPublicAiBudget({ maxConcurrent: Number.NaN }));
});

test("bounded JSON accepts small legitimate bilingual question", async () => {
  const request = new Request("https://example.org/api/public/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "Al Somman quarry equipment?", language: "en" }),
  });
  assert.deepEqual(await readBoundedJson(request, 1024), {
    question: "Al Somman quarry equipment?",
    language: "en",
  });
});

test("bounded JSON prevents oversized allocations even with a lying content-length", async () => {
  const tooLong = new Request("https://example.org/api/public/ask", {
    method: "POST",
    body: JSON.stringify({ question: "x".repeat(2048) }),
  });
  await assert.rejects(readBoundedJson(tooLong, 512), /too large/);
  const declared = new Request("https://example.org/api/public/ask", {
    method: "POST",
    headers: { "Content-Length": "10000000" },
    body: JSON.stringify({ question: "quarry" }),
  });
  await assert.rejects(readBoundedJson(declared, 512), /too large/);
});

test("streaming relay forwards provider bytes and releases paid slot on EOF", async () => {
  const encoder = new TextEncoder();
  let releases = 0;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("data: first\n\n"));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  const reader = relayAiStream(stream, () => releases++).getReader();
  let text = "";
  const decoder = new TextDecoder();
  for (;;) {
    const part = await reader.read();
    if (part.done) break;
    text += decoder.decode(part.value);
  }
  assert.match(text, /first/);
  assert.match(text, /\[DONE\]/);
  assert.equal(releases, 1);
});

test("cancelling a slow streaming response frees active AI budget", async () => {
  let releases = 0;
  const slow = new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array([65])); },
    cancel() {},
  });
  const reader = relayAiStream(slow, () => releases++).getReader();
  assert.equal((await reader.read()).done, false);
  await reader.cancel("client disconnected");
  assert.equal(releases, 1);
});

test("overlong upstream output is terminated before exceeding safe response size", async () => {
  let releases = 0;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(30));
      controller.close();
    },
  });
  const reader = relayAiStream(stream, () => releases++, 16).getReader();
  await assert.rejects(reader.read(), /safe size/);
  assert.equal(releases, 1);
});
