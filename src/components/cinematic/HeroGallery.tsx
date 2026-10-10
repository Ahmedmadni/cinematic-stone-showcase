import { ManagedImage } from '@/components/ManagedImage';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSiteMedia } from "@/lib/site-media";
import { officialMedia } from "@/data/official-media";

/** Full-frame Al Somman scenes rotate as a quiet decorative background. */
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

export function HeroGallery({ suspended = false }: { suspended?: boolean }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const activeImageRef = useRef<HTMLImageElement>(null);
  const lastReadyIndex = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [loadedScene, setLoadedScene] = useState<string | null>(null);
  const [failedScene, setFailedScene] = useState<string | null>(null);
  const [sequence, setSequence] = useState(0);
  const [inView, setInView] = useState(true); // first viewport contains the hero
  const [pageVisible, setPageVisible] = useState(true);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const uploaded = useSiteMedia("hero");
  const scenes = useMemo(() => [
    ...uploaded.filter(i => i.kind === "image").map(i => ({ src: i.url, en: i.title_en || "Al Somman", ar: i.title_ar || "الصمان", origin: "actual-site" as const })),
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
  const playing = !suspended && imageReady && inView && pageVisible && motionAllowed;

  const recoverImage = useCallback((index: number) => {
    setFailedScene((scenes[index] ?? baseScenes[0]).src);
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

  const current = scenes[active] ?? baseScenes[0];
  const previous = outgoing === null ? null : (scenes[outgoing] ?? null);

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

    </>
  );
}
