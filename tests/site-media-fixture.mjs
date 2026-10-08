/** Only the explicitly configured QA host is mocked; no live account is used. */
export function mediaCors(route) {
  const headers = route.request().headers();
  return {
    "access-control-allow-origin": headers.origin ?? "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": headers["access-control-request-headers"] ?? "apikey, authorization, content-type, x-client-info, prefer, x-supabase-api-version",
  };
}

export async function isolateSiteMedia(context) {
  await context.route("https://somman-browser-qa.supabase.co/**", route => {
    const preflight = route.request().method() === "OPTIONS";
    const metadata = new URL(route.request().url()).pathname === "/rest/v1/site_media";
    return route.fulfill({ status: preflight ? 204 : metadata ? 200 : 404, contentType: "application/json", headers: mediaCors(route), body: preflight ? "" : metadata ? "[]" : '{"message":"QA endpoint not configured"}' });
  });
}

export async function mediaContext(browser, options) {
  const context = await browser.newContext(options);
  await isolateSiteMedia(context);
  return context;
}
