import { ManagedImage } from '@/components/ManagedImage';
import { useEffect, useRef, useState } from "react";

type Visual = {
  image: string;
  alt: string;
  origin?: "actual-site" | "supplementary";
  width?: number;
  height?: number;
};

export function AutoVisual({ images, className = "", interval = 7200, eager = false }: { images: readonly Visual[]; className?: string; interval?: number; eager?: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false), { threshold: 0.08 });
    const element = frame.current;
    if (element) observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setMotionAllowed(!media.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  const playing = visible && pageVisible && motionAllowed && images.length > 1;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setActive((current) => (current + 1) % images.length), interval);
    return () => window.clearTimeout(timer);
  }, [playing, images.length, interval, active]);

  return (
    <div ref={frame} className={`auto-visual ${className}`} data-auto-active={active} data-auto-playing={playing ? "playing" : "paused"}>
      {images.map((item, index) => <ManagedImage mediaContext="AutoVisual"
        key={item.image}
        src={item.image}
        alt={index === active ? item.alt : ""}
        aria-hidden={index !== active}
        loading={eager && index === 0 ? "eager" : "lazy"}
        fetchPriority={eager && index === 0 ? "high" : "auto"}
        decoding="async"
        width={item.width ?? 1536}
        height={item.height ?? 1024}
        data-media-origin={item.origin ?? "supplementary"}
        className={`auto-visual-frame ${item.origin === "actual-site" ? "actual-site-photo " : ""}${index === active ? "active" : ""}`}
      />)}
    </div>
  );
}