import { useEffect } from "react";
import {
  clampUnit,
  normalizedPointer,
  pinnedProgress,
  segmentProgress,
  signedPointer,
  smoothStep,
} from "@/lib/cinematic-progress";

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
    const atlas = document.querySelector<HTMLElement>(".quarry-atlas");
    const magneticLink = document.querySelector<HTMLElement>(".hero-discover");
    if (!root || !hero || !bridge) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let active = true;
    let pointerX = 0;
    let pointerY = 0;
    let hasPointer = false;

    const sceneEntry = (rect: DOMRect | undefined): number =>
      rect
        ? clampUnit((window.innerHeight - rect.top) / Math.max(1, rect.height + window.innerHeight))
        : 0;

    function update() {
      frame = 0;
      if (!root || !hero || !bridge || !active || document.hidden) return;

      const reduced = motion.matches;
      const pointerActive = !reduced && finePointer.matches && hasPointer;
      const heroRect = hero.getBoundingClientRect();
      const bridgeRect = bridge.getBoundingClientRect();
      const fleetRect = fleet?.getBoundingClientRect();
      const atlasRect = atlas?.getBoundingClientRect();

      const heroProgress = reduced ? 0 : clampUnit(-heroRect.top / Math.max(heroRect.height * 0.85, 1));
      const bridgeProgress = reduced ? 0 : pinnedProgress(bridgeRect.top, bridgeRect.height, window.innerHeight);
      const portal = reduced ? 1 : smoothStep(segmentProgress(bridgeProgress, 0.17, 0.83));
      const firstCaption = reduced ? 0 : 1 - smoothStep(segmentProgress(bridgeProgress, 0.08, 0.40));
      const secondCaption = reduced ? 1 : smoothStep(segmentProgress(bridgeProgress, 0.57, 0.88));
      const totalScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

      const px = pointerActive ? signedPointer(pointerX, 0, window.innerWidth) : 0;
      const py = pointerActive ? signedPointer(pointerY, 0, window.innerHeight) : 0;
      const heroX = pointerActive ? normalizedPointer(pointerX, heroRect.left, heroRect.width) * 100 : 55;
      const heroY = pointerActive ? normalizedPointer(pointerY, heroRect.top, heroRect.height) * 100 : 47;
      const fleetX = pointerActive && fleetRect ? normalizedPointer(pointerX, fleetRect.left, fleetRect.width) * 100 : 50;
      const fleetY = pointerActive && fleetRect ? normalizedPointer(pointerY, fleetRect.top, fleetRect.height) * 100 : 50;
      const bridgeMaskX = pointerActive && bridgeRect && Math.abs(bridgeRect.top) < window.innerHeight * 2
        ? 54 + px * 3 : 54;

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
      root.style.setProperty("--cinema-fleet-scale", (reduced ? 1 : 1.085 - sceneEntry(fleetRect) * 0.075).toFixed(4));
      root.style.setProperty("--cinema-territory-scale", (reduced ? 1 : 1.075 - sceneEntry(atlasRect) * 0.065).toFixed(4));
      root.style.setProperty("--cinema-mask-x", bridgeMaskX.toFixed(2) + "%");
      root.style.setProperty("--cinema-fog-strength", (reduced ? 0 : 0.12 + smoothStep(segmentProgress(bridgeProgress, 0.12, 0.86)) * 0.2).toFixed(3));
      root.style.setProperty("--pointer-x", (px * 14).toFixed(2) + "px");
      root.style.setProperty("--pointer-y", (py * 11).toFixed(2) + "px");
      root.style.setProperty("--cinema-fog-x", (px * 16).toFixed(2) + "px");
      root.style.setProperty("--cinema-fog-y", (py * 9).toFixed(2) + "px");
      root.style.setProperty("--cinema-hero-pointer-x", heroX.toFixed(2) + "%");
      root.style.setProperty("--cinema-hero-pointer-y", heroY.toFixed(2) + "%");
      root.style.setProperty("--cinema-fleet-pointer-x", fleetX.toFixed(2) + "%");
      root.style.setProperty("--cinema-fleet-pointer-y", fleetY.toFixed(2) + "%");
      root.style.setProperty("--cinema-fleet-mouse-x", (px * 7).toFixed(2) + "px");
      root.style.setProperty("--cinema-fleet-mouse-y", (py * 5).toFixed(2) + "px");
      root.style.setProperty("--cinema-cta-x", magneticX.toFixed(2) + "px");
      root.style.setProperty("--cinema-cta-y", magneticY.toFixed(2) + "px");
      root.dataset["cinemaReady"] = "true";
      root.dataset["cinemaMotion"] = reduced ? "reduced" : "full";
      root.dataset["cinemaPointer"] = pointerActive ? "active" : "off";
    }

    function schedule() {
      if (frame || document.hidden || !active) return;
      frame = window.requestAnimationFrame(update);
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !finePointer.matches) return;
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
      if (frame) window.cancelAnimationFrame(frame);
      delete root.dataset["cinemaReady"];
      delete root.dataset["cinemaMotion"];
      delete root.dataset["cinemaPointer"];
    };
  }, []);

  return <div className="cinema-reading-progress" aria-hidden="true"><span /></div>;
}
