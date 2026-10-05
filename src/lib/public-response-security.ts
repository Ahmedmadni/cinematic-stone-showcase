/**
 * Browser-facing response hardening for the public investor presentation.
 *
 * CSP inventory:
 * - Application scripts/styles/assets are self-hosted by TanStack/Vite.
 * - TanStack hydration emits inline scripts, so script-src keeps 'unsafe-inline'.
 * - Runtime CSS variables / framework styles require inline styles.
 * - Google Fonts uses fonts.googleapis.com + fonts.gstatic.com.
 * - The optional map iframe is hosted by maps.google.com / www.google.com.
 * - Browser-side Supabase, when used, connects only to *.supabase.co.
 * - Lovable preview/editor telemetry may use *.lovable.dev / *.lovable.app.
 *
 * Production HTTPS deliberately omits 'unsafe-eval'. Local HTTP development
 * permits it plus broad dev websocket/connect origins for Vite HMR only.
 */
function contentSecurityPolicy(request: Request): string {
  const url = new URL(request.url);
  const isProductionHttps = url.protocol === "https:";

  const scriptSrc = isProductionHttps
    ? "'self' 'unsafe-inline' https://*.lovable.dev https://*.lovable.app"
    : "'self' 'unsafe-inline' 'unsafe-eval'";

  const connectSrc = isProductionHttps
    ? "'self' https://*.supabase.co wss://*.supabase.co https://*.lovable.dev https://*.lovable.app wss://*.lovable.dev wss://*.lovable.app"
    : "'self' http: https: ws: wss:";

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSrc}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "frame-src 'self' https://maps.google.com https://www.google.com",
    `connect-src ${connectSrc}`,
    "worker-src 'self' blob:",
    "media-src 'self'",
    "manifest-src 'self'",
  ];

  if (isProductionHttps) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

export function hardenPublicResponse(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Content-Security-Policy", contentSecurityPolicy(request));

  // Do not let temporary Lovable preview/published hostnames become the search
  // canonical before the company approves its final public domain. A future
  // custom domain is unaffected and can use the page's normal index directive.
  const url = new URL(request.url);
  if (url.hostname === "lovable.app" || url.hostname.endsWith(".lovable.app")) {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  // POST bodies may contain investor contact details or assistant questions.
  // Public API responses may also contain model text. Never let intermediaries
  // persist these. Static assets and normal GET pages retain framework caching.
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
