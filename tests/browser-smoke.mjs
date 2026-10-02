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

  await caseRun("question suggestions are readable grouped actions", async () => {
    const qa = desktopPage.locator(".assistant-panel");
    await qa.scrollIntoViewIfNeeded();
    const chips = qa.locator(".assistant-suggestions button");
    assert.equal(await chips.count(), 4);
    assert.ok(await chips.first().isVisible());
    assert.ok((await chips.first().boundingBox())?.height >= 45);
    await desktopPage.screenshot({ path: output + "/desktop-question-prompts.png", animations: "disabled" });
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
