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


  await caseRun("four fleet chapters scrub on native desktop scroll", async () => {
    const track = desktopPage.locator("#fleet-scroll-track");
    const stage = desktopPage.locator("#equipment-experience");
    assert.ok(await track.count() === 1);
    for (let index = 0; index < 4; index++) {
      await desktopPage.evaluate((scene) => {
        const node = document.getElementById("fleet-scroll-track");
        if (!node) throw new Error("Fleet scroll track is missing");
        const rect = node.getBoundingClientRect();
        const start = window.scrollY + rect.top;
        const travel = rect.height - window.innerHeight;
        window.scrollTo({ top: start + travel * ((scene + .5) / 4), behavior: "instant" });
      }, index);
      await desktopPage.waitForFunction((scene) =>
        document.querySelector(".presentation")?.getAttribute("data-cinema-fleet-scene") === String(scene)
        && document.querySelectorAll("#equipment-experience .fleet-experience__selector.is-selected")[0]
          === document.querySelectorAll("#equipment-experience .fleet-experience__selector")[scene],
        index, { timeout: 12000, polling: "raf" });
      assert.equal(await stage.locator(".fleet-experience__image.is-active").count(), 1);
      assert.equal(await stage.locator(".fleet-experience__selector").nth(index).getAttribute("aria-pressed"), "true");
      assert.match(await stage.locator(".fleet-experience__counter").innerText(), new RegExp("المشهد " + (index + 1) + " من 4"));
      if (index === 1 || index === 3) {
        await desktopPage.screenshot({
          path: output + "/desktop-fleet-scene-" + (index + 1) + ".png",
          animations: "disabled",
        });
      }
    }
    assert.equal(await stage.locator(".fleet-experience__composition").evaluate(
      (element) => getComputedStyle(element).position
    ), "sticky");
  });

  await caseRun("fleet chapter buttons navigate back without hijacking scroll", async () => {
    const first = desktopPage.locator("#equipment-experience .fleet-experience__selector").first();
    await first.click();
    await desktopPage.waitForFunction(() =>
      document.querySelector(".presentation")?.getAttribute("data-cinema-fleet-scene") === "0"
      && document.querySelector("#equipment-experience .fleet-experience__selector")?.getAttribute("aria-pressed") === "true",
      null, { timeout: 13000, polling: "raf" });
    const p = await desktopPage.locator(".presentation").evaluate((root) =>
      Number.parseFloat(getComputedStyle(root).getPropertyValue("--cinema-fleet-progress"))
    );
    assert.ok(p >= 0 && p < .25, "manual navigation should land inside first scene, got " + p);
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


  const touchMotion = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "no-preference",
    locale: "ar-SA",
  });
  const touchMotionPage = await touchMotion.newPage();
  await caseRun("mobile touch scroll changes equipment chapters", async () => {
    await openWithRetry(touchMotionPage, baseURL);
    for (const index of [1, 3]) {
      await touchMotionPage.evaluate((scene) => {
        const track = document.getElementById("fleet-scroll-track");
        if (!track) throw new Error("Mobile fleet track missing");
        const r = track.getBoundingClientRect();
        const start = window.scrollY + r.top;
        const travel = r.height - window.innerHeight;
        window.scrollTo({ top: start + travel * ((scene + .5) / 4), behavior: "instant" });
      }, index);
      await touchMotionPage.waitForFunction((scene) =>
        document.querySelector(".presentation")?.getAttribute("data-cinema-fleet-scene") === String(scene)
        && document.querySelectorAll(".fleet-experience__selector.is-selected")[0]
          === document.querySelectorAll(".fleet-experience__selector")[scene],
        index, { timeout: 12000, polling: "raf" });
    }
    const state = await touchMotionPage.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      sticky: getComputedStyle(document.querySelector(".fleet-experience__composition")).position,
    }));
    assert.ok(state.overflow <= 5, "mobile fleet introduced horizontal overflow " + state.overflow);
    assert.equal(state.sticky, "sticky");
    await touchMotionPage.screenshot({ path: output + "/mobile-fleet-scroll.png", animations: "disabled" });
  });
  await touchMotion.close();

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


  await caseRun("reduced-motion equipment remains manually selectable without pinning", async () => {
    const section = mobilePage.locator("#equipment-experience");
    await section.scrollIntoViewIfNeeded();
    assert.notEqual(await section.locator(".fleet-experience__composition").evaluate(
      (element) => getComputedStyle(element).position
    ), "sticky");
    const last = section.locator(".fleet-experience__selector").nth(3);
    await last.tap();
    assert.equal(await last.getAttribute("aria-pressed"), "true");
    assert.match(await section.locator(".fleet-experience__detail").innerText(), /مولدات/);
    assert.equal(await section.locator(".fleet-experience__image.is-active").count(), 1);
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
