import test from "node:test";
import assert from "node:assert/strict";
import {
  redactDiagnosticText,
  describeDiagnosticError,
  safeTelemetryError,
} from "../src/lib/error-redaction.ts";

test("diagnostic text redacts contact data, credentials and URL private parts", () => {
  const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature";
  const input = [
    "email investor@example.com",
    "phone +966 50 123 4567",
    "api_key=super-private-key",
    "authorization: Bearer abc.def.ghi",
    "supabase sb_secret_veryprivate",
    "jwt " + jwt,
    "url https://example.com/failed?email=investor@example.com&token=abc#fragment",
  ].join(" | ");

  const safe = redactDiagnosticText(input);
  assert.doesNotMatch(safe, /investor@example\.com/i);
  assert.doesNotMatch(safe, /966\s*50\s*123/i);
  assert.doesNotMatch(safe, /super-private-key/);
  assert.doesNotMatch(safe, /sb_secret_veryprivate/);
  assert.doesNotMatch(safe, /abc\.def\.ghi/);
  assert.doesNotMatch(safe, /eyJhbGci/);
  assert.doesNotMatch(safe, /\?email=|#fragment/);
  assert.match(safe, /\[redacted-email\]/);
  assert.match(safe, /\[redacted-phone\]/);
  assert.match(safe, /https:\/\/example\.com\/failed/);
});

test("server diagnostic omits raw error messages and arbitrary non-Error causes", () => {
  const cause = new Error("customer Sara sara@example.com +966501234567");
  cause.stack = "Error: customer Sara sara@example.com +966501234567\n    at nested (https://example.com/app.js?token=hidden:4:2)";

  const error = new Error("lead Ahmed ahmed@example.com asked secret question", { cause });
  error.stack = "Error: lead Ahmed ahmed@example.com asked secret question\n    at handler (https://example.com/server.js?email=ahmed@example.com:9:3)";

  const safe = describeDiagnosticError(error);
  assert.match(safe, /^Error/);
  assert.match(safe, /caused by: Error/);
  assert.doesNotMatch(safe, /Ahmed|Sara|ahmed@example|sara@example|secret question|customer/);
  assert.doesNotMatch(safe, /\?email=|\?token=/);
  assert.match(safe, /https:\/\/example\.com\/server\.js/);

  const objectCause = new Error("generic", { cause: { name: "Investor Name", email: "private@example.com" } });
  const objectSafe = describeDiagnosticError(objectCause);
  assert.match(objectSafe, /caused by: non-Error \(object\)/);
  assert.doesNotMatch(objectSafe, /Investor Name|private@example/);
});

test("browser telemetry keeps only safe error type/status", () => {
  const raw = new Error("Investor investor@example.com +966501234567 confidential message");
  const safe = safeTelemetryError(raw);
  assert.equal(safe.message, "Error (message redacted)");
  assert.doesNotMatch(safe.message, /investor|966|confidential/i);

  const response = safeTelemetryError(new Response("private body", { status: 503 }));
  assert.equal(response.message, "Response 503");
});
