import test from "node:test";
import assert from "node:assert/strict";
import {
  publicSecurityHeadersForTest,
  withPublicSecurityHeaders,
} from "../src/lib/security-headers.ts";

test("public responses block clickjacking, plugin content and unused sensitive permissions", async () => {
  const response = withPublicSecurityHeaders(
    new Response("<!doctype html><title>Somman</title>", {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
    new Request("https://example.org/"),
  );

  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(response.headers.get("content-security-policy") ?? "", /object-src 'none'/);
  assert.match(response.headers.get("content-security-policy") ?? "", /form-action 'self'/);
  assert.match(response.headers.get("permissions-policy") ?? "", /camera=\(\)/);
  assert.match(response.headers.get("permissions-policy") ?? "", /microphone=\(\)/);
  assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
  assert.match(response.headers.get("strict-transport-security") ?? "", /max-age=31536000/);
  assert.equal(await response.text(), "<!doctype html><title>Somman</title>");
});

test("local HTTP development never advertises HSTS", () => {
  const response = withPublicSecurityHeaders(
    new Response("ok"),
    new Request("http://127.0.0.1:3000/"),
  );
  assert.equal(response.headers.has("strict-transport-security"), false);
});

test("error and quota responses are never implicitly cached", () => {
  for (const status of [400, 429, 500, 503]) {
    const response = withPublicSecurityHeaders(
      new Response("error", { status }),
      new Request("https://example.org/api/public/ask"),
    );
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});

test("application-owned cache policies remain intact", () => {
  const response = withPublicSecurityHeaders(
    new Response("gone", {
      status: 404,
      headers: { "cache-control": "private, max-age=0" },
    }),
    new Request("https://example.org/missing"),
  );
  assert.equal(response.headers.get("cache-control"), "private, max-age=0");
});

test("security defaults intentionally omit broad source restrictions that would break current integrations", () => {
  const headers = publicSecurityHeadersForTest();
  const csp = headers["Content-Security-Policy"];
  assert.doesNotMatch(csp, /\bdefault-src\b/);
  assert.doesNotMatch(csp, /\bscript-src\b/);
  assert.doesNotMatch(csp, /\bframe-src\b/);
});
