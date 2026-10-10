/** Real decoding, request boundaries, visibility, failure and explicit tour QA. */
import assert from "node:assert/strict";
import { mediaContext, mediaCors } from "./site-media-fixture.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const engine = process.env.CROSS_BROWSER_ENGINE ?? "chromium";
const playwright = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH ?? "/tmp/somman-browser-qa/node_modules/playwright/index.mjs").href);
const browser = await playwright[engine].launch({ headless: true, ...(engine === "chromium" ? { args: ["--no-sandbox"] } : {}) });
const base = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const output = (process.env.QA_OUTPUT_DIR ?? "/tmp/somman-browser-artifacts") + "/video-" + engine;
const results = [];
await mkdir(output, { recursive: true });
function isFilmRequest(request) {
  // WebKit labels native media requests as "other". Vite's ?import requests
  // are URL-export modules, so exclude those without weakening byte checks.
  const url = new URL(request.url());
  return /\.(?:mp4|webm)$/.test(url.pathname) && !url.searchParams.has("import");
}
async function fresh(options = {}) {
  const context = await mediaContext(browser, { viewport: { width: 1366, height: 900 }, reducedMotion: "no-preference", ...options });
  const page = await context.newPage();
  // Preserve the real admin hooks but isolate public media from live uploads.
  await page.route("**/rest/v1/site_media**", route => route.fulfill({ status: route.request().method() === "OPTIONS" ? 204 : 200, contentType: "application/json", headers: mediaCors(route), body: route.request().method() === "OPTIONS" ? "" : "[]" }));
  return { context, page };
}
async function visit(page) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
      if (!response || response.status() >= 500) throw new Error("HTTP " + response?.status());
      break;
    } catch (error) {
      if (attempt >= 15) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  await page.locator('[data-cinema-ready="true"]').waitFor({ state: "attached", timeout: 30000 });
  await page.locator(".site-loader").waitFor({ state: "detached", timeout: 12000 });
}
async function decoded(locator) {
  await locator.waitFor({ state: "attached", timeout: 12000 });
  await locator.evaluate(node => new Promise((resolve, reject) => {
    if (node.error) return reject(new Error("Existing decoder error " + node.error.code));
    if (node.readyState >= 2 && node.videoWidth > 0) return resolve(true);
    const timer = setTimeout(() => reject(new Error("Video did not decode: " + JSON.stringify({ error: node.error?.code, src: node.currentSrc, paused: node.paused, ready: node.readyState, network: node.networkState, stage: node.closest("figure")?.dataset, bounds: node.getBoundingClientRect().toJSON(), viewport: { height: innerHeight, width: innerWidth } }))), 15000);
    node.addEventListener("loadeddata", () => { clearTimeout(timer); resolve(true); }, { once: true });
    node.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Video decoder error " + node.error?.code)); }, { once: true });
  }));
}
async function check(name, fn) {
  console.log("[VIDEO " + engine + "] " + name + ": START");
  await fn(); results.push({ name, status: "PASS" });
  console.log("[VIDEO " + engine + "] " + name + ": PASS");
}

