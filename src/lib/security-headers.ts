/**
 * Conservative response headers for the public Al Somman presentation.
 *
 * Intentionally avoids a broad default-src/script-src CSP because TanStack
 * Start/React streaming, Google Fonts and the opt-in Google Maps iframe need
 * a separately tested nonce/source policy. These directives still block
 * clickjacking, plugin/object content, cross-site form targets and several
 * unused browser capabilities without breaking the current experience.
 */
const COMMON_SECURITY_HEADERS = {
  "Content-Security-Policy": "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  "Cross-Origin-Opener-Policy": "same-origin",
} as const;

export function withPublicSecurityHeaders(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(COMMON_SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }

  const requestUrl = new URL(request.url);
  // Lovable's editor renders its isolated preview host inside a trusted
  // lovable.dev frame. Keep that workflow functional without making public
  ///custom domains frameable by arbitrary origins.
  if (requestUrl.hostname.endsWith(".lovable.app")) {
    headers.set(
      "Content-Security-Policy",
      "base-uri 'self'; object-src 'none'; frame-ancestors 'self' https://lovable.dev https://*.lovable.dev; form-action 'self'",
    );
    headers.delete("X-Frame-Options");
  }

  // HSTS is meaningful only on HTTPS responses. Browsers ignore it over HTTP,
  // but don't advertise HSTS from a local/dev HTTP origin.
  if (requestUrl.protocol === "https:") {
    headers.set("Strict-Transport-Security", "max-age=31536000");
  }

  // Public HTML and API errors may contain localized visitor-specific state;
  // don't let shared intermediaries cache failures or 429 responses.
  if (response.status >= 400 && !headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-store");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function publicSecurityHeadersForTest() {
  return { ...COMMON_SECURITY_HEADERS };
}
