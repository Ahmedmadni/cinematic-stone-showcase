import { useEffect } from "react";
import { clampUnit, pinnedProgress, segmentProgress, smoothStep } from "@/lib/cinematic-progress";

/**
 * One passive, requestAnimationFrame-batched scroll controller for the opening
 * and quarry-to-production handoff. It does not hijack scrolling.
 */
export function CinematicDirector() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".presentation");
    const hero = document.getElementById("البداية");
    const bridge = document.getElementById("cinematic-bridge");
    if (!root || !hero || !bridge) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let active = true;

    function update() {
      frame = 0;
      if (!root || !hero || !bridge || !active || document.hidden) return;

      const reduced = motion.matches;
      const heroRect = hero.getBoundingClientRect();
      const bridgeRect = bridge.getBoundingClientRect();
      const heroProgress = reduced ? 0 : clampUnit(-heroRect.top / Math.max(heroRect.height * 0.85, 1));
      const bridgeProgress = reduced ? 0 : pinnedProgress(bridgeRect.top, bridgeRect.height, window.innerHeight);
      const portal = reduced ? 1 : smoothStep(segmentProgress(bridgeProgress, 0.17, 0.83));
      const firstCaption = reduced ? 0 : 1 - smoothStep(segmentProgress(bridgeProgress, 0.08, 0.40));
      const secondCaption = reduced ? 1 : smoothStep(segmentProgress(bridgeProgress, 0.57, 0.88));
      const totalScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

      root.style.setProperty("--cinema-hero-progress", heroProgress.toFixed(4));
      root.style.setProperty("--cinema-bridge-progress", bridgeProgress.toFixed(4));
      root.style.setProperty("--cinema-portal", portal.toFixed(4));
      root.style.setProperty("--cinema-intro-caption", firstCaption.toFixed(4));
      root.style.setProperty("--cinema-outro-caption", secondCaption.toFixed(4));
      root.style.setProperty("--cinema-scroll-progress", clampUnit(window.scrollY / totalScroll).toFixed(4));
      root.dataset.cinemaReady = "true";
      root.dataset.cinemaMotion = reduced ? "reduced" : "full";
    }

    function schedule() {
      if (frame || document.hidden || !active) return;
      frame = window.requestAnimationFrame(update);
    }

    function onVisibilityChange() {
      if (!document.hidden) schedule();
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    motion.addEventListener("change", schedule);
    schedule();

    return () => {
      active = false;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motion.removeEventListener("change", schedule);
      if (frame) window.cancelAnimationFrame(frame);
      delete root.dataset.cinemaReady;
      delete root.dataset.cinemaMotion;
    };
  }, []);

  return <div className="cinema-reading-progress" aria-hidden="true"><span /></div>;
}
