import { ManagedImage } from '@/components/ManagedImage';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSiteMedia } from "@/lib/site-media";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useSiteLanguage } from "@/lib/site-language";
import { gallerySwipeStep, isInteractiveGalleryTarget } from "@/lib/gallery-gestures";
import { officialMedia } from "@/data/official-media";

/**
 * Ten full-frame scenes: actual Al Somman site photography leads the story,
 * while the strongest existing equipment visuals remain as supplementary
 * editorial scenes. The two origins stay explicitly distinguishable.
 */
const baseScenes = [
  { src: officialMedia.hero[0].image, en: officialMedia.hero[0].en, ar: officialMedia.hero[0].ar, origin: officialMedia.hero[0].origin },
  ...officialMedia.hero.slice(1).map((item) => ({
    src: item.image,
    en: item.en,
    ar: item.ar,
    origin: item.origin,
  })),
  ...[officialMedia.equipment.loader, officialMedia.equipment.front, officialMedia.production.crusher,
    officialMedia.production.conveyor, officialMedia.facilities.weighbridge, officialMedia.facilities.office]
    .map(item => ({ src: item.image, en: item.en, ar: item.ar, origin: item.origin })),
] as const;

const HERO_INTERVAL_MS = 5800;
const REVEAL_MS = 1300;

