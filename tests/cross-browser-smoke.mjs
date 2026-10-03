/**
 * Focused Firefox / WebKit cross-engine release smoke tests.
 *
 * This deliberately complements rather than duplicates the 25-case Chromium
 * suite. It never submits investor leads and never invokes the paid AI gateway.
 * Playwright is installed in a throwaway CI directory to preserve bun.lock.
 */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const engineName = process.env.CROSS_BROWSER_ENGINE;
if (!["firefox", "webkit"].includes(engineName)) {
  throw new Error("CROSS_BROWSER_ENGINE must be firefox or webkit");
}
const playwrightPath = process.env.PLAYWRIGHT_MODULE_PATH
  ?? "/tmp/somman-cross-browser/node_modules/playwright/index.mjs";
const { firefox, webkit } = await import(pathToFileURL(playwrightPath).href);
const engine = engineName === "firefox" ? firefox : webkit;
const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const output = (process.env.QA_OUTPUT_DIR ?? "/tmp/somman-cross-browser-artifacts") + "/" + engineName;
const results = [];
await mkdir(output, { recursive: true });

const browser = await engine.launch({ headless: true });
async function visit(page) {
  let previousError;
  for (let attempt = 0; attempt < 18; attempt++) {
    try {
      const response = await page.goto(baseURL, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });
      if (!response || response.status() >= 500) {
        throw new Error("HTTP " + (response?.status() ?? "no response"));
      }
      await page.locator('[data-cinema-ready="true"]').waitFor({
        state: "attached",
        timeout: 24000,
      });
      return;
    } catch (error) {
      previousError = error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error("Cross-browser site never hydrated: " + previousError);
}
async function check(name, fn) {
  console.log("[CROSS-" + engineName + "] " + name + ": START");
  await fn();
  results.push({ name, status: "PASS" });
  console.log("[CROSS-" + engineName + "] " + name + ": PASS");
}

try {
  const desktop = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
    locale: "en-US",
  });
  const page = await desktop.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await check("English-first SSR and core structure", async () => {
    await visit(page);
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
    assert.equal(await page.locator("html").getAttribute("dir"), "ltr");
    assert.match(await page.title(), /Al Somman/i);
    assert.match(await page.locator('meta[name="description"]').first().getAttribute("content") ?? "", /Somman/i);
    assert.ok(await page.locator("#hero-title").isVisible());
    assert.equal(await page.locator(".site-gallery .gallery-slider").count(), 6);
    assert.equal(await page.locator(".hero-gallery__dots button").count(), 10);
    assert.equal(await page.locator(".somman-floating-tools button").count(), 2);
    assert.equal(await page.locator(".hero-gallery").getAttribute("data-hero-playing"), "false");
    await page.screenshot({
      path: output + "/01-english-desktop.png",
      animations: "disabled",
    });
  });

  await check("RTL switch and persisted language across navigation", async () => {
    await page.getByRole("button", { name: "تغيير لغة الموقع إلى العربية" }).click();
    await page.waitForFunction(() =>
      document.documentElement.lang === "ar" &&
      document.documentElement.dir === "rtl",
      null, { timeout: 6500 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator('[data-cinema-ready="true"]').waitFor({ state: "attached", timeout: 17000 });
    await page.waitForFunction(() => document.documentElement.lang === "ar", null, { timeout: 8000 });
    assert.equal(await page.locator(".presentation").getAttribute("dir"), "rtl");
    await page.getByRole("button", { name: "Switch website to English" }).click();
    await page.waitForFunction(() => document.documentElement.lang === "en", null, { timeout: 8000 });
  });

  await check("Ten separate photos and manual reduced-motion slideshow navigation", async () => {
    const hero = page.locator(".hero-gallery");
    const dots = page.locator(".hero-gallery__dots button");
    await dots.nth(4).click();
    assert.equal(await hero.getAttribute("data-hero-active"), "4");
    assert.equal(await hero.getAttribute("data-hero-playing"), "false");
    assert.equal(await hero.locator(".hero-gallery__photo--active").count(), 1);
    assert.ok(await page.locator(".hero-gallery__motion-toggle").isDisabled());
    await page.screenshot({
      path: output + "/02-manual-slide.png",
      animations: "disabled",
    });
  });

  await check("Native modal lightbox controls and Escape", async () => {
    const button = page.locator(".gallery-image-button").first();
    await button.scrollIntoViewIfNeeded();
    await button.click();
    const dialog = page.locator("dialog.gallery-lightbox--native");
    await dialog.waitFor({ state: "visible", timeout: 8000 });
    assert.equal(await dialog.evaluate(el => el instanceof HTMLDialogElement && el.open), true);
    assert.equal(await dialog.locator(".lightbox-controls button").count(), 2);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden", timeout: 7000 });
  });

  await check("No unprompted messages and investor consent remains unchecked", async () => {
    const form = page.locator(".inquiry-panel form");
    await form.scrollIntoViewIfNeeded();
    assert.equal(await form.count(), 1);
    const checkbox = form.locator("#inquiry-consent");
    assert.equal(await checkbox.isChecked(), false);
    assert.ok(await checkbox.isVisible());
    await checkbox.check();
    assert.equal(await checkbox.isChecked(), true);
    await checkbox.uncheck();
    assert.equal(await checkbox.isChecked(), false);
    assert.equal(await form.locator('button[type="submit"]').count(), 1);
    // No form submit or real name/email entry in CI.
  });

  await check("Assistant drawer opens and closes without paid model call", async () => {
    await page.locator(".somman-tool--assistant").click();
    const panel = page.locator("#somman-assistant-drawer");
    assert.ok(await panel.isVisible());
    assert.equal(await panel.locator(".assistant-suggestions button").count(), 4);
    await panel.locator(".somman-assistant-close").click();
    assert.equal(await panel.isVisible(), false);
  });
  await check("Desktop hydration has no uncaught JS errors", async () => {
    assert.deepEqual(errors, []);
  });
  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 360, height: 780 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    locale: "en-US",
  });
  const mobilePage = await mobile.newPage();
  await check("360px mobile touch controls and stable viewport", async () => {
    await visit(mobilePage);
    const diagnostics = await mobilePage.evaluate(() => ({
      overhang: document.documentElement.scrollWidth - innerWidth,
      activePhoto: document.querySelector(".hero-gallery")?.getAttribute("data-hero-active"),
      paused: document.querySelector(".hero-gallery")?.getAttribute("data-hero-playing"),
    }));
    assert.ok(diagnostics.overhang <= 8, "Horizontal scrolling on phone: " + JSON.stringify(diagnostics));
    assert.equal(diagnostics.paused, "false");
    const dots = mobilePage.locator(".hero-gallery__dots button");
    assert.equal(await dots.count(), 10);
    const bounds = await dots.first().boundingBox();
    assert.ok(bounds && bounds.width >= 24 && bounds.height >= 30);
    await dots.nth(2).tap();
    assert.equal(await mobilePage.locator(".hero-gallery").getAttribute("data-hero-active"), "2");
    await mobilePage.screenshot({
      path: output + "/03-mobile-gallery.png",
      animations: "disabled",
    });
  });

  console.log("[CROSS-" + engineName + "] " + results.length + " checks passed.");
  await writeFile(output + "/result.json", JSON.stringify({
    engine: engineName, baseURL, results,
  }, null, 2));
  await mobile.close();
} catch (error) {
  results.push({ status: "FAIL", error: String(error) });
  await writeFile(output + "/result.json", JSON.stringify({
    engine: engineName, baseURL, results,
  }, null, 2));
  console.error("[CROSS-" + engineName + "] FAILED", error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
