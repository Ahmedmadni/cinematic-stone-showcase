import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type GallerySlide = { image: string; label: string };

type GallerySlidesProps = {
  slides: readonly GallerySlide[];
  title: string;
  replacement: string;
  onOpen: (slide: number) => void;
  isPaused?: boolean;
};

export function GallerySlides({ slides, title, replacement, onOpen, isPaused = false }: GallerySlidesProps) {
  const frame = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false), { threshold: 0.15 });
    if (frame.current) observer.observe(frame.current);
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

  useEffect(() => {
    if (!visible || !pageVisible || !motionAllowed || paused || isPaused || slides.length < 2) return;
    const timer = window.setTimeout(() => setActive((current) => (current + 1) % slides.length), 6000);
    return () => window.clearTimeout(timer);
  }, [visible, pageVisible, motionAllowed, paused, isPaused, slides.length, active, cycle]);

  const choose = (index: number) => {
    setActive((index + slides.length) % slides.length);
    setCycle((current) => current + 1);
  };

  return (
    <div className="gallery-slider" ref={frame} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      <Button type="button" variant="ghost" className="gallery-image-button" aria-label={`عرض ${title}، ${slides[active]?.label ?? title} بحجم أكبر`} onClick={() => onOpen(active)}>
        <span className="image-window">
          {slides.map((slide, index) => <img key={slide.image} src={slide.image} loading="lazy" decoding="async" width={1536} height={1024} alt={index === active ? `صورة تجريبية توضيحية: ${slide.label} — ${replacement}` : ""} aria-hidden={index !== active} className={`gallery-slide ${index === active ? "active" : ""}`} />)}
          <span className="gallery-image-shade" /><span className="gallery-image-title">{title}</span>
          <span className="photo-placeholder">صورة تجريبية · {replacement}</span>
        </span>
      </Button>
      <div className="gallery-slide-controls">
        <div className="gallery-slide-arrows">
          <Button type="button" variant="ghost" aria-label={`الصورة السابقة: ${title}`} onClick={() => choose(active - 1)}><ArrowRight size={19} /></Button>
          <Button type="button" variant="ghost" aria-label={`الصورة التالية: ${title}`} onClick={() => choose(active + 1)}><ArrowLeft size={19} /></Button>
        </div>
        <span className="gallery-slide-count latin" dir="ltr">{String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
      </div>
    </div>
  );
}