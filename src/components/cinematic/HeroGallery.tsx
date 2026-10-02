import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useSiteLanguage } from "@/lib/site-language";
import quarryWide from "@/assets/quarry-aerial.jpg";
import breaker from "@/assets/excavators.jpg";
import loader from "@/assets/loaders-maintenance.jpg";
import crushingLine from "@/assets/crushing-plant.jpg";
import haulRoad from "@/assets/site-roads.jpg";
import quarryAlternate from "@/assets/quarry-aerial-alt.jpg";
import breakerAlternate from "@/assets/excavators-alt.jpg";
import loaderAlternate from "@/assets/loaders-maintenance-alt.jpg";
import processingAlternate from "@/assets/crushing-plant-alt.jpg";
import powerSite from "@/assets/generators-weighbridge.jpg";

/**
 * Exactly ten distinct full-frame illustrative scenes. Never splice several
 * machines into one invented activity: every photo is its own slide.
 * Original site photography has not been supplied/verified.
 */
const scenes = [
  { src: quarryWide, en: "Quarry panorama", ar: "مشهد بانورامي للمحجر" },
  { src: breaker, en: "Rock-breaking excavator", ar: "حفار تكسير الصخور" },
  { src: loader, en: "Loader and truck handling", ar: "الشيول وتحميل الشاحنات" },
  { src: crushingLine, en: "Crushing and screening", ar: "الكسارات والفرز" },
  { src: haulRoad, en: "Quarry haul roads", ar: "طرق نقل المواد" },
  { src: quarryAlternate, en: "Limestone benches", ar: "مدرجات الحجر الجيري" },
  { src: breakerAlternate, en: "Excavation operations", ar: "عمليات الاستخراج" },
  { src: loaderAlternate, en: "Aggregate handling", ar: "مناولة المواد" },
  { src: processingAlternate, en: "Production conveyors", ar: "سيور الإنتاج" },
  { src: powerSite, en: "Site utilities", ar: "مرافق الموقع" },
] as const;

export const HERO_SCENE_COUNT = scenes.length;
const HERO_INTERVAL_MS = 5800;
const REVEAL_MS = 1300;

export function HeroGallery() {
  const { language } = useSiteLanguage();
  const heroRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [sequence, setSequence] = useState(0);
  const [inView, setInView] = useState(true); // first viewport contains the hero
  const [pageVisible, setPageVisible] = useState(true);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setMotionAllowed(!media.matches);
    const updatePage = () => setPageVisible(!document.hidden);
    updateMotion();
    updatePage();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updatePage);

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold: 0.12 },
    );
    const node = heroRef.current;
    if (node) observer.observe(node);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updatePage);
    };
  }, []);

  const playing = inView && pageVisible && motionAllowed && !paused;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      setActive(current => {
        setOutgoing(current);
        return (current + 1) % scenes.length;
      });
      setSequence(current => current + 1);
    }, HERO_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [playing, active]);

  useEffect(() => {
    if (outgoing === null) return;
    const timer = window.setTimeout(() => setOutgoing(null), motionAllowed ? REVEAL_MS : 0);
    return () => window.clearTimeout(timer);
  }, [outgoing, sequence, motionAllowed]);

  useEffect(() => {
    // Preload only the next frame, not all ten large hero photos.
    if (!playing) return;
    const next = new Image();
    next.src = (scenes[(active + 1) % scenes.length] ?? scenes[0]).src;
  }, [active, playing]);

  function choose(index: number) {
    const nextIndex = (index + scenes.length) % scenes.length;
    if (nextIndex === active) return;
    setOutgoing(active);
    setActive(nextIndex);
    setSequence(value => value + 1);
    // A visitor's deliberate selection remains visible until Play is pressed.
    setPaused(true);
  }

  const current = scenes[active] ?? scenes[0];
  const previous = outgoing === null ? null : (scenes[outgoing] ?? null);
  const label = language === "en" ? current.en : current.ar;
  const isMotionPaused = !motionAllowed || paused;

  return (
    <>
      <div
        className="hero-media hero-gallery"
        ref={heroRef}
        data-hero-active={active}
        data-hero-playing={playing}
        aria-hidden="true"
      >
        {previous && (
          <img
            className="hero-gallery__photo hero-gallery__photo--outgoing"
            key={"old-" + outgoing + "-" + sequence}
            src={previous.src}
            alt=""
            width={1536}
            height={1024}
            decoding="async"
          />
        )}
        <img
          key={"current-" + active + "-" + sequence}
          className={"hero-gallery__photo hero-gallery__photo--active" + (sequence > 0 && motionAllowed ? " hero-gallery__photo--reveal" : "")}
          data-reveal={["lower-right", "centre", "upper-left", "soft-wipe"][active % 4]}
          src={current.src}
          alt=""
          fetchPriority={active === 0 ? "high" : "auto"}
          loading={active === 0 ? "eager" : "lazy"}
          decoding="async"
          width={1536}
          height={1024}
        />
        <span className="hero-gallery__film-grain" aria-hidden="true" />
      </div>

      <div className="hero-gallery__toolbar" role="group" aria-label={language === "en" ? "Hero photo slideshow" : "عرض صور الهيرو"}>
        <button
          type="button"
          className="hero-gallery__motion-toggle"
          onClick={() => setPaused(p => !p)}
          aria-label={isMotionPaused ? (language === "en" ? "Play hero slideshow" : "تشغيل صور الهيرو") : (language === "en" ? "Pause hero slideshow" : "إيقاف صور الهيرو")}
          aria-pressed={!paused && motionAllowed}
          title={language === "en" ? (paused ? "Play" : "Pause") : (paused ? "تشغيل" : "إيقاف")}
        >
          {paused || !motionAllowed ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}
        </button>
        <button type="button" className="hero-gallery__nav" aria-label={language === "en" ? "Previous hero photo" : "الصورة السابقة للهيرو"} onClick={() => choose(active - 1)}><ArrowLeft size={17} aria-hidden="true" /></button>
        <div className="hero-gallery__dots" aria-label={language === "en" ? "Select a hero photo" : "اختر صورة الهيرو"}>
          {scenes.map((scene, index) => (
            <button
              key={scene.src}
              type="button"
              className={"hero-gallery__dot" + (active === index ? " is-active" : "")}
              aria-label={(language === "en" ? "Photo " : "الصورة ") + (index + 1) + " — " + (language === "en" ? scene.en : scene.ar)}
              aria-current={active === index ? "true" : undefined}
              onClick={() => choose(index)}
            />
          ))}
        </div>
        <button type="button" className="hero-gallery__nav" aria-label={language === "en" ? "Next hero photo" : "الصورة التالية للهيرو"} onClick={() => choose(active + 1)}><ArrowRight size={17} aria-hidden="true" /></button>
        <span className="hero-gallery__counter latin" dir="ltr">{String(active + 1).padStart(2, "0")}/10</span>
        <span className="hero-gallery__caption">{label}</span>
      </div>
    </>
  );
}
