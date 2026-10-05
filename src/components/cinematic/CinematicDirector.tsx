import { useEffect } from "react";
import {
  clampUnit,
  fleetLocalProgress,
  fleetSceneIndex,
  normalizedPointer,
  pinnedProgress,
  segmentProgress,
  signedPointer,
  smoothStep,
} from "@/lib/cinematic-progress";

const POINTER_DAMPING = 0.08;
const POINTER_SETTLE_EPSILON = 0.002;

/**
 * One native-scroll cinematic director for all chapters.
 *
 * - Scroll and pointer events are passive and coalesced into a single rAF.
 * - Every position is clamped, preventing extreme camera moves.
 * - Fine-pointer effects turn off on touch and reduced-motion devices.
 * - Works without new animation packages, page scroll interception, or timers.
 */
export function CinematicDirector() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".presentation");
    const hero = document.getElementById("البداية");
    const bridge = document.getElementById("cinematic-bridge");
    const fleet = document.getElementById("equipment-experience");
    const fleetTrack = document.getElementById("fleet-scroll-track");
    const materialTrack = document.getElementById("material-scroll-track");
    const atlas = document.querySelector<HTMLElement>(".quarry-atlas");
    const magneticLink = document.querySelector<HTMLElement>(".hero-discover");
    const evidence = document.querySelector<HTMLElement>(".evidence-studio__stage");
    if (!root || !hero || !bridge) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let active = true;
    let pointerX = 0;
    let pointerY = 0;
    let smoothedPointerX = 0;
    let smoothedPointerY = 0;
    let hasPointer = false;
    let observerReady = false;
    let heroProgressCache = 0;
    let bridgeProgressCache = 0;
    let fleetProgressCache = 0;
    let lastFleetScene = -1;
    let materialProgressCache = 0;
    let lastMaterialScene = -1;
    const nearViewport = new Set<Element>();
    const scenes = [hero, bridge, fleet, fleetTrack, materialTrack, atlas, evidence].filter((node): node is HTMLElement => node !== null);
    const shouldMeasure = (node: Element | null) => Boolean(node && (!observerReady || nearViewport.has(node)));

    const sceneEntry = (rect: DOMRect | undefined): number =>
      rect
        ? clampUnit((window.innerHeight - rect.top) / Math.max(1, rect.height + window.innerHeight))
        : 0;

    function update() {
      frame = 0;
      if (!root || !hero || !bridge || !active || document.hidden) return;

      const reduced = motion.matches;
      const pointerActive = !reduced && finePointer.matches && hasPointer;
      const heroRect = shouldMeasure(hero) ? hero.getBoundingClientRect() : undefined;
      const bridgeRect = shouldMeasure(bridge) ? bridge.getBoundingClientRect() : undefined;
      const fleetRect = shouldMeasure(fleet) ? fleet?.getBoundingClientRect() : undefined;
      const fleetTrackRect = shouldMeasure(fleetTrack) ? fleetTrack?.getBoundingClientRect() : undefined;
      const materialTrackRect = shouldMeasure(materialTrack) ? materialTrack?.getBoundingClientRect() : undefined;
      const atlasRect = shouldMeasure(atlas) ? atlas?.getBoundingClientRect() : undefined;
      const evidenceRect = shouldMeasure(evidence) ? evidence?.getBoundingClientRect() : undefined;

      const heroProgress = reduced ? 0 : heroRect ? clampUnit(-heroRect.top / Math.max(heroRect.height * 0.85, 1)) : heroProgressCache;
      const bridgeProgress = reduced ? 0 : bridgeRect ? pinnedProgress(bridgeRect.top, bridgeRect.height, window.innerHeight) : bridgeProgressCache;
      heroProgressCache = heroProgress;
      bridgeProgressCache = bridgeProgress;

      const fleetCount = 4;
      const fleetProgress = reduced ? 0 : fleetTrackRect
        ? pinnedProgress(fleetTrackRect.top, fleetTrackRect.height, window.innerHeight)
        : fleetProgressCache;
      fleetProgressCache = fleetProgress;
      const fleetLocal = fleetLocalProgress(fleetProgress, fleetCount);
      // Only notify React on chapter boundaries: intermediate frames stay in CSS.
      if (!reduced && fleetTrackRect) {
        const fleetScene = fleetSceneIndex(fleetProgress, fleetCount);
        if (fleetScene !== lastFleetScene) {
          lastFleetScene = fleetScene;
          root.dataset["cinemaFleetScene"] = String(fleetScene);
          window.dispatchEvent(new CustomEvent("somman:fleet-scene", { detail: { index: fleetScene, progress: fleetProgress } }));
        }
      }

      const materialCount = 3;
      const materialProgress = reduced ? 0 : materialTrackRect
        ? pinnedProgress(materialTrackRect.top, materialTrackRect.height, window.innerHeight)
        : materialProgressCache;
      materialProgressCache = materialProgress;
      const materialLocal = fleetLocalProgress(materialProgress, materialCount);
      if (!reduced && materialTrackRect) {
        const materialScene = fleetSceneIndex(materialProgress, materialCount);
        if (materialScene !== lastMaterialScene) {
          lastMaterialScene = materialScene;
          root.dataset["cinemaMaterialScene"] = String(materialScene);
          window.dispatchEvent(new CustomEvent("somman:material-scene", { detail: { index: materialScene } }));
        }
      }

      const portal = reduced ? 1 : smoothStep(segmentProgress(bridgeProgress, 0.17, 0.83));
      const firstCaption = reduced ? 0 : 1 - smoothStep(segmentProgress(bridgeProgress, 0.08, 0.40));
      const secondCaption = reduced ? 1 : smoothStep(segmentProgress(bridgeProgress, 0.57, 0.88));
      const totalScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

      const targetPointerX = pointerActive ? signedPointer(pointerX, 0, window.innerWidth) : 0;
      const targetPointerY = pointerActive ? signedPointer(pointerY, 0, window.innerHeight) : 0;
      const damping = reduced ? 1 : POINTER_DAMPING;
      smoothedPointerX += (targetPointerX - smoothedPointerX) * damping;
      smoothedPointerY += (targetPointerY - smoothedPointerY) * damping;

      // Keep photographic parallax intentionally restrained. The pointer is
      // eased over several frames instead of snapping directly to the cursor,
      // which keeps the investor presentation calm during quick mouse moves.
      const px = smoothedPointerX;
      const py = smoothedPointerY;
      const heroX = 55 + px * 8;
      const heroY = 47 + py * 6;
      const fleetX = 50 + px * 7;
      const fleetY = 50 + py * 5;
      const evidenceX = 58 + px * 7;
      const evidenceY = 36 + py * 5;
      const bridgeMaskX = bridgeRect && Math.abs(bridgeRect.top) < window.innerHeight * 2
        ? 54 + px * 1.5 : 54;

      let magneticX = 0;
      let magneticY = 0;
      if (pointerActive && magneticLink) {
        const rect = magneticLink.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(pointerX - centerX, pointerY - centerY);
        if (distance < Math.max(rect.width, rect.height) / 2 + 40) {
          magneticX = Math.max(-12, Math.min(12, (pointerX - centerX) * 0.12));
          magneticY = Math.max(-8, Math.min(8, (pointerY - centerY) * 0.12));
        }
      }

      root.style.setProperty("--cinema-hero-progress", heroProgress.toFixed(4));
      root.style.setProperty("--cinema-bridge-progress", bridgeProgress.toFixed(4));
      root.style.setProperty("--cinema-portal", portal.toFixed(4));
      root.style.setProperty("--cinema-intro-caption", firstCaption.toFixed(4));
      root.style.setProperty("--cinema-outro-caption", secondCaption.toFixed(4));
      root.style.setProperty("--cinema-scroll-progress", clampUnit(window.scrollY / totalScroll).toFixed(4));
      root.style.setProperty("--cinema-material-progress", materialProgress.toFixed(4));
      root.style.setProperty("--cinema-material-local", materialLocal.toFixed(4));
      root.style.setProperty("--cinema-material-scale", (reduced ? 1 : 1.065 - smoothStep(materialLocal) * .025).toFixed(4));
      root.style.setProperty("--cinema-fleet-progress", fleetProgress.toFixed(4));
      root.style.setProperty("--cinema-fleet-local-progress", fleetLocal.toFixed(4));
      root.style.setProperty("--cinema-fleet-scale", (reduced ? 1 : 1.075 - smoothStep(fleetLocal) * 0.03).toFixed(4));
      root.style.setProperty("--cinema-territory-scale", (reduced ? 1 : 1.045 - sceneEntry(atlasRect) * 0.03).toFixed(4));
      root.style.setProperty("--cinema-mask-x", bridgeMaskX.toFixed(2) + "%");
      root.style.setProperty("--cinema-fog-strength", (reduced ? 0 : 0.12 + smoothStep(segmentProgress(bridgeProgress, 0.12, 0.86)) * 0.2).toFixed(3));
      root.style.setProperty("--pointer-x", (px * 8).toFixed(2) + "px");
      root.style.setProperty("--pointer-y", (py * 6).toFixed(2) + "px");
      root.style.setProperty("--cinema-fog-x", (px * 9).toFixed(2) + "px");
      root.style.setProperty("--cinema-fog-y", (py * 5).toFixed(2) + "px");
      root.style.setProperty("--cinema-hero-pointer-x", heroX.toFixed(2) + "%");
      root.style.setProperty("--cinema-hero-pointer-y", heroY.toFixed(2) + "%");
      root.style.setProperty("--cinema-fleet-pointer-x", fleetX.toFixed(2) + "%");
      root.style.setProperty("--cinema-fleet-pointer-y", fleetY.toFixed(2) + "%");
      root.style.setProperty("--cinema-evidence-x", evidenceX.toFixed(2) + "%");
      root.style.setProperty("--cinema-evidence-y", evidenceY.toFixed(2) + "%");
      root.style.setProperty("--cinema-fleet-mouse-x", (px * 4).toFixed(2) + "px");
      root.style.setProperty("--cinema-fleet-mouse-y", (py * 3).toFixed(2) + "px");
      root.style.setProperty("--cinema-cta-x", magneticX.toFixed(2) + "px");
      root.style.setProperty("--cinema-cta-y", magneticY.toFixed(2) + "px");
      root.dataset["cinemaReady"] = "true";
      root.dataset["cinemaMotion"] = reduced ? "reduced" : "full";
      root.dataset["cinemaPointer"] = pointerActive ? "active" : "off";
      root.dataset["cinemaBridgeVisible"] = shouldMeasure(bridge) ? "true" : "false";

      const pointerNeedsSettling = !reduced && (
        Math.abs(targetPointerX - smoothedPointerX) > POINTER_SETTLE_EPSILON ||
        Math.abs(targetPointerY - smoothedPointerY) > POINTER_SETTLE_EPSILON
      );
      if (pointerNeedsSettling && active && !document.hidden) {
        frame = window.requestAnimationFrame(update);
      }
    }

    function schedule() {
      if (frame || document.hidden || !active) return;
      frame = window.requestAnimationFrame(update);
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !finePointer.matches) return;
      if (observerReady && ![hero, bridge, fleet, evidence].some((node) => node && nearViewport.has(node))) return;
      hasPointer = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      schedule();
    }

    function resetPointer() {
      hasPointer = false;
      schedule();
    }

    function onVisibilityChange() {
      if (!document.hidden) schedule();
    }

    // Keep DOM geometry reads and compositor hints near the relevant scenes.
    // Off-screen scenes retain their last completed progress value.
    const sceneObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) nearViewport.add(entry.target);
        else nearViewport.delete(entry.target);
      }
      observerReady = true;
      schedule();
    }, { rootMargin: "240px 0px", threshold: 0 });
    for (const scene of scenes) sceneObserver.observe(scene);

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", resetPointer);
    document.addEventListener("visibilitychange", onVisibilityChange);
    motion.addEventListener("change", schedule);
    finePointer.addEventListener("change", schedule);
    schedule();

    return () => {
      active = false;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", resetPointer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motion.removeEventListener("change", schedule);
      finePointer.removeEventListener("change", schedule);
      sceneObserver.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      delete root.dataset["cinemaReady"];
      delete root.dataset["cinemaMotion"];
      delete root.dataset["cinemaPointer"];
      delete root.dataset["cinemaBridgeVisible"];
      delete root.dataset["cinemaFleetScene"];
      delete root.dataset["cinemaMaterialScene"];
    };
  }, []);

  return <div className="cinema-reading-progress" aria-hidden="true"><span /></div>;
}
