import test from "node:test";
import assert from "node:assert/strict";
import { hardenPublicResponse } from "../src/lib/public-response-security.ts";

function hardened(url, method = "GET", headers = {}) {
  return hardenPublicResponse(
    new Request(url, { method }),
    new Response("ok", { status: 200, headers }),
  );
}

test("all public responses receive conservative browser security headers", () => {
  const response = hardened("https://quarry.example/");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
  assert.match(response.headers.get("permissions-policy") ?? "", /camera=\(\)/);
  assert.match(response.headers.get("permissions-policy") ?? "", /geolocation=\(\)/);
  assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000; includeSubDomains");
});

test("contact and assistant POST responses are never cacheable", () => {
  for (const path of ["/api/public/ask", "/_server/inquiry"]) {
    const response = hardened("https://quarry.example" + path, "POST", { "Cache-Control": "public, max-age=3600" });
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("pragma"), "no-cache");
  }
});

test("public API GET is no-store while ordinary page GET preserves framework cache policy", () => {
  const api = hardened("https://quarry.example/api/public/status", "GET", { "Cache-Control": "public, max-age=60" });
  assert.equal(api.headers.get("cache-control"), "no-store");

  const page = hardened("https://quarry.example/", "GET", { "Cache-Control": "public, max-age=60" });
  assert.equal(page.headers.get("cache-control"), "public, max-age=60");
});

test("HSTS is never emitted on local or other plain HTTP development requests", () => {
  const response = hardened("http://127.0.0.1:4173/", "GET");
  assert.equal(response.headers.get("strict-transport-security"), null);
});

test("existing content type, status and response body survive hardening", async () => {
  const original = new Response("private-safe-body", {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": "12" },
  });
  const response = hardenPublicResponse(new Request("https://quarry.example/api/public/ask", { method: "POST" }), original);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("content-type"), "application/json");
  assert.equal(response.headers.get("retry-after"), "12");
  assert.equal(await response.text(), "private-safe-body");
});
