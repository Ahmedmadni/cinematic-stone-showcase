import { useSiteLanguage } from "@/lib/site-language";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export type GallerySlide = { image: string; label: string; origin?: "actual-site" | "supplementary" };

type GallerySlidesProps = {
  slides: readonly GallerySlide[];
  title: string;
  replacement: string;
  onOpen: (slide: number) => void;
  isPaused?: boolean;
  interval?: number;
};

export function GallerySlides({ slides, title, replacement, onOpen, isPaused = false, interval = 6200 }: GallerySlidesProps) {
  const {t, language} = useSiteLanguage();
  const frame = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [manuallyPaused, setManuallyPaused] = useState(false);

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

  const currentSlide = slides[active] ?? slides[0];
  const playing = visible && pageVisible && motionAllowed && !paused && !isPaused && !manuallyPaused && slides.length > 1;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setActive((current) => (current + 1) % slides.length), interval);
    return () => window.clearTimeout(timer);
  }, [playing, slides.length, active, interval]);

  const choose = (index: number) => {
    setActive((index + slides.length) % slides.length);

  };

  return (
    <div className="gallery-slider" data-gallery-autoplay={playing ? "playing" : "paused"} data-gallery-interaction={paused ? "hover-paused" : manuallyPaused ? "manual-paused" : "idle"} data-gallery-active={active} ref={frame} onPointerEnter={(event) => { if (event.pointerType === "mouse") setPaused(true); }} onPointerLeave={(event) => { if (event.pointerType === "mouse") setPaused(false); }} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      <Button type="button" variant="ghost" className="gallery-image-button" aria-label={language === "en" ? `View ${title}, ${slides[active]?.label ?? title} larger` : `عرض ${title}، ${slides[active]?.label ?? title} بحجم أكبر`} onClick={() => onOpen(active)}>
        <span className="image-window">
          {slides.map((slide, index) => <img key={slide.image} src={slide.image} loading="lazy" decoding="async" width={1600} height={900} alt={index === active ? `${slide.origin === "actual-site" ? t("تصوير فعلي من الموقع:") : t("مشهد توضيحي مكمل:")} ${slide.label}` : ""} aria-hidden={index !== active} data-media-origin={slide.origin ?? "supplementary"} className={`gallery-slide ${slide.origin === "actual-site" ? "actual-site-photo " : ""}${index === active ? "active" : ""}`} />)}
          <span className="gallery-image-shade" /><span className="gallery-image-title">{title}</span>
          <span className="photo-placeholder">{currentSlide?.origin === "actual-site" ? t("تصوير فعلي من موقع الصمان") : t("مشهد توضيحي مكمل")} · {replacement}</span>
        </span>
      </Button>
      <div className="gallery-slide-controls">
        <Button type="button" variant="ghost" disabled={!motionAllowed || slides.length < 2} aria-pressed={!manuallyPaused && motionAllowed} title={!motionAllowed ? (language === "en" ? "Autoplay disabled by reduced motion" : "التحريك التلقائي معطل") : undefined} aria-label={(manuallyPaused ? (language === "en" ? "Resume " : "إيقاف/تشغيل عرض ") : (language === "en" ? "Pause " : "إيقاف عرض ")) + title + (language === "en" ? " slideshow" : "")} onClick={() => setManuallyPaused((previous) => !previous)}>{manuallyPaused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}</Button>
        <span className="gallery-slide-count latin" dir="ltr">{String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
      </div>
      <span className="gallery-slider__timeline" key={active} aria-hidden="true" style={{ animationDuration: interval + "ms", animationPlayState: playing ? "running" : "paused" }}/>
    </div>
  );
}