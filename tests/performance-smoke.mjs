/**
 * Read-only Chromium performance diagnostics.
 *
 * This intentionally records metrics instead of enforcing hard CI score
 * thresholds: GitHub-hosted runner noise is too high for release gating.
 * The JSON artifact provides comparable trend evidence for LCP, CLS,
 * interaction timing, long tasks and representative scroll frame pacing.
 */
import assert from "node:assert/strict";
import { mediaContext } from "./site-media-fixture.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const modulePath = process.env.PLAYWRIGHT_MODULE_PATH ?? "/tmp/somman-browser-qa/node_modules/playwright/index.mjs";
const { chromium } = await import(pathToFileURL(modulePath).href);
const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const output = process.env.QA_OUTPUT_DIR ?? "/tmp/somman-browser-artifacts";
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const context = await mediaContext(browser, {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  reducedMotion: "no-preference",
  locale: "en-US",
});

const page = await context.newPage();
const runtimeErrors = [];
page.on("pageerror", error => runtimeErrors.push(error.message));

await page.addInitScript(() => {
  window.__sommanPerf = {
    lcpMs: null,
    cls: 0,
    eventDurations: [],
    longTasks: [],
  };

  try {
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      const latest = entries.at(-1);
      if (latest) window.__sommanPerf.lcpMs = latest.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}

  try {
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__sommanPerf.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}

  try {
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.interactionId) {
          window.__sommanPerf.eventDurations.push({
            name: entry.name,
            duration: entry.duration,
            interactionId: entry.interactionId,
          });
        }
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 16 });
  } catch {}

  try {
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        window.__sommanPerf.longTasks.push({
          startTime: entry.startTime,
          duration: entry.duration,
        });
      }
    }).observe({ type: "longtask", buffered: true });
  } catch {}
});

const cdp = await context.newCDPSession(page);
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 100,
  downloadThroughput: 800_000,
  uploadThroughput: 400_000,
  connectionType: "cellular4g",
});
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

const response = await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 60_000 });
assert.ok(response && response.status() < 500, "performance page failed to load");

// Performance runs use Vite's dev server in CI, where network throttling also
// slows the development module graph. Wait for the first real interactive
// control instead of relying on the cinematic director's internal RAF marker.
const heroDots = page.locator(".hero-gallery__dots button");
await heroDots.first().waitFor({ state: "visible", timeout: 90_000 });
await page.waitForTimeout(2_500);
const cinemaReadyObserved = await page.locator('[data-cinema-ready="true"]').count() > 0;

// Create a few real user interactions so Event Timing can expose an INP candidate.
for (const index of [1, 2, 3, 4]) {
  await heroDots.nth(index).click();
  await page.waitForTimeout(120);
}

// Representative scroll-frame trace through the long-form presentation.
const frameTrace = await page.evaluate(async () => {
  window.scrollTo({ top: 0, behavior: "instant" });
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const samples = [];
  let frame = 0;
  let last = performance.now();

  await new Promise(resolve => {
    function tick(now) {
      samples.push(now - last);
      last = now;
      frame += 1;
      const progress = Math.min(1, frame / 120);
      window.scrollTo({ top: maxScroll * progress, behavior: "instant" });
      if (frame < 120) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
  return samples;
});

await page.waitForTimeout(500);

const metrics = await page.evaluate(() => {
  const data = window.__sommanPerf;
  const navigation = performance.getEntriesByType("navigation")[0];
  const interactions = data.eventDurations ?? [];
  const inpCandidateMs = interactions.length
    ? Math.max(...interactions.map(item => item.duration))
    : null;

  return {
    lcpMs: data.lcpMs,
    cls: data.cls,
    inpCandidateMs,
    interactionSamples: interactions.length,
    longTaskCount: data.longTasks.length,
    longTaskTotalMs: data.longTasks.reduce((sum, item) => sum + item.duration, 0),
    navigation: navigation ? {
      domContentLoadedMs: navigation.domContentLoadedEventEnd,
      loadEventMs: navigation.loadEventEnd,
      transferSize: navigation.transferSize,
      encodedBodySize: navigation.encodedBodySize,
      decodedBodySize: navigation.decodedBodySize,
    } : null,
  };
});

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
  return sorted[index];
}

const scroll = {
  samples: frameTrace.length,
  averageFrameMs: frameTrace.reduce((sum, value) => sum + value, 0) / frameTrace.length,
  p50FrameMs: percentile(frameTrace, 0.50),
  p95FrameMs: percentile(frameTrace, 0.95),
  p99FrameMs: percentile(frameTrace, 0.99),
  framesOver32ms: frameTrace.filter(value => value > 32).length,
  framesOver50ms: frameTrace.filter(value => value > 50).length,
};

assert.ok(Number.isFinite(metrics.lcpMs) && metrics.lcpMs > 0, "LCP was not observed");
assert.ok(Number.isFinite(metrics.cls) && metrics.cls >= 0, "CLS was not observed");
assert.ok(frameTrace.length >= 100, "scroll frame trace was incomplete");
assert.deepEqual(runtimeErrors, [], "uncaught runtime errors during performance diagnostic");

const report = {
  generatedAt: new Date().toISOString(),
  baseURL,
  profile: {
    viewport: "390x844",
    cpuThrottlingRate: 4,
    network: {
      latencyMs: 100,
      downloadBytesPerSecond: 800_000,
      uploadBytesPerSecond: 400_000,
      connectionType: "cellular4g",
    },
  },
  metrics,
  scroll,
  cinemaReadyObserved,
  note: "Diagnostic trend data only; this is a moderate 4G-like CI profile and GitHub-hosted runner variance makes hard performance thresholds inappropriate.",
};

await page.screenshot({
  path: output + "/performance-throttled-mobile.png",
  fullPage: false,
  animations: "disabled",
});
await writeFile(output + "/performance.json", JSON.stringify(report, null, 2));
console.log("[PERF] " + JSON.stringify(report));

await context.close();
await browser.close();
