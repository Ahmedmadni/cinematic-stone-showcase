/**
 * Browser-facing response hardening that is safe for the current TanStack app.
 *
 * We intentionally do not invent a Content-Security-Policy here: the rendered
 * app and external font loading must first be nonce/hash inventoried in the
 * deployed platform. A broken CSP is worse than a documented pending gate.
 */
export function hardenPublicResponse(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");

  // POST bodies may contain investor contact details or assistant questions.
  // Public API responses may also contain model text. Never let intermediaries
  // persist these. Static assets and normal GET pages retain framework caching.
  const url = new URL(request.url);
  if (request.method !== "GET" && request.method !== "HEAD") {
    headers.set("Cache-Control", "no-store");
    headers.set("Pragma", "no-cache");
  } else if (url.pathname.startsWith("/api/")) {
    headers.set("Cache-Control", "no-store");
  }

  // HSTS is meaningful only after HTTPS has actually terminated for this
  // request. Do not poison localhost/development over HTTP.
  if (url.protocol === "https:") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
