import test from "node:test";
import assert from "node:assert/strict";
import { createAssistantStreamParser } from "../src/lib/assistant-stream.ts";

const delta = text => "data: " + JSON.stringify({ type: "response.output_text.delta", delta: text }) + "\n\n";

test("SSE consumes deliberately broken network chunks and only emits complete payload", () => {
  const parser = createAssistantStreamParser();
  const event = delta("Al Somman quarry");
  assert.deepEqual(parser.push(event.slice(0, 8)), []);
  assert.deepEqual(parser.push(event.slice(8, 22)), []);
  assert.deepEqual(parser.push(event.slice(22)), [{ kind: "delta", text: "Al Somman quarry" }]);
  assert.deepEqual(parser.push("data: [DONE]\n\n"), [{ kind: "done" }]);
  assert.deepEqual(parser.finish(), []);
  assert.deepEqual(parser.push(delta("should not append")), []);
});

test("SSE supports CRLF, comments, unknown meta-events and Unicode text", () => {
  const parser = createAssistantStreamParser();
  const events = [
    ": ping\r\n\r\n",
    "event: message\r\n",
    "data: " + JSON.stringify({ type: "response.output_text.delta", delta: "المحجر: ثلاثة مواقع" }) + "\r\n\r\n",
    "event: response.completed\r\ndata: " + JSON.stringify({ type: "response.completed" }) + "\r\n\r\n",
  ];
  const emitted = events.flatMap(chunk => parser.push(chunk));
  assert.deepEqual(emitted, [
    { kind: "delta", text: "المحجر: ثلاثة مواقع" }, { kind: "done" },
  ]);
  assert.deepEqual(parser.finish(), []);
});

test("SSE supports multiline JSON data split across data lines", () => {
  const parser = createAssistantStreamParser();
  const e = [
    'data: {"type":"response.output_text.delta",',
    'data: "delta":"Two production lines"}',
    "",
    "",
  ].join("\n");
  assert.deepEqual(parser.push(e), [{ kind: "delta", text: "Two production lines" }]);
});

test("SSE recognizes response.failed and provider event:error without displaying details", () => {
  for (const stream of [
    'data: {"type":"response.failed","error":{"message":"PRIVATE UPSTREAM"}}\n\n',
    'event: error\ndata: {"error":{"message":"PRIVATE UPSTREAM"}}\n\n',
    'data: {"type":"response.incomplete","reason":"token_limit"}\n\n',
  ]) {
    const parser = createAssistantStreamParser();
    assert.deepEqual(parser.push(stream), [{ kind: "error" }]);
    assert.deepEqual(parser.finish(), [{ kind: "error" }]);
  }
});

test("SSE truncated stream is an error, never presented as a completed answer", () => {
  const parser = createAssistantStreamParser();
  assert.deepEqual(parser.push(delta("Partial...")), [{ kind: "delta", text: "Partial..." }]);
  assert.deepEqual(parser.finish(), [{ kind: "error" }]);
});

test("SSE accepts completed signal even if stream closes without a final newline", () => {
  const parser = createAssistantStreamParser();
  assert.deepEqual(parser.push('data: {"type":"response.output_text.delta","delta":"Hi"}\n\n'), [{ kind: "delta", text: "Hi" }]);
  assert.deepEqual(parser.push("data: [DONE]"), []);
  assert.deepEqual(parser.finish(), [{ kind: "done" }]);
});

test("SSE ignores malformed unrelated comments and never treats them as answer text", () => {
  const parser = createAssistantStreamParser();
  assert.deepEqual(parser.push("data: not-json\n\n: heartbeat\n\n"), []);
  assert.deepEqual(parser.push(delta("Documented facilities only")), [{ kind: "delta", text: "Documented facilities only" }]);
  assert.deepEqual(parser.push("data: [DONE]\n\n"), [{ kind: "done" }]);
});

test("SSE rejects unexpectedly huge undecoded lines", () => {
  const parser = createAssistantStreamParser();
  assert.deepEqual(parser.push("x".repeat(131_073)), [{ kind: "error" }]);
  assert.deepEqual(parser.finish(), [{ kind: "error" }]);
});