export function HeroGallery({ suspended = false, onRequestPhotographs }: { suspended?: boolean; onRequestPhotographs?: () => void }) {
  const { language } = useSiteLanguage();
  const heroRef = useRef<HTMLDivElement>(null);
  const activeImageRef = useRef<HTMLImageElement>(null);
  const lastReadyIndex = useRef<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [active, setActive] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [loadedScene, setLoadedScene] = useState<string | null>(null);
  const [failedScene, setFailedScene] = useState<string | null>(null);
  const [sequence, setSequence] = useState(0);
  const [inView, setInView] = useState(true); // first viewport contains the hero
  const [pageVisible, setPageVisible] = useState(true);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [controlsFocused, setControlsFocused] = useState(false);
  const uploaded = useSiteMedia("hero");
  const scenes = useMemo(() => [
    ...uploaded.filter(i => i.kind === "image").map(i => ({ src: i.url, en: i.title_en || "Actual site photograph", ar: i.title_ar || "تصوير فعلي من الموقع", origin: "actual-site" as const })),
    ...baseScenes,
  ], [uploaded]);

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
    // The hero layer has a negative z-index; observe its full section instead
    // so browser restoration/transform clipping cannot suppress autoplay.
    const node = heroRef.current?.closest(".hero-cinematic") ?? heroRef.current;
    if (node) observer.observe(node);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updatePage);
    };
  }, []);

  const currentSrc = (scenes[active] ?? baseScenes[0]).src;
  const imageReady = loadedScene === currentSrc && failedScene !== currentSrc;
  const playing = !suspended && imageReady && inView && pageVisible && motionAllowed && !paused && !controlsFocused;

  const recoverImage = useCallback((index: number) => {
    setFailedScene((scenes[index] ?? baseScenes[0]).src);
    setPaused(true);
    // A failed image never becomes ready. Return to the last decoded scene,
    // rather than assuming scene zero was successfully downloaded.
    if (lastReadyIndex.current !== null && lastReadyIndex.current !== index) {
      setActive(lastReadyIndex.current);
      setOutgoing(null);
    }
  }, [scenes]);

  const settleImage = useCallback((image: HTMLImageElement, index: number) => {
    void image.decode().then(() => {
      // A rapid selection may replace this element before decode completes.
      if (activeImageRef.current !== image) return;
      lastReadyIndex.current = index;
      setFailedScene(null);
      setLoadedScene((scenes[index] ?? baseScenes[0]).src);
    }).catch(() => {
      if (activeImageRef.current === image) recoverImage(index);
    });
  }, [recoverImage, scenes]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      setActive(current => {
        setOutgoing(lastReadyIndex.current);
        return (current + 1) % scenes.length;
      });
      setSequence(current => current + 1);
    }, HERO_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [playing, active, scenes.length]);

  useEffect(() => {
    // React 19 may stream/high-priority preload the first image before the
    // client mounts. Its native load event is then already in the past.
    // Read the intrinsic image state after hydration, not just onLoad.
    const image = activeImageRef.current;
    if (!image?.complete) return;
    if (image.naturalWidth > 0) {
      settleImage(image, active);
    } else {
      recoverImage(active);
    }
  }, [active, currentSrc, sequence, settleImage, recoverImage]);

  useEffect(() => {
    // Never remove the last valid frame before the incoming image finishes.
    // Otherwise slow connections can briefly reveal an empty dark hero.
    if (outgoing === null || !imageReady) return;
    const timer = window.setTimeout(() => setOutgoing(null), motionAllowed ? REVEAL_MS : 0);
    return () => window.clearTimeout(timer);
  }, [outgoing, sequence, motionAllowed, imageReady]);

  useEffect(() => {
    // Preload only the next frame, not all ten large hero photos.
    if (!playing) return;
    const next = new Image();
    next.src = (scenes[(active + 1) % scenes.length] ?? baseScenes[0]).src;
  }, [active, playing, scenes]);

  useEffect(() => {
    const section = heroRef.current?.closest<HTMLElement>(".hero-cinematic");
    if (!section) return;
    function start(event: TouchEvent) {
      if (event.touches.length !== 1 || isInteractiveGalleryTarget(event.target)) {
        touchStart.current = null;
        return;
      }
      const touch = event.touches[0];
      if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY };
    }
    function finish(event: TouchEvent) {
      const startingPoint = touchStart.current;
      touchStart.current = null;
      if (!startingPoint || event.changedTouches.length !== 1) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const step = gallerySwipeStep(
        touch.clientX - startingPoint.x,
        touch.clientY - startingPoint.y,
        language === "ar" ? "rtl" : "ltr",
      );
      if (!step) return;
      onRequestPhotographs?.();
      setActive(current => {
        setOutgoing(lastReadyIndex.current);
        return (current + step + scenes.length) % scenes.length;
      });
      setSequence(current => current + 1);
      // Touch gestures are direct visitor choices, not another autoplay tick.
      setPaused(true);
    }
    function cancel() { touchStart.current = null; }
    section.addEventListener("touchstart", start, { passive: true });
    section.addEventListener("touchend", finish, { passive: true });
    section.addEventListener("touchcancel", cancel, { passive: true });
    return () => {
      section.removeEventListener("touchstart", start);
      section.removeEventListener("touchend", finish);
      section.removeEventListener("touchcancel", cancel);
    };
  }, [language, onRequestPhotographs, scenes.length]);

  function choose(index: number) {
    onRequestPhotographs?.();
    const nextIndex = (index + scenes.length) % scenes.length;
    if (nextIndex === active) return;
    setOutgoing(lastReadyIndex.current);
    setActive(nextIndex);
    setSequence(value => value + 1);
    // A visitor's deliberate selection remains visible until Play is pressed.
    setPaused(true);
  }

  const current = scenes[active] ?? baseScenes[0];
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
        data-hero-image-ready={imageReady}
        data-hero-image-error={failedScene === currentSrc}
        aria-hidden="true"
      >
        {previous && previous.src !== current.src && (
          <ManagedImage mediaContext="HeroGallery"
            className={"hero-gallery__photo hero-gallery__photo--outgoing" + (previous.origin === "actual-site" ? " actual-site-photo" : "")}
            key={previous.src}
            src={previous.src}
            alt=""
            width={1536}
            height={1024}
            decoding="async"
          />
        )}
        <ManagedImage mediaContext="HeroGallery"
          key={current.src}
          ref={activeImageRef}
          className={"hero-gallery__photo hero-gallery__photo--active" + (current.origin === "actual-site" ? " actual-site-photo" : "") + (outgoing !== null && !imageReady ? " hero-gallery__photo--waiting" : "") + (outgoing !== null && imageReady && motionAllowed ? " hero-gallery__photo--reveal" : "")}
          data-reveal={["lower-right", "centre", "upper-left", "soft-wipe"][active % 4]}
          data-media-origin={current.origin}
          src={current.src}
          alt=""
          fetchPriority={active === 0 ? "high" : "auto"}
          loading="eager"
          decoding="async"
          width={1536}
          height={1024}
          onLoad={event => settleImage(event.currentTarget, active)}
          onError={() => recoverImage(active)}
        />
        <span className="hero-gallery__film-grain" aria-hidden="true" />
      </div>

      <div
        className="hero-gallery__toolbar"
        role="group"
        aria-label={language === "en" ? "Hero photo slideshow" : "عرض صور الهيرو"}
        onFocusCapture={() => setControlsFocused(true)}
        onBlurCapture={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) setControlsFocused(false);
        }}
      >
        <button
          type="button"
          className="hero-gallery__motion-toggle"
          disabled={!motionAllowed}
          onClick={() => {
            // Explicit Play should work even while focus remains on this button.
            // Moving focus to a different gallery control pauses it again.
            onRequestPhotographs?.();
            setPaused(current => !current);
            setControlsFocused(false);
          }}
          aria-label={isMotionPaused ? (language === "en" ? "Play hero slideshow" : "تشغيل صور الهيرو") : (language === "en" ? "Pause hero slideshow" : "إيقاف صور الهيرو")}
          aria-pressed={!paused && motionAllowed}
          title={!motionAllowed ? (language === "en" ? "Automatic movement is disabled by your reduced-motion setting" : "التحريك التلقائي معطل وفق إعداد تقليل الحركة") : language === "en" ? (paused ? "Play" : "Pause") : (paused ? "تشغيل" : "إيقاف")}
        >
          {paused || !motionAllowed ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}
        </button>
        <button type="button" className="hero-gallery__nav hero-gallery__nav--previous" aria-label={language === "en" ? "Previous hero photo" : "الصورة السابقة للهيرو"} onClick={() => choose(active - 1)}><ArrowLeft size={17} aria-hidden="true" /></button>
        <div className="hero-gallery__dots" role="group" aria-label={language === "en" ? "Select a hero photo" : "اختر صورة الهيرو"}>
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
        <button type="button" className="hero-gallery__nav hero-gallery__nav--next" aria-label={language === "en" ? "Next hero photo" : "الصورة التالية للهيرو"} onClick={() => choose(active + 1)}><ArrowRight size={17} aria-hidden="true" /></button>
        <span className="hero-gallery__counter latin" dir="ltr">{String(active + 1).padStart(2, "0")}/{scenes.length}</span>
        <span className="hero-gallery__caption">{label}</span>
      </div>
    </>
  );
}
