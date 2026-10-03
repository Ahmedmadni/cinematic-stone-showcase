import test from "node:test";
import assert from "node:assert/strict";
import { createQuarryStreamDecoder } from "../src/lib/quarry-stream-decoder.ts";

const delta = text => "data: " + JSON.stringify({ type:"response.output_text.delta", delta:text }) + "\n\n";

test("assistant decoder respects arbitrary SSE fragmentation and UTF-8 frame characters", () => {
  const parser = createQuarryStreamDecoder();
  const full = delta("Two crushing lines.") + delta(" معدات المحجر") + "data: [DONE]\n\n";
  const result = [];
  for (const char of full) result.push(...parser.push(char));
  assert.deepEqual(result, [
    {kind:"text", text:"Two crushing lines."},
    {kind:"text", text:" معدات المحجر"},
    {kind:"complete"},
  ]);
  assert.deepEqual(parser.finish(), []);
});

test("SSE supports CRLF, multi-line data, ignored metadata and keep-alive frames", () => {
  const parser = createQuarryStreamDecoder();
  assert.deepEqual(parser.push(": ping\r\nid: 4\r\n\r\n"), []);
  assert.deepEqual(parser.push('event: response.output_text.delta\r\ndata: {"type":"response.output_text.delta",\r\n'), []);
  assert.deepEqual(parser.push('data: "delta":"Al Somman Quarry"}\r\n\r'), []);
  assert.deepEqual(parser.push("\n"), [{kind:"text",text:"Al Somman Quarry"}]);
  assert.deepEqual(parser.push('data: {"type":"response.completed"}\r\n\r\n'), [{kind:"complete"}]);
  assert.deepEqual(parser.finish(), []);
});

test("AI gateway failure event is never rendered as successful answer", () => {
  const parser = createQuarryStreamDecoder();
  assert.deepEqual(parser.push('data: {"type":"response.failed"}\n\n'), [{kind:"error"}]);
  assert.deepEqual(parser.push(delta("ignore this")), []);
});

test("decoder exposes incomplete EOF rather than leaving an empty success response", () => {
  const parser = createQuarryStreamDecoder();
  assert.deepEqual(parser.push(delta("partial answer")), [{kind:"text",text:"partial answer"}]);
  assert.throws(() => parser.finish(), /before completion/);
});

test("malformed SSE JSON and oversized individual events are rejected safely", () => {
  const broken = createQuarryStreamDecoder();
  assert.throws(() => broken.push("data: {not json}\n\n"), /Malformed/);
  const huge = createQuarryStreamDecoder();
  assert.throws(() => huge.push("data: " + "x".repeat(33_000)), /Oversized/);
});

test("a malicious deluge of small answer deltas cannot grow chat indefinitely", () => {
  const parser = createQuarryStreamDecoder();
  for(let i=0;i<24;i++) assert.equal(parser.push(delta("x".repeat(999))).length,1);
  assert.throws(()=>parser.push(delta("x".repeat(1000))), /display limit/);
});

test("empty, heartbeat and unknown event types do not modify chat", () => {
  const parser=createQuarryStreamDecoder();
  assert.deepEqual(parser.push("\n:heartbeat\n\n" + 'data: {"type":"response.in_progress"}\n\n'),[]);
  assert.deepEqual(parser.push("data: [DONE]\n\n"),[{kind:"complete"}]);
});
