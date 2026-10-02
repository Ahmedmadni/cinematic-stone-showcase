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

  await caseRun("desktop RTL and investor content", async () => {
    await openWithRetry(desktopPage, baseURL);
    assert.equal(await desktopPage.locator(".presentation").getAttribute("dir"), "rtl");
    assert.ok(await desktopPage.locator("#hero-title").isVisible());
    assert.ok(await desktopPage.locator("#cinematic-bridge").count() === 1);
    assert.ok(await desktopPage.locator("#التواصل").count() === 1);
    await desktopPage.screenshot({ path: output + "/desktop-hero.png", animations: "disabled" });
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

  await caseRun("native gallery Escape/arrow keys and focus restoration", async () => {
    const button = desktopPage.locator(".gallery-image-button").first();
    await button.scrollIntoViewIfNeeded();
    await button.click();
    const dialog = desktopPage.locator("dialog.gallery-lightbox--native");
    await dialog.waitFor({ state: "visible", timeout: 8000 });
    assert.equal(await desktopPage.evaluate(() => document.activeElement?.getAttribute("aria-label")), "إغلاق الصورة");
    await desktopPage.keyboard.press("ArrowLeft");
    assert.match(await dialog.locator(".lightbox-toolbar").innerText(), /02\s*\/\s*02/);
    await desktopPage.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden", timeout: 8000 });
    assert.ok(await button.evaluate((element) => document.activeElement === element), "focus must return to the original photo button");
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

  await caseRun("no uncaught desktop hydration errors", async () => {
    assert.deepEqual(runtimeErrors, []);
  });

  await desktop.close();

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
      headingPresent: Boolean(document.querySelector("#hero-title")?.textContent?.includes("الصمان")),
    }));
    assert.ok(state.headingPresent, "mobile h1 should be available");
    assert.ok(state.overflow <= 5, "unexpected mobile horizontal overflow " + state.overflow);
    assert.equal(state.fogDisplay, "none");
    assert.notEqual(state.bridgePosition, "sticky");
    await mobilePage.screenshot({ path: output + "/mobile-reduced-motion.png", fullPage: false, animations: "disabled" });
  });

  await caseRun("mobile investor documents can be selected by touch", async () => {
    const studio = mobilePage.locator(".evidence-studio");
    await studio.scrollIntoViewIfNeeded();
    await studio.getByRole("button", { name: /الفحص النافي للجهالة/ }).tap();
    assert.ok(await studio.locator(".evidence-studio__check-detail").isVisible());
    assert.equal(await studio.getByRole("button", { name: /الفحص النافي للجهالة/ }).getAttribute("aria-pressed"), "true");
  });

  await mobile.close();

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
