import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { SiteVideo } from "@/data/official-video";

/** One selected, muted cut. A source is attached only on intersection/explicit play. */
export function SiteVideoLoop({ video, language, hero = false, enabled = true, onCoverChange, onEnded, onUnavailable }: {
  video: SiteVideo; language: string; hero?: boolean; enabled?: boolean; onCoverChange?: (covered: boolean) => void; onEnded?: (() => void) | undefined; onUnavailable?: () => void;
}) {
  const stage = useRef<HTMLElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const failedSources = useRef(0);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [requested, setRequested] = useState(false);
  const [manuallyStarted, setManuallyStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [actuallyPlaying, setActuallyPlaying] = useState(false);
  const en = language === "en";
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false), { threshold: .15 });
    observer.observe(hero ? node.closest(".hero-cinematic") ?? node : node);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      setMotionAllowed(!media.matches && !connection?.saveData);
    };
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion(); updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => { observer.disconnect(); media.removeEventListener("change", updateMotion); document.removeEventListener("visibilitychange", updateVisibility); };
  }, [hero]);
  const shouldPlay = enabled && visible && pageVisible && !paused && !failed && (motionAllowed || manuallyStarted);
  useEffect(() => { if (shouldPlay) setRequested(true); }, [shouldPlay]);
  useEffect(() => {
    const node = player.current;
    if (!node) return;
    let cancelled = false;
    if (shouldPlay && requested) {
      void node.play().catch(() => { if (!cancelled) { setPaused(true); setActuallyPlaying(false); } });
    } else node.pause();
    return () => { cancelled = true; node.pause(); };
  }, [shouldPlay, requested, video.src]);
  const covered = enabled && ready && !failed && (motionAllowed || manuallyStarted);
  useEffect(() => { onCoverChange?.(covered); return () => onCoverChange?.(false); }, [covered, onCoverChange]);
  const title = en ? video.en : video.ar;
  function fail() { setFailed(true); setReady(false); setActuallyPlaying(false); onUnavailable?.(); }
  function sourceError() { failedSources.current += 1; if (failedSources.current >= (video.webm ? 2 : 1)) fail(); }
  function toggle() { if (failed) return; setManuallyStarted(true); setRequested(true); setPaused(actuallyPlaying); }
  return <figure ref={stage} className={"site-video" + (hero ? " site-video--hero" : "")} data-video-section={video.id} data-video-visible={visible} data-video-should-play={shouldPlay} data-video-requested={requested} data-video-playing={actuallyPlaying} data-video-ready={ready} data-video-failed={failed}>
    <div className="site-video__stage">
      {!hero && <img className="actual-site-photo" src={video.poster} alt={title} width={1280} height={720} loading="lazy" decoding="async" />}
      {requested && <video ref={player} key={video.src} className={"actual-site-video" + (covered ? " is-ready" : "")} poster={hero ? undefined : video.poster} muted playsInline autoPlay={shouldPlay} loop={!onEnded} onEnded={onEnded} preload="metadata" aria-label={title}
        onLoadedData={() => setReady(true)} onPlaying={() => setActuallyPlaying(true)} onPause={() => setActuallyPlaying(false)} onError={fail}>
        <source src={video.src} type={video.webm ? 'video/mp4; codecs="avc1.64001f"' : undefined} onError={sourceError} />{video.webm && <source src={video.webm} type='video/webm; codecs="vp9"' onError={sourceError} />}
      </video>}
      <button type="button" className="site-video__toggle" onClick={toggle} disabled={failed || !enabled} aria-label={actuallyPlaying ? (en ? "Pause site video" : "إيقاف فيديو الموقع") : (en ? "Play site video" : "تشغيل فيديو الموقع")} aria-pressed={actuallyPlaying}>
        {actuallyPlaying ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}<span>{actuallyPlaying ? (en ? "Pause film" : "إيقاف المقطع") : (en ? "Play film" : "تشغيل المقطع")}</span>
      </button>
    </div>
    {!hero && <figcaption><span className="latin">ACTUAL SITE / FILM</span><span>{title}</span>{failed && <small>{en ? "The still photograph remains available." : "تظل الصورة الثابتة متاحة."}</small>}</figcaption>}
  </figure>;
}
