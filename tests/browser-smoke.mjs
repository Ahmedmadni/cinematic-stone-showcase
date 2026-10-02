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


  await caseRun("floating language control translates the entire site and persists choice", async () => {
    const lang = desktopPage.getByRole("button", { name: "Switch website to English" });
    assert.ok(await lang.isVisible());
    await lang.click();
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


  await caseRun("hero clarity and genuine scroll-driven zigzag masks", async () => {
    await openWithRetry(desktopPage, baseURL);
    const hero = desktopPage.locator(".hero-media img");
    await hero.waitFor({ state: "visible" });
    const heroState = await hero.evaluate((image) => ({
      loaded: image instanceof HTMLImageElement && image.complete && image.naturalWidth >= 1200,
      width: image instanceof HTMLImageElement ? image.naturalWidth : 0,
      objectFit: getComputedStyle(image).objectFit,
      visible: getComputedStyle(image).visibility,
    }));
    assert.ok(heroState.loaded, "hero photograph must decode at its original sharp resolution: " + JSON.stringify(heroState));
    assert.equal(heroState.objectFit, "cover");
    assert.equal(heroState.visible, "visible");

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

  await caseRun("short smartphone and narrow zoom layout preserve scroll chapter controls", async () => {
    for (const [width, height] of [[320, 568], [360, 640], [390, 720], [680, 450]]) {
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