try {
  await check("hero decodes; only hero video requested at entry; section films pause offscreen", async () => {
    const { context, page } = await fresh();
    const requests = [];
    page.on("request", request => { if (isFilmRequest(request)) requests.push(request.url()); });
    await visit(page);
    const hero = page.locator('[data-video-section="hero"]');
    await decoded(hero.locator("video"));
    await page.waitForFunction(() => document.querySelector('[data-video-section="hero"]')?.getAttribute("data-video-playing") === "true");
    assert.ok(requests.length > 0);
    assert.ok(requests.every(url => /\/hero(?:-[^/]*)?\.(?:mp4|webm)/.test(url)), "entry fetched an offscreen/full film: " + requests.join(","));
    assert.equal(await page.locator(".site-tour-dialog video").count(), 0);
    assert.equal(await page.locator(".hero-gallery").getAttribute("data-hero-playing"), "false");
    await page.screenshot({ path: output + "/01-desktop-hero-film.png" });
    for (const id of ["production", "fleet", "facilities", "quarry"]) {
      const stage = page.locator('[data-video-section="' + id + '"]');
      assert.equal(await stage.locator("video").count(), 0, id + " must remain unloaded before intersection");
      await stage.scrollIntoViewIfNeeded();
      console.log("[VIDEO " + engine + "] decoding section " + id);
      await decoded(stage.locator("video"));
      await page.waitForFunction(section => document.querySelector('[data-video-section="' + section + '"]')?.getAttribute("data-video-playing") === "true", id);
      if (await hero.locator("video").count()) {
        assert.equal(await hero.locator("video").evaluate(node => node.paused), true);
      }
      assert.equal(await stage.locator("button").count(), 0);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForFunction(section => document.querySelector('[data-video-section="' + section + '"] video')?.paused, id);
    }
    await page.evaluate(() => document.querySelector('[data-video-section="hero"] video')?.dispatchEvent(new Event("ended")));
    await page.waitForFunction(() => !document.querySelector('[data-video-section="hero"]'));
    assert.equal(await hero.count(), 0);
    assert.equal(await page.locator(".hero-gallery__toolbar").count(), 0);
    await context.close();
  });

  await check("reduced motion has no automatic video requests; explicit full tour decodes and restores focus", async () => {
    const { context, page } = await fresh({ reducedMotion: "reduce" });
    const requests = [];
    page.on("request", request => { if (isFilmRequest(request)) requests.push(request.url()); });
    await visit(page);
    assert.equal(await page.locator("video").count(), 0);
    await page.locator(".site-tour").scrollIntoViewIfNeeded();
    assert.equal(requests.length, 0);
    const opener = page.locator(".site-tour__open");
    await opener.click();
    const dialog = page.locator(".site-tour-dialog");
    await decoded(dialog.locator("video"));
    assert.ok(await dialog.locator("video").evaluate(node => node.duration >= 176 && node.videoWidth === 960));
    assert.ok(requests.every(url => /full-tour/.test(url)));
    await page.screenshot({ path: output + "/02-full-tour.png" });
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert.equal(await opener.evaluate(node => node === document.activeElement), true);
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
    await context.close();
  });

  await check("blocked video preserves decoded photographs and leaves a closable tour", async () => {
    const { context, page } = await fresh();
    await page.route(/\.(?:mp4|webm)(?:\?|$)/, route => isFilmRequest(route.request()) ? route.abort() : route.continue());
    await visit(page);
    await page.waitForFunction(() => !document.querySelector('[data-video-section="hero"]'));
    assert.ok(await page.locator(".hero-gallery__photo--active").evaluate(node => node.complete && node.naturalWidth > 0));
    await page.locator('[data-video-section="production"]').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('[data-video-section="production"]')?.getAttribute("data-video-failed") === "true");
    assert.ok(await page.locator('[data-video-section="production"] img').evaluate(node => node.complete && node.naturalWidth > 0));
    await page.locator(".site-tour__open").click();
    await page.locator(".site-tour-dialog p").filter({ hasText: "could not play" }).waitFor();
    await page.keyboard.press("Escape");
    await page.locator(".site-tour-dialog").waitFor({ state: "detached" });
    await context.close();
  });

  await check("private admin uploads retain priority and failed uploads use verified fallback", async () => {
    const { context, page } = await fresh();
    let reads = 0;
    await page.unroute("**/rest/v1/site_media**");
    await page.route("**/rest/v1/site_media**", route => {
      if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: mediaCors(route), body: "" });
      reads += 1;
      return route.fulfill({ status: 200, contentType: "application/json", headers: mediaCors(route), body: JSON.stringify(["hero", "production"].map(section => ({ id: "qa-upload-" + section, section, kind: "video", storage_path: section + "/broken.webm", title_en: "Uploaded " + section + " film", title_ar: "فيديو مرفوع", sort_order: 0, created_at: "2026-10-08T00:00:00Z" }))) });
    });
    await page.route("**/storage/v1/object/sign/site-media**", async route => {
      if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: mediaCors(route), body: "" });
      if (route.request().method() !== "POST") return route.abort();
      const { paths } = route.request().postDataJSON();
      return route.fulfill({ status: 200, contentType: "application/json", headers: mediaCors(route), body: JSON.stringify(paths.map(path => ({ path, signedURL: "/object/sign/site-media/" + path + "?token=qa", error: null }))) });
    });
    await visit(page);
    assert.equal(reads, 1, "shared hook should perform one mocked metadata read");
    await decoded(page.locator('[data-video-section="hero"] video'));
    await page.waitForFunction(() => document.querySelector('[data-video-section="hero"] video')?.currentSrc.includes("/hero"));
    assert.ok(await page.locator('[data-video-section="hero"] video').evaluate(node => !node.currentSrc.includes("broken")));
    const production = page.locator('[data-video-section="production"]');
    await production.scrollIntoViewIfNeeded();
    await decoded(production.locator("video"));
    assert.ok(await production.locator("video").evaluate(node => !node.currentSrc.includes("broken")));
    assert.equal(await production.locator("figcaption").innerText().then(text => text.includes("Crushing, screening")), true);
    await context.close();
  });

  await check("mobile Arabic media stays uncluttered and tour remains within viewport", async () => {
    const { context, page } = await fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce" });
    await visit(page);
    await page.getByRole("button", { name: "تغيير لغة الموقع إلى العربية" }).click();
    await page.waitForFunction(() => document.documentElement.lang === "ar");
    assert.equal(await page.locator(".hero-gallery__toolbar").count(), 0);
    assert.equal(await page.locator(".hero-film-mode").count(), 0);
    assert.equal(await page.locator('[data-video-section="hero"] button').count(), 0);
    await page.screenshot({ path: output + "/03-mobile-arabic-hero.png" });
    await page.locator(".site-tour__open").click();
    await decoded(page.locator(".site-tour-dialog video"));
    const box = await page.locator(".site-tour-dialog").boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= 391);
    assert.ok(await page.locator(".site-tour-dialog p").innerText().then(text => text.includes("دون صوت")));
    await page.screenshot({ path: output + "/04-mobile-arabic-tour.png" });
    await page.getByRole("button", { name: "إغلاق جولة الموقع" }).click();
    await context.close();
  });

  if (engine === "chromium") {
    await check("data saver keeps ambient films deferred without transport controls", async () => {
      const { context, page } = await fresh();
      await page.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true }));
      await visit(page);
      assert.equal(await page.locator("video").count(), 0);
      assert.equal(await page.locator(".site-video__toggle").count(), 0);
      assert.ok(await page.locator(".hero-gallery__photo--active").evaluate(node => node.complete && node.naturalWidth > 0));
      await context.close();
    });

    for (const exit of ["timeout", "button", "escape"]) {
      await check("held first image permits bounded loader exit: " + exit, async () => {
        const { context, page } = await fresh();
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        await page.route("**/photos/production-001.webp*", async route => { await gate; await route.continue().catch(() => {}); });
        // Catch the actual first image filename from the current SSR markup, rather than guessing its ID.
        const html = await page.request.get(base).then(response => response.text());
        const src = html.match(/<img[^>]*class="[^"]*hero-gallery__photo--active[^>]*src="([^"]+)"/)?.[1]
          ?? html.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*hero-gallery__photo--active/)?.[1];
        assert.ok(src, "SSR must include the critical first photograph");
        await page.route(new URL(src.replaceAll("&amp;", "&"), base).href, async route => { await gate; await route.continue().catch(() => {}); });
        await page.goto(base, { waitUntil: "domcontentloaded" });
        await page.locator(".site-loader[open]").waitFor();
        assert.equal(await page.locator("video").count(), 0, "loader must not start videos");
        const start = Date.now();
        if (exit === "button") await page.getByRole("button", { name: "Enter presentation", exact: true }).click();
        if (exit === "escape") await page.keyboard.press("Escape");
        await page.locator(".site-loader").waitFor({ state: "detached", timeout: 7000 });
        assert.ok(Date.now() - start < (exit === "timeout" ? 6500 : 2000));
        assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "");
        release(); await context.close();
      });
    }
  }
  await writeFile(output + "/results.json", JSON.stringify(results, null, 2));
} finally { await browser.close(); }
