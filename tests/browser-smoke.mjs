/**
 * Read-only Chromium QA for the actual pull-request dev build.
 * No inquiry submissions and no customer information is transmitted.
 *
 * CI installs Playwright in /tmp separately to avoid changing the site's
 * existing package manager lockfile. Screenshots help manual sign-off.
 */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const modulePath = process.env.PLAYWRIGHT_MODULE_PATH ?? "/tmp/somman-browser-qa/node_modules/playwright/index.mjs";
const { chromium } = await import(pathToFileURL(modulePath).href);
const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const output = process.env.QA_OUTPUT_DIR ?? "/tmp/somman-browser-artifacts";
const results = [];
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
async function openWithRetry(page, url) {
  let lastError;
  for (let attempt = 0; attempt < 24; attempt++) {
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 12000 });
      if (response && response.status() < 500) {
        await page.locator('[data-cinema-ready="true"]').waitFor({ timeout: 30000 });
        return response;
      }
      lastError = new Error("HTTP " + (response?.status() ?? "no response"));
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("App never became ready: " + String(lastError));
}

async function caseRun(name, run) {
  console.log("[BROWSER] " + name + ": START");
  await run();
  console.log("[BROWSER] " + name + ": PASS");
  results.push({ name, status: "PASS" });
}

try {
  const desktop = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
    locale: "ar-SA",
  });
  const desktopPage = await desktop.newPage();
  const runtimeErrors = [];
  desktopPage.on("pageerror", (error) => runtimeErrors.push(error.message));

  await caseRun("localhost responses expose release security headers without breaking development", async () => {
    // This is the first browser case, so wait for the background Vite process
    // instead of racing its cold startup in GitHub Actions.
    await openWithRetry(desktopPage, baseURL);
    const response = await desktopPage.request.get(baseURL + "/");
    assert.equal(response.headers()["x-content-type-options"], "nosniff");
    assert.equal(response.headers()["x-frame-options"], "DENY");
    assert.equal(response.headers()["referrer-policy"], "strict-origin-when-cross-origin");
    assert.match(response.headers()["permissions-policy"] ?? "", /camera=\(\)/);
    assert.equal(response.headers()["strict-transport-security"], undefined);

    const api = await desktopPage.request.post(baseURL + "/api/public/ask", {
      data: { question: "write me a poem", history: [], language: "en" },
    });
    assert.equal(api.headers()["cache-control"], "no-store");
    assert.equal(api.headers()["x-content-type-options"], "nosniff");
  });

  await caseRun("English-first metadata, crawler boundaries and keyboard skip navigation", async () => {
    await openWithRetry(desktopPage, baseURL);
    assert.match(await desktopPage.title(), /Al Somman Quarry/i);
    assert.match(await desktopPage.locator('meta[name="description"]').getAttribute("content") ?? "", /Al Somman quarry/i);
    assert.equal(await desktopPage.locator('meta[name="robots"]').getAttribute("content"), "index,follow,max-image-preview:large");
    assert.equal(await desktopPage.locator('meta[name="theme-color"]').getAttribute("content"), "#252525");

    const robots = await desktopPage.request.get(baseURL + "/robots.txt");
    assert.equal(robots.status(), 200);
    const robotsText = await robots.text();
    assert.match(robotsText, /User-agent:\s*\*/i);
    assert.match(robotsText, /Disallow:\s*\/api\//i);
    assert.doesNotMatch(robotsText, /Sitemap:\s*https?:\/\//i);

    const skip = desktopPage.locator(".skip-to-content");
    assert.equal(await skip.innerText(), "Skip to main content");
    await skip.focus();
    await desktopPage.waitForFunction(() => {
      const el = document.querySelector(".skip-to-content");
      return el === document.activeElement && el instanceof HTMLElement
        && getComputedStyle(el).transform !== "none";
    });
    await skip.press("Enter");
    await desktopPage.waitForFunction(() => location.hash === "#main-content");
    assert.equal(await desktopPage.evaluate(() => document.activeElement?.id), "main-content");
  });

  await caseRun("desktop English default, icon-only tools and logical quarry hero", async () => {
    await openWithRetry(desktopPage, baseURL);
    assert.equal(await desktopPage.locator(".presentation").getAttribute("dir"), "ltr");
    assert.equal(await desktopPage.evaluate(() => document.documentElement.lang), "en");
    assert.ok(await desktopPage.locator("#hero-title").isVisible());
    assert.equal(await desktopPage.locator("#cinematic-bridge").count(), 1);
    assert.equal(await desktopPage.locator("#التواصل").count(), 1);
    const controls = desktopPage.locator(".somman-floating-tools .somman-tool");
    assert.equal(await controls.count(), 2);
    for (const iconButton of await controls.all()) {
      assert.ok(await iconButton.getAttribute("aria-label"), "icon-only control must have an accessible name");
      assert.equal(await iconButton.locator("span").count(), 0, "floating controls should have SVG icon only");
      const box = await iconButton.boundingBox();
      assert.ok(box && box.width >= 44 && box.height >= 44, "icon control must be touch accessible");
    }
    const carousel = desktopPage.locator(".hero-gallery");
    assert.equal(await carousel.count(), 1);
    assert.equal(await desktopPage.locator(".hero-gallery__dots button").count(), 10);
    assert.equal(await carousel.locator(".hero-gallery__photo--active").count(), 1);
    assert.equal(await desktopPage.locator(".hero-media__breaker").count(), 0);
    assert.equal(await desktopPage.locator(".hero-media__loading").count(), 0);
    assert.equal(await desktopPage.locator(".hero-media img[src*='equipment.jpg']").count(), 0);
    assert.match(await desktopPage.locator(".hero-photo-label").innerText(), /illustrative/i);
    await desktopPage.screenshot({ path: output + "/desktop-hero-10-single-scene.png", animations: "disabled" });
  });


  await caseRun("first hero image preloaded and outgoing scene stays until new image loads", async () => {
    // Dedicated context avoids cached assets from prior scroll tests. Slow only
    // the *second* scene; never globally throttle site hydration or vital CSS.
    const context = await browser.newContext({
      viewport: { width: 1240, height: 780 },
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    try {
      let deferredRoutes = 0;
      await page.route("**/excavators.jpg*", async route => {
        deferredRoutes += 1;
        await new Promise(resolve => setTimeout(resolve, 2600));
        await route.continue();
      });
      await openWithRetry(page, baseURL);
      const preload = page.locator('link[rel="preload"][as="image"][href*="quarry-aerial"]');
      assert.equal(await preload.count(), 1, "first hero photo must be discoverable as an image preload");
      await page.waitForFunction(() =>
        document.querySelector(".hero-gallery")?.getAttribute("data-hero-image-ready") === "true",
        null, { timeout: 6500 });
      await page.locator(".hero-gallery__dots button").nth(1).click();
      await page.waitForFunction(() => 
        document.querySelector(".hero-gallery")?.getAttribute("data-hero-active") === "1",
        null, {timeout:4500});
      assert.equal(await page.locator(".hero-gallery__photo--outgoing").count(), 1);
      // While the new network image is pending, preserve previous decoded
      // pixels under a transparent incoming layer.
      if ((await page.locator(".hero-gallery").getAttribute("data-hero-image-ready")) === "false") {
        assert.equal(await page.locator(".hero-gallery__photo--waiting").count(), 1);
      }
      await page.waitForFunction(() =>
        document.querySelector(".hero-gallery")?.getAttribute("data-hero-image-ready") === "true",
        null, {timeout:10000});
      assert.ok(deferredRoutes >= 1, "test must actually delay the second hero image");
      await page.waitForTimeout(1450);
      assert.equal(await page.locator(".hero-gallery__photo--outgoing").count(), 0);
      assert.equal(await page.locator(".hero-gallery__photo--active").count(), 1);
      await page.screenshot({path:output+"/hero-loaded-no-flash.png", animations:"disabled"});
    } finally {
      await context.close();
    }
  });

  await caseRun("floating language control translates the entire site and persists choice", async () => {
    const arabic = desktopPage.getByRole("button", { name: "تغيير لغة الموقع إلى العربية" });
    assert.ok(await arabic.isVisible());
    await arabic.click();
    await desktopPage.waitForFunction(() =>
      document.documentElement.lang === "ar" && document.documentElement.dir === "rtl");
    assert.match(await desktopPage.locator(".overview-grid").innerText(), /ليست مجرد كسارة/);
    const english = desktopPage.getByRole("button", { name: "Switch website to English" });
    await english.click();
    await desktopPage.waitForFunction(() =>
      document.documentElement.lang === "en" && document.documentElement.dir === "ltr"
      && document.querySelector(".presentation")?.getAttribute("data-language") === "en");
    assert.ok(await desktopPage.getByRole("heading", { name: /More than a crushing plant/i }).isVisible());
    assert.match(await desktopPage.locator(".fleet-experience__header").innerText(), /Four chapters/);
    assert.match(await desktopPage.locator(".quarry-cards__heading").innerText(), /Three quarries/);
    assert.match(await desktopPage.locator(".evidence-studio__header").innerText(), /Evidence/i);

    const untranslated = await desktopPage.evaluate(() => {
      const main = document.querySelector("main");
      if (!main) return ["missing main"];
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      const leftovers = [];
      let node;
      while ((node = walker.nextNode())) {
        const value = node.textContent?.trim() ?? "";
        if (/[\u0621-\u064a]/.test(value)) leftovers.push(value.slice(0, 115));
      }
      return [...new Set(leftovers)].slice(0, 15);
    });
    assert.deepEqual(untranslated, [], "English view contains unlocalized Arabic copy: " + JSON.stringify(untranslated));

    await desktopPage.reload({ waitUntil: "domcontentloaded" });
    await desktopPage.waitForFunction(() => document.documentElement.lang === "en");
    assert.equal(await desktopPage.locator(".presentation").getAttribute("dir"), "ltr");
    await desktopPage.screenshot({ path: output + "/desktop-english-identity.png", animations: "disabled" });
  });

  await caseRun("floating assistant refuses off-topic English requests without model access", async () => {
    const toggle = desktopPage.getByRole("button", { name: "Open Al Somman assistant" });
    await toggle.click();
    const drawer = desktopPage.locator("#somman-assistant-drawer");
    assert.ok(await drawer.isVisible());
    await drawer.getByRole("textbox", { name: "Your quarry question" }).fill("What is the capital of France?");
    await drawer.getByRole("button", { name: "Send question" }).click();
    await desktopPage.waitForFunction(() =>
      document.querySelector("#somman-assistant-drawer .assistant-msg.assistant")?.textContent?.includes("Sorry, I can only answer"),
      null, { timeout: 12000 });
    assert.match(await drawer.innerText(), /quarry and crushing plant/i);
    await drawer.getByRole("button", { name: "Close assistant" }).click();
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    assert.ok(!(await drawer.isVisible()));
    const switchBack = desktopPage.getByRole("button", { name: "تغيير لغة الموقع إلى العربية" });
    await switchBack.click();
    await desktopPage.waitForFunction(() => document.documentElement.lang === "ar" && document.documentElement.dir === "rtl");
  });

  await caseRun("assistant handles success, upstream failures, truncated SSE and rate limits", async () => {
    // These are synthetic responses; no paid AI calls or real user data are sent.
    const chatContext = await browser.newContext({
      viewport: { width: 1050, height: 820 },
      reducedMotion: "reduce",
      locale: "en-US",
    });
    const page = await chatContext.newPage();
    let mode = "success";
    let requests = 0;
    await page.route("**/api/public/ask", async route => {
      requests++;
      const posted = route.request().postDataJSON();
      assert.equal(posted.language, "en");
      assert.match(posted.question, /quarry/i);
      if (mode === "busy") {
        await route.fulfill({
          status: 429,
          contentType: "application/json",
          headers: { "Retry-After": "12", "Cache-Control": "no-store" },
          body: JSON.stringify({ error: "Too many quarry questions right now. Please retry shortly." }),
        });
        return;
      }
      const stream = mode === "success"
        ? [
          'data: {"type":"response.output_text.delta","delta":"Fourteen "}\n\n',
          'data: {"type":"response.output_text.delta","delta":"excavators."}\n\n',
          "data: [DONE]\n\n",
        ].join("")
        : mode === "failure"
          ? 'event: response.failed\ndata: {"type":"response.failed","error":{"message":"PROVIDER_PRIVATE_DETAIL"}}\n\n'
          : 'data: {"type":"response.output_text.delta","delta":"Partial excerpt."}\n\n';
      await route.fulfill({ status: 200, contentType: "text/event-stream; charset=utf-8", body: stream });
    });
    try {
      await openWithRetry(page, baseURL);
      await page.getByRole("button", { name: "Open Al Somman assistant" }).click();
      const drawer = page.locator("#somman-assistant-drawer");
      const question = drawer.getByRole("textbox", { name: "Your quarry question" });
      async function submit() {
        await question.fill("How many excavators does the Al Somman quarry have?");
        await drawer.getByRole("button", { name: "Send question" }).click();
      }
      await submit();
      await page.waitForFunction(() =>
        document.querySelector("#somman-assistant-drawer .assistant-msg.assistant")?.textContent?.includes("Fourteen excavators."),
        null, { timeout: 7000 });
      assert.equal(await drawer.locator(".assistant-error").count(), 0);
      mode = "failure";
      await submit();
      await drawer.locator(".assistant-error").waitFor({ state: "visible", timeout: 7000 });
      assert.match(await drawer.locator(".assistant-error").innerText(), /interrupted/i);
      assert.doesNotMatch(await drawer.innerText(), /PROVIDER_PRIVATE_DETAIL/);
      mode = "truncated";
      await submit();
      await drawer.locator(".assistant-msg.assistant").last().filter({ hasText: "Partial excerpt." }).waitFor({ state: "visible", timeout: 7000 });
      await drawer.locator(".assistant-error").waitFor({ state: "visible", timeout: 7000 });
      assert.match(await drawer.locator(".assistant-error").innerText(), /interrupted/i);
      mode = "busy";
      await submit();
      await drawer.locator(".assistant-error").waitFor({ state: "visible", timeout: 7000 });
      assert.match(await drawer.locator(".assistant-error").innerText(), /Too many quarry questions/i);
      assert.equal(requests, 4, "all four test requests were intercepted in the browser");
      await drawer.getByRole("button", { name: "Close assistant" }).click();
    } finally {
      await chatContext.close();
    }
  });

  await caseRun("scrubbed quarry reveal advances with natural scroll", async () => {
    await desktopPage.evaluate(() => {
      const bridge = document.getElementById("cinematic-bridge");
      if (!bridge) throw new Error("Missing cinematic bridge");
      const start = bridge.getBoundingClientRect().top + window.scrollY;
      const travel = bridge.getBoundingClientRect().height - window.innerHeight;
      window.scrollTo({ top: start + travel * 0.5, behavior: "instant" });
    });
    // Scroll events and IntersectionObserver notifications have separate
    // frame scheduling; wait for both instead of reading a race-prone frame.
    await desktopPage.waitForFunction(() => {
      const root = document.querySelector(".presentation");
      if (!root) return false;
      const p = Number.parseFloat(getComputedStyle(root).getPropertyValue("--cinema-bridge-progress"));
      return p > 0.15 && p < 0.85;
    }, null, { timeout: 10000, polling: "raf" });
    const sample = await desktopPage.locator(".presentation").evaluate((root) =>
      Number.parseFloat(getComputedStyle(root).getPropertyValue("--cinema-bridge-progress"))
    );
    assert.ok(sample > 0.15 && sample < 0.85, "bridge progress should be mid-transition: " + sample);
  });

  await caseRun("three material journey photographs advance with real scroll", async () => {
    const track = desktopPage.locator("#material-scroll-track");
    const story = desktopPage.locator(".production-flow--story");
    assert.equal(await track.count(), 1);
    for (const scene of [0, 1, 2]) {
      await desktopPage.evaluate((index) => {
        const node = document.getElementById("material-scroll-track");
        if (!node) throw new Error("Material track missing");
        const rect = node.getBoundingClientRect();
        const start = window.scrollY + rect.top;
        window.scrollTo({ top: start + Math.max(0, rect.height - innerHeight) * ((index + .5) / 3), behavior: "instant" });
      }, scene);
      await desktopPage.waitForFunction((index) =>
        document.querySelector(".presentation")?.getAttribute("data-cinema-material-scene") === String(index)
        && document.querySelectorAll(".production-flow__step.is-active")[0] === document.querySelectorAll(".production-flow__step")[index],
        scene, { timeout: 12000, polling: "raf" });
      assert.equal(await story.locator(".production-flow__photo.is-active").count(), 1);
      assert.equal(await story.locator(".production-flow__step").nth(scene).getAttribute("aria-pressed"), "true");
    }
    assert.equal(await story.locator(".production-flow__story").evaluate((el) => getComputedStyle(el).position), "sticky");
    await desktopPage.screenshot({ path: output + "/desktop-material-journey.png", animations: "disabled" });
    const jump = story.locator(".production-flow__visual-marker");
    assert.equal(await jump.getAttribute("href"), "#equipment-title");
    assert.ok(await jump.isVisible(), "material journey must provide an actionable exit");
    await jump.click();
    await desktopPage.waitForFunction(() => decodeURIComponent(location.hash) === "#equipment-title");
  });

  await caseRun("all four fleet tabs advance with scrolling, not just clicks", async () => {
    const fleet = desktopPage.locator("#equipment-experience");
    const track = desktopPage.locator("#fleet-scroll-track");
    assert.equal(await track.count(), 1);
    for (const scene of [0, 1, 2, 3]) {
      await desktopPage.evaluate((index) => {
        const node = document.getElementById("fleet-scroll-track");
        if (!node) throw new Error("Fleet track missing");
        const rect = node.getBoundingClientRect();
        const start = scrollY + rect.top;
        window.scrollTo({ top: start + Math.max(0, rect.height - innerHeight) * ((index + .5) / 4), behavior: "instant" });
      }, scene);
      await desktopPage.waitForFunction((index) =>
        document.querySelector(".presentation")?.getAttribute("data-cinema-fleet-scene") === String(index)
        && document.querySelectorAll("#equipment-experience .fleet-experience__selector.is-selected")[0] === document.querySelectorAll("#equipment-experience .fleet-experience__selector")[index],
        scene, { timeout: 12000, polling: "raf" });
      assert.equal(await fleet.locator(".fleet-experience__image.is-active").count(), 1);
      assert.equal(await fleet.locator(".fleet-experience__selector").nth(scene).getAttribute("aria-pressed"), "true");
    }
    await desktopPage.screenshot({ path: output + "/desktop-four-fleet-scroll.png", animations: "disabled" });
    await fleet.locator(".fleet-experience__selector").nth(1).click();
    await desktopPage.waitForFunction(() =>
      document.querySelector(".presentation")?.getAttribute("data-cinema-fleet-scene") === "1",
      null, { timeout: 15000, polling: "raf" });
    assert.equal(await fleet.locator(".fleet-experience__selector").nth(1).getAttribute("aria-pressed"), "true");
  });

  await caseRun("source photo backgrounds and quarry record gallery rotate only when visible", async () => {
    const production = desktopPage.locator(".image-feature .auto-visual");
    await production.scrollIntoViewIfNeeded();
    await desktopPage.mouse.move(0, 0);
    await desktopPage.waitForFunction(() =>
      document.querySelector(".image-feature .auto-visual")?.getAttribute("data-auto-playing") === "playing",
      null, { timeout: 8000 });
    const first = await production.getAttribute("data-auto-active");
    await desktopPage.waitForFunction(previous =>
      document.querySelector(".image-feature .auto-visual")?.getAttribute("data-auto-active") !== previous,
      first, { timeout: 10200 });

    const quarry = desktopPage.locator(".quarry-cards");
    await quarry.scrollIntoViewIfNeeded();
    await desktopPage.mouse.move(0, 0);
    await desktopPage.waitForFunction(() =>
      document.querySelector(".quarry-cards")?.getAttribute("data-quarry-gallery-autoplay") === "playing",
      null, { timeout: 8000 });
    const initial = await quarry.locator(".quarry-cards__site.is-selected").getAttribute("aria-label");
    await desktopPage.waitForFunction(previous =>
      document.querySelector(".quarry-cards__site.is-selected")?.getAttribute("aria-label") !== previous,
      initial, { timeout: 14900 });
    await quarry.locator(".quarry-cards__site").nth(1).click();
    assert.equal(await quarry.getAttribute("data-quarry-gallery-autoplay"), "paused");
  });

  await caseRun("quarry permit photographic overview is no longer abstract tiles", async () => {
    const gallery = desktopPage.locator(".quarry-cards");
    await gallery.scrollIntoViewIfNeeded();
    assert.equal(await gallery.locator(".quarry-cards__site img").count(), 3);
    assert.equal(await gallery.locator(".quarry-atlas__tile").count(), 0);
    const second = gallery.getByRole("button", { name: "عرض ملف محجر الأسطول ٢" });
    await second.click();
    assert.equal(await second.getAttribute("aria-pressed"), "true");
    assert.match(await gallery.locator(".quarry-cards__information").innerText(), /14377125/);
    assert.match(await gallery.locator(".quarry-cards__information").innerText(), /منتهية بحسب نسخة العرض/);
    await desktopPage.screenshot({ path: output + "/desktop-photographic-quarries.png", animations: "disabled" });
  });

  await caseRun("question suggestions are readable in the floating assistant", async () => {
    // The assistant used to be inline. It now starts in a closed drawer and
    // keeps the conversation until a reload; reopen a fresh session for chips.
    await openWithRetry(desktopPage, baseURL);
    const open = desktopPage.getByRole("button", { name: "فتح مساعد الصمان" });
    await open.click();
    const qa = desktopPage.locator("#somman-assistant-drawer");
    assert.ok(await qa.isVisible());
    const chips = qa.locator(".assistant-suggestions button");
    assert.equal(await chips.count(), 4);
    assert.ok(await chips.first().isVisible());
    assert.ok((await chips.first().boundingBox())?.height >= 45);
    await desktopPage.screenshot({ path: output + "/desktop-question-prompts.png", animations: "disabled" });
    await qa.getByRole("button", { name: "أغلق المساعد" }).click();
  });


  await caseRun("closing assistant cancels an unfinished stream and clears busy state", async () => {
    await openWithRetry(desktopPage, baseURL);
    let intercepted = 0;
    await desktopPage.route("**/api/public/ask", async route => {
      intercepted += 1;
      await new Promise(resolve => setTimeout(resolve, 2200));
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream; charset=utf-8",
        body: 'data: {"type":"response.output_text.delta","delta":"late answer"}\n\ndata: [DONE]\n\n',
      }).catch(() => {});
    });
    try {
      await desktopPage.getByRole("button", { name: "فتح مساعد الصمان" }).click();
      const drawer = desktopPage.locator("#somman-assistant-drawer");
      const log = drawer.locator(".assistant-log");
      await drawer.locator(".assistant-suggestions button").first().click();
      await desktopPage.waitForFunction(() =>
        document.querySelector(".assistant-log")?.getAttribute("aria-busy") === "true",
        null, { timeout: 2500 });
      await drawer.getByRole("button", { name: "أغلق المساعد" }).click();
      await desktopPage.waitForTimeout(250);
      assert.equal(intercepted, 1);
      assert.equal(await drawer.isVisible(), false);
      await desktopPage.getByRole("button", { name: "فتح مساعد الصمان" }).click();
      await desktopPage.waitForFunction(() =>
        document.querySelector(".assistant-log")?.getAttribute("aria-busy") === "false",
        null, { timeout: 2500 });
      assert.equal(await drawer.locator(".assistant-msg.assistant").count(), 0,
        "an aborted hidden request must not append a late paid answer");
      await drawer.getByRole("button", { name: "أغلق المساعد" }).click();
    } finally {
      await desktopPage.unroute("**/api/public/ask");
    }
  });

  await caseRun("hero clarity and genuine scroll-driven zigzag masks", async () => {
    await openWithRetry(desktopPage, baseURL);
    const hero = desktopPage.locator(".hero-gallery__photo--active");
    await hero.waitFor({ state: "visible" });
    const heroState = await hero.evaluate((image) => ({
      loaded: image instanceof HTMLImageElement && image.complete && image.naturalWidth >= 1200,
      width: image instanceof HTMLImageElement ? image.naturalWidth : 0,
      objectFit: getComputedStyle(image).objectFit,
      visible: getComputedStyle(image).visibility,
    }));
    assert.ok(heroState.loaded, "hero first scene should be a sharp, documented illustrative image: " + JSON.stringify(heroState));
    assert.equal(heroState.objectFit, "cover");
    assert.equal(heroState.visible, "visible");
    assert.equal(await desktopPage.locator(".hero-gallery__photo--active").count(), 1);
    assert.equal(await desktopPage.locator(".hero-gallery__dots button").count(), 10);

    for (const spec of [
      { id: "material-scroll-track", chapterClass: ".production-flow__photo", count: 3, active: "cinema-material-scene" },
      { id: "fleet-scroll-track", chapterClass: ".fleet-experience__image", count: 4, active: "cinema-fleet-scene" },
    ]) {
      for (const index of [0, 1, spec.count - 1]) {
        await desktopPage.evaluate(({ id, count, index }) => {
          const section = document.getElementById(id);
          if (!section) throw new Error("Missing track " + id);
          const rect = section.getBoundingClientRect();
          const top = window.scrollY + rect.top;
          window.scrollTo({ top: top + (rect.height - window.innerHeight) * ((index + .13) / count), behavior: "instant" });
        }, { ...spec, index });
        await desktopPage.waitForFunction(({ active, index }) =>
          document.querySelector(".presentation")?.getAttribute("data-" + active.replace(/[A-Z]/g, x => "-" + x.toLowerCase())) === String(index),
          { active: spec.active, index }, { timeout: 11000, polling: "raf" });
        const visual = await desktopPage.evaluate(({ selector, index }) => {
          const image = document.querySelectorAll(selector)[index];
          if (!image) throw new Error("Missing illustration #" + index);
          const style = getComputedStyle(image);
          return {
            clip: style.clipPath,
            mask: style.maskImage,
            z: style.zIndex,
            opacity: style.opacity,
          };
        }, { selector: spec.chapterClass, index });
        assert.ok(visual.clip.startsWith("polygon("), "chapter " + spec.id + "/" + index + " must use jagged polygon reveal: " + JSON.stringify(visual));
        assert.equal(visual.z, "1", "foreground image must paint above backdrop");
        assert.equal(visual.opacity, "1");
      }
    }
    await desktopPage.screenshot({ path: output + "/desktop-soft-zigzag-reveal.png", animations: "disabled" });
  });

  await caseRun("ten hero photos autoplay sequentially and visitor can pause or choose", async () => {
    // Use a clean page instead of inheriting several scroll chapters, focus
    // targets and browser history changes from preceding visual tests.
    const isolatedHeroContext = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: "no-preference" });
    const heroPage = await isolatedHeroContext.newPage();
    try {
    await openWithRetry(heroPage, baseURL);
    const carousel = heroPage.locator(".hero-gallery");
    await heroPage.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await heroPage.mouse.move(0, 0);
    await heroPage.waitForFunction(() => document.querySelector(".hero-gallery")?.getAttribute("data-hero-playing") === "true", null, { timeout: 9000 });
    const first = await carousel.getAttribute("data-hero-active");
    await heroPage.waitForFunction(previous =>
      document.querySelector(".hero-gallery")?.getAttribute("data-hero-active") !== previous,
      first, { timeout: 10000 });
    assert.equal(await carousel.locator(".hero-gallery__photo--active").count(), 1);
    const dots = heroPage.locator(".hero-gallery__dots button");
    assert.equal(await dots.count(), 10);
    await dots.nth(7).click();
    assert.equal(await carousel.getAttribute("data-hero-active"), "7");
    assert.equal(await carousel.getAttribute("data-hero-playing"), "false");
    await heroPage.locator(".hero-gallery__motion-toggle").click();
    await heroPage.mouse.move(0, 0);
    await heroPage.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    await heroPage.waitForFunction(() => document.querySelector(".hero-gallery")?.getAttribute("data-hero-playing") === "true", null, { timeout: 9000 });
    await dots.nth(3).focus();
    await heroPage.waitForFunction(() => document.querySelector(".hero-gallery")?.getAttribute("data-hero-playing") === "false", null, { timeout: 5000 });
    await heroPage.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    await heroPage.waitForFunction(() => document.querySelector(".hero-gallery")?.getAttribute("data-hero-playing") === "true", null, { timeout: 5000 });
    await heroPage.screenshot({ path: output + "/desktop-hero-slide-08.png", animations: "disabled" });
    } finally {
      await isolatedHeroContext.close();
    }
  });

  await caseRun("all six subject galleries independently enable timed autoplay", async () => {
    const galleries = desktopPage.locator(".site-gallery .gallery-slider");
    assert.equal(await galleries.count(), 6);
    for (let index = 0; index < 6; index++) {
      const gallery = galleries.nth(index);
      await gallery.scrollIntoViewIfNeeded();
      await desktopPage.mouse.move(0, 0);
      await desktopPage.waitForFunction(i => {
        const element = document.querySelectorAll(".site-gallery .gallery-slider")[i];
        return element?.getAttribute("data-gallery-autoplay") === "playing";
      }, index, { timeout: 9000 });
      assert.equal(await gallery.locator(".gallery-slide").count(), 2);
      assert.equal(await gallery.getByRole("button", { name: /Pause.*slideshow|إيقاف عرض/ }).count(), 1);
    }
    const firstGallery = galleries.first();
    await firstGallery.scrollIntoViewIfNeeded();
    // A touchscreen may synthesize mouse compatibility events. A touch
    // pointerover must not freeze the card's auto-rotation indefinitely.
    await desktopPage.mouse.move(0, 0);
    await firstGallery.evaluate((element) => {
      element.dispatchEvent(new PointerEvent("pointerover", {
        bubbles: true, pointerType: "touch",
      }));
    });
    assert.notEqual(await firstGallery.getAttribute("data-gallery-interaction"), "hover-paused", "touch pointer hover should not pause slideshow");
    await desktopPage.mouse.move(0, 0);
    await desktopPage.waitForFunction(() =>
      document.querySelector(".site-gallery .gallery-slider")?.getAttribute("data-gallery-autoplay") === "playing");
    const initial = await firstGallery.getAttribute("data-gallery-active");
    await desktopPage.waitForFunction(before =>
      document.querySelector(".site-gallery .gallery-slider")?.getAttribute("data-gallery-active") !== before,
      initial, { timeout: 10500 });
    await desktopPage.screenshot({ path: output + "/desktop-six-auto-galleries.png", animations: "disabled" });
  });

  await caseRun("native gallery keyboard navigation, focus trap and focus restoration", async () => {
    const button = desktopPage.locator(".gallery-image-button").first();
    await button.scrollIntoViewIfNeeded();
    await button.click();
    const dialog = desktopPage.locator("dialog.gallery-lightbox--native");
    await dialog.waitFor({ state: "visible", timeout: 8000 });
    assert.equal(await desktopPage.evaluate(() => document.activeElement?.getAttribute("aria-label")), "إغلاق الصورة");
    assert.equal(await dialog.getAttribute("data-lightbox-autoplay"), "playing");

    // Native modal dialog must keep keyboard focus inside the enlarged gallery.
    for (let step = 0; step < 8; step++) {
      await desktopPage.keyboard.press("Tab");
      assert.ok(await dialog.evaluate((element) => element.contains(document.activeElement)),
        "Tab escaped the open modal lightbox");
    }
    await desktopPage.keyboard.press("Shift+Tab");
    assert.ok(await dialog.evaluate((element) => element.contains(document.activeElement)),
      "Shift+Tab escaped the open modal lightbox");

    const initial = (await dialog.locator(".lightbox-toolbar .latin").innerText()).trim();
    await desktopPage.keyboard.press("ArrowRight");
    await desktopPage.waitForFunction(previous =>
      document.querySelector("dialog.gallery-lightbox .lightbox-toolbar .latin")?.textContent?.trim() !== previous,
      initial, { timeout: 5000 });
    const afterRight = (await dialog.locator(".lightbox-toolbar .latin").innerText()).trim();
    assert.notEqual(afterRight, initial, "ArrowRight must advance the lightbox");
    assert.equal(await dialog.getAttribute("data-lightbox-autoplay"), "paused",
      "manual keyboard navigation must pause autoplay");

    await desktopPage.keyboard.press("ArrowLeft");
    await desktopPage.waitForFunction(previous =>
      document.querySelector("dialog.gallery-lightbox .lightbox-toolbar .latin")?.textContent?.trim() !== previous,
      afterRight, { timeout: 5000 });

    await dialog.getByRole("button", { name: "تشغيل معرض الصور" }).click();
    assert.equal(await dialog.getAttribute("data-lightbox-autoplay"), "playing");
    await dialog.getByRole("button", { name: "إيقاف معرض الصور" }).click();
    assert.equal(await dialog.getAttribute("data-lightbox-autoplay"), "paused");

    await desktopPage.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden", timeout: 8000 });
    assert.ok(await button.evaluate((element) => document.activeElement === element), "focus must return to the original photo button");
  });

  await caseRun("live Google satellite link and independent simulated 3D view", async () => {
    const location = desktopPage.locator(".somman-location-experience");
    await location.scrollIntoViewIfNeeded();
    assert.ok(await location.getByRole("heading", { name: "خريطة القمر الصناعي" }).isVisible());
    assert.ok(await location.getByRole("heading", { name: "منظور مجسّم تصوري" }).isVisible());
    const iframe = location.locator('iframe[title*="Google Maps"]');
    assert.ok(await iframe.count() === 1);
    const src = await iframe.getAttribute("src");
    assert.ok(src?.includes("maps.google.com/maps?"));
    assert.match(src ?? "", /25\.515292%2C48\.362458/);
    const externalLink = location.getByRole("link", { name: /فتح موقع المحجر الاسترشادي/ });
    assert.match(await externalLink.getAttribute("href") ?? "", /^https:\/\/www\.google\.com\/maps\/search\//);
    const hotspot = location.getByRole("button", { name: "استعرض مناطق الاستخراج في المشهد التصوري" });
    await hotspot.click();
    assert.equal(await hotspot.getAttribute("aria-pressed"), "true");
    assert.match(await location.locator(".somman-location-experience__scene-caption").innerText(), /مساحات الحجر الخام/);
    await desktopPage.screenshot({ path: output + "/desktop-google-map-and-concept.png", animations: "disabled" });
  });

  await caseRun("investor evidence buttons remain interactive", async () => {
    const studio = desktopPage.locator(".evidence-studio");
    await studio.scrollIntoViewIfNeeded();
    await studio.getByRole("button", { name: /ملفات التراخيص/ }).click();
    const secondPermit = studio.locator(".evidence-studio__permit-tab").nth(1);
    await secondPermit.click();
    assert.equal(await secondPermit.getAttribute("aria-pressed"), "true");
    assert.match(await studio.locator(".evidence-studio__permit-card").innerText(), /14377125/);
    assert.match(await studio.locator(".evidence-studio__permit-card").innerText(), /منتهية بحسب نسخة العرض/);
    await desktopPage.screenshot({ path: output + "/desktop-evidence.png", animations: "disabled" });
  });

  await caseRun("investor data consent is explicit and never auto-submits", async () => {
    const form = desktopPage.locator(".inquiry-panel form");
    await form.scrollIntoViewIfNeeded();
    const consent = form.locator("#inquiry-consent");
    assert.ok(await consent.isVisible());
    assert.equal(await consent.getAttribute("required"), "");
    assert.equal(await consent.isChecked(), false);
    const notice = await form.locator(".inquiry-consent").innerText();
    assert.match(notice, /agree|أوافق/i);
    assert.match(notice, /delete|حذف/i);
    assert.match(notice, /WhatsApp|واتساب/i);
    const contact = form.locator(".inquiry-consent__request a");
    assert.equal(await contact.getAttribute("href"), "mailto:info@alostool.com.sa");
    await consent.check();
    assert.equal(await consent.isChecked(), true);
    await consent.uncheck();
    assert.equal(await consent.isChecked(), false);
    // Deliberately no submit action: browser QA must never insert real leads.
    await desktopPage.screenshot({ path: output + "/desktop-investor-consent-empty.png", animations: "disabled" });
  });

  await caseRun("no uncaught desktop hydration errors", async () => {
    assert.deepEqual(runtimeErrors, []);
  });

  await desktop.close();

  const fullMotionMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "no-preference",
    locale: "ar-SA",
  });
  const motionPage = await fullMotionMobile.newPage();
  await caseRun("mobile touch scrolling actually advances material and equipment", async () => {
    await openWithRetry(motionPage, baseURL);
    for (const [id, count, data] of [
      ["material-scroll-track", 3, "cinema-material-scene"],
      ["fleet-scroll-track", 4, "cinema-fleet-scene"],
    ]) {
      for (const scene of [0, count - 1]) {
        await motionPage.evaluate(({ id, count, scene }) => {
          const el = document.getElementById(id);
          if (!el) throw new Error("Scene missing: " + id);
          const bounds = el.getBoundingClientRect();
          const start = scrollY + bounds.top;
          window.scrollTo({ top: start + Math.max(0, bounds.height - innerHeight) * ((scene + .5) / count), behavior: "instant" });
        }, { id, count, scene });
        await motionPage.waitForFunction(({ key, scene }) =>
          document.querySelector(".presentation")?.getAttribute("data-" + key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())) === String(scene),
          { key: data, scene }, { timeout: 12000, polling: "raf" });
      }
    }
    assert.ok((await motionPage.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 5);
    await motionPage.screenshot({ path: output + "/mobile-live-scroll-scenes.png", animations: "disabled" });
  });

  await caseRun("real browser mobile swipe handlers preserve vertical page scroll", async () => {
    await openWithRetry(motionPage, baseURL);
    await motionPage.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    const hero = motionPage.locator(".hero-gallery");
    const dots = motionPage.locator(".hero-gallery__dots .hero-gallery__dot");
    assert.equal(await dots.count(), 10);
    const dot = await dots.first().boundingBox();
    assert.ok(dot && dot.width >= 24 && dot.height >= 30, "10 dots need substantial touch hit regions on a phone");
    const start = Number(await hero.getAttribute("data-hero-active"));

    async function dispatchSwipe(selector, fromX, toX, fromY, toY) {
      await motionPage.evaluate(({selector,fromX,toX,fromY,toY}) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error("Swipe target missing: " + selector);
        function touchAt(x,y) {
          return new Touch({ identifier: 1, target: element, clientX: x, clientY: y, pageX: x + scrollX, pageY: y + scrollY });
        }
        const start = touchAt(fromX, fromY), end = touchAt(toX, toY);
        element.dispatchEvent(new TouchEvent("touchstart", {
          bubbles: true, cancelable: true,
          touches: [start], targetTouches: [start], changedTouches: [start],
        }));
        element.dispatchEvent(new TouchEvent("touchend", {
          bubbles: true, cancelable: true,
          touches: [], targetTouches: [], changedTouches: [end],
        }));
      }, { selector, fromX, toX, fromY, toY });
    }

    await dispatchSwipe(".hero-cinematic", 300, 110, 330, 340);
    await motionPage.waitForFunction(previous =>
      Number(document.querySelector(".hero-gallery")?.getAttribute("data-hero-active")) === ((previous + 1) % 10),
      start, {timeout: 4500});
    assert.equal(await hero.getAttribute("data-hero-playing"), "false", "manual swipe should pause autoplay");
    const afterHorizontal = await hero.getAttribute("data-hero-active");
    await dispatchSwipe(".hero-cinematic", 260, 246, 250, 400);
    assert.equal(await hero.getAttribute("data-hero-active"), afterHorizontal, "vertical gestures must never change images");

    // Inspect the enlarged gallery in the same touch-enabled browser.
    const thumbnail = motionPage.locator(".gallery-image-button").first();
    await thumbnail.scrollIntoViewIfNeeded();
    await thumbnail.tap();
    const dialog = motionPage.locator("dialog.gallery-lightbox--native");
    await dialog.waitFor({state:"visible", timeout:9000});
    const firstLabel = await dialog.locator(".lightbox-toolbar .latin").innerText();
    await dispatchSwipe("dialog.gallery-lightbox .lightbox-content", 290, 110, 280, 290);
    await motionPage.waitForFunction(previous => 
      document.querySelector("dialog.gallery-lightbox .lightbox-toolbar .latin")?.textContent?.trim() !== previous.trim(),
      firstLabel, {timeout:4000});
    assert.equal(await dialog.getAttribute("data-lightbox-autoplay"), "paused", "manual lightbox swipe pauses playback");
    await dialog.getByRole("button", {name:"Close image"}).click();
    await dialog.waitFor({state:"hidden", timeout:4500});
    await motionPage.screenshot({path: output + "/mobile-swipe-controls.png",animations:"disabled"});
  });

  await fullMotionMobile.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
    locale: "ar-SA",
  });
  const mobilePage = await mobile.newPage();

  await caseRun("mobile reduced-motion static scenes and no horizontal overflow", async () => {
    await openWithRetry(mobilePage, baseURL);
    const state = await mobilePage.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      fogDisplay: getComputedStyle(document.querySelector(".cinema-atmosphere")).display,
      bridgePosition: getComputedStyle(document.querySelector(".cinematic-bridge__sticky")).position,
      headingPresent: Boolean(document.querySelector("#hero-title")?.textContent?.includes("Somman")),
    }));
    assert.ok(state.headingPresent, "mobile h1 should be available");
    assert.ok(state.overflow <= 5, "unexpected mobile horizontal overflow " + state.overflow);
    assert.equal(state.fogDisplay, "none");
    assert.notEqual(state.bridgePosition, "sticky");
    await mobilePage.screenshot({ path: output + "/mobile-reduced-motion.png", fullPage: false, animations: "disabled" });
    assert.equal(await mobilePage.locator(".hero-gallery").getAttribute("data-hero-playing"), "false");
    assert.ok(await mobilePage.locator(".hero-gallery__motion-toggle").isDisabled(), "no ineffective Play button under reduced motion");
    const initial = await mobilePage.locator(".hero-gallery").getAttribute("data-hero-active");
    assert.equal(initial, "0", "reduced motion must preserve the initial still hero frame");
    await mobilePage.locator(".hero-gallery__dots button").nth(5).tap();
    assert.equal(await mobilePage.locator(".hero-gallery").getAttribute("data-hero-active"), "5");
    assert.equal(await mobilePage.locator(".hero-gallery").getAttribute("data-hero-playing"), "false");
    const firstGallery = mobilePage.locator(".site-gallery .gallery-slider").first();
    await firstGallery.scrollIntoViewIfNeeded();
    assert.equal(await firstGallery.getAttribute("data-gallery-autoplay"), "paused");
    assert.ok(await firstGallery.locator(".gallery-slide-arrows button").last().isDisabled(), "gallery autoplay is disabled when motion is reduced");
    const quarries = mobilePage.locator(".quarry-cards");
    await quarries.scrollIntoViewIfNeeded();
    assert.equal(await quarries.getAttribute("data-quarry-gallery-autoplay"), "paused");
    assert.ok(await quarries.locator(".quarry-cards__autoplay-tools button").isDisabled(), "quarry autoplay disabled under reduced motion");

    // All remaining reduced-motion map / permit checks intentionally exercise
    // the persisted Arabic alternative after checking new English default.
    await mobilePage.getByRole("button", { name: "تغيير لغة الموقع إلى العربية" }).click();
    await mobilePage.waitForFunction(() => document.documentElement.lang === "ar");

  });

  await caseRun("mobile reference map and 3D hotspots remain usable with reduced motion", async () => {
    const location = mobilePage.locator(".somman-location-experience");
    await location.scrollIntoViewIfNeeded();
    const iframe = location.locator('iframe[title*="Google Maps"]');
    assert.equal(await iframe.count(), 1);
    const hotspot = location.getByRole("button", { name: "استعرض المرافق والخدمات في المشهد التصوري" });
    await hotspot.tap();
    assert.equal(await hotspot.getAttribute("aria-pressed"), "true");
    const state = await mobilePage.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      tilt: getComputedStyle(document.querySelector(".somman-location-experience__scene-camera")).transform,
    }));
    assert.ok(state.overflow <= 5, "mobile map panel added unexpected horizontal overflow " + state.overflow);
    await mobilePage.screenshot({ path: output + "/mobile-google-map-and-concept.png", animations: "disabled" });
  });

  await caseRun("mobile investor documents can be selected by touch", async () => {
    const studio = mobilePage.locator(".evidence-studio");
    await studio.scrollIntoViewIfNeeded();
    await studio.getByRole("button", { name: /الفحص النافي للجهالة/ }).tap();
    assert.ok(await studio.locator(".evidence-studio__check-detail").isVisible());
    assert.equal(await studio.getByRole("button", { name: /الفحص النافي للجهالة/ }).getAttribute("aria-pressed"), "true");
  });

  await caseRun("mobile reduced motion keeps manual material/fleet and quarry choices", async () => {
    const material = mobilePage.locator(".production-flow--story");
    await material.scrollIntoViewIfNeeded();
    assert.notEqual(await material.locator(".production-flow__story").evaluate((el) => getComputedStyle(el).position), "sticky");
    const lastMaterial = material.locator(".production-flow__step").last();
    await lastMaterial.tap();
    assert.equal(await lastMaterial.getAttribute("aria-pressed"), "true");
    assert.equal(await material.locator(".production-flow__photo.is-active").count(), 1);

    const fleet = mobilePage.locator("#equipment-experience");
    await fleet.scrollIntoViewIfNeeded();
    assert.notEqual(await fleet.locator(".fleet-experience__composition").evaluate((el) => getComputedStyle(el).position), "sticky");
    const generators = fleet.locator(".fleet-experience__selector").last();
    await generators.tap();
    assert.equal(await generators.getAttribute("aria-pressed"), "true");

    const quarry = mobilePage.locator(".quarry-cards");
    await quarry.scrollIntoViewIfNeeded();
    const birzeit = quarry.getByRole("button", { name: "عرض ملف محجر بير زيت" });
    await birzeit.tap();
    assert.equal(await birzeit.getAttribute("aria-pressed"), "true");
    const width = await mobilePage.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(width <= 5, "page overflows narrow mobile viewport: " + width);
    await mobilePage.screenshot({ path: output + "/mobile-storytelling-reduced-motion.png", animations: "disabled" });
  });

  await mobile.close();

  await caseRun("phone, 200%-zoom-equivalent and tablet layouts preserve scroll chapter controls", async () => {
    // 683 CSS px approximates the layout viewport seen at 200% browser zoom
    // from a 1366px desktop, while 768px exercises the tablet breakpoint.
    for (const [width, height] of [[320, 568], [360, 640], [390, 720], [683, 450], [768, 1024]]) {
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: "no-preference",
        hasTouch: width < 400,
        isMobile: width < 400,
        deviceScaleFactor: 1,
        locale: "ar-SA",
      });
      try {
        const page = await context.newPage();
        await openWithRetry(page, baseURL);
        const measured = await page.evaluate(() => {
          function item(selector) {
            const element = document.querySelector(selector);
            if (!element) throw new Error("Missing story element: " + selector);
            return {
              visible: element.getBoundingClientRect().width > 0,
              client: element.clientHeight,
              content: element.scrollHeight,
              overflow: getComputedStyle(element).overflowY,
            };
          }
          return {
            htmlOverflow: document.documentElement.scrollWidth - innerWidth,
            material: item(".production-flow__navigation"),
            equipment: item(".fleet-experience__console"),
          };
        });
        assert.ok(measured.htmlOverflow <= 5, width + "x" + height + " horizontal overflow: " + JSON.stringify(measured));
        const skip = page.locator(".production-flow__visual-marker");
        assert.ok(await skip.isVisible(), width + "x" + height + " material skip control hidden");
        assert.equal(await skip.getAttribute("href"), "#equipment-title");
        for (const [label, item] of [["material", measured.material], ["equipment", measured.equipment]]) {
          assert.ok(item.visible && item.client > 0, width + "x" + height + " " + label + " missing");
          assert.ok(item.content <= item.client + 4 || ["auto", "scroll"].includes(item.overflow), 
            width + "x" + height + " " + label + " clipped (" + item.content + " > " + item.client + ", overflow=" + item.overflow + ")");
        }
        await page.screenshot({
          path: output + "/layout-" + width + "x" + height + ".png",
          animations: "disabled",
        });
      } finally {
        await context.close();
      }
    }
  });

  console.log("[BROWSER] " + results.length + " checks passed.");
  await writeFile(output + "/result.json", JSON.stringify({ baseURL, results }, null, 2));
} catch (error) {
  results.push({ status: "FAIL", error: String(error) });
  await writeFile(output + "/result.json", JSON.stringify({ baseURL, results }, null, 2));
  console.error("[BROWSER] FAILED", error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
