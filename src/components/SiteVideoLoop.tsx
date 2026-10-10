import { ManagedImage } from "@/components/ManagedImage";
import { useEffect, useRef, useState } from "react";
import type { SiteVideo } from "@/data/official-video";
import { useManagedVideo } from "@/lib/media-management";

/** One selected, muted cut. A source is attached only on intersection/explicit play. */
export function SiteVideoLoop({
  video: originalVideo,
  language,
  hero = false,
  enabled = true,
  onCoverChange,
  onEnded,
  onUnavailable,
}: {
  video: SiteVideo;
  language: string;
  hero?: boolean;
  enabled?: boolean;
  onCoverChange?: (covered: boolean) => void;
  onEnded?: (() => void) | undefined;
  onUnavailable?: () => void;
}) {
  const video = useManagedVideo(originalVideo, "SiteVideoLoop");
  const stage = useRef<HTMLElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const failedSources = useRef(0);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [requested, setRequested] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [actuallyPlaying, setActuallyPlaying] = useState(false);
  const en = language === "en";
  useEffect(() => {
    failedSources.current = 0;
    setReady(false);
    setFailed(false);
    setActuallyPlaying(false);
  }, [video.src]);
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? false),
      { threshold: 0.15 },
    );
    observer.observe(hero ? (node.closest(".hero-cinematic") ?? node) : node);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection;
      setMotionAllowed(!media.matches && !connection?.saveData);
    };
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, [hero]);
  const shouldPlay =
    enabled && visible && pageVisible && !failed && motionAllowed;
  useEffect(() => {
    if (shouldPlay) setRequested(true);
  }, [shouldPlay]);
  useEffect(() => {
    const node = player.current;
    if (!node) return;
    let cancelled = false;
    if (shouldPlay && requested) {
      void node.play().catch(() => {
        if (!cancelled) {
          setActuallyPlaying(false);
        }
      });
    } else node.pause();
    return () => {
      cancelled = true;
      node.pause();
    };
  }, [shouldPlay, requested, video.src]);
  const covered = enabled && ready && !failed && motionAllowed;
  useEffect(() => {
    onCoverChange?.(covered);
    return () => onCoverChange?.(false);
  }, [covered, onCoverChange]);
  const title = en ? video.en : video.ar;
  function fail() {
    setFailed(true);
    setReady(false);
    setActuallyPlaying(false);
    onUnavailable?.();
  }
  function sourceError() {
    failedSources.current += 1;
    if (failedSources.current >= (video.webm ? 2 : 1)) fail();
  }
  return (
    <figure
      ref={stage}
      className={"site-video" + (hero ? " site-video--hero" : "")}
      data-video-section={video.id}
      data-video-visible={visible}
      data-video-should-play={shouldPlay}
      data-video-requested={requested}
      data-video-playing={actuallyPlaying}
      data-video-ready={ready}
      data-video-failed={failed}
    >
      <div className="site-video__stage">
        {!hero && (
          <ManagedImage
            mediaContext="SiteVideoLoop"
            className="actual-site-photo"
            src={video.poster}
            alt={title}
            width={1280}
            height={720}
            loading="lazy"
            decoding="async"
          />
        )}
        {requested && (
          <video
            ref={player}
            key={video.src}
            className={"actual-site-video" + (covered ? " is-ready" : "")}
            poster={hero ? undefined : video.poster}
            muted
            playsInline
            autoPlay={shouldPlay}
            loop={!onEnded}
            onEnded={onEnded}
            preload="metadata"
            aria-label={title}
            onLoadedData={() => setReady(true)}
            onPlaying={() => setActuallyPlaying(true)}
            onPause={() => setActuallyPlaying(false)}
            onError={(event) => {
              if (event.target === event.currentTarget) fail();
            }}
          >
            <source
              src={video.src}
              type={video.webm ? 'video/mp4; codecs="avc1.64001f"' : undefined}
              onError={sourceError}
            />
            {video.webm && (
              <source src={video.webm} type='video/webm; codecs="vp9"' onError={sourceError} />
            )}
          </video>
        )}
      </div>
      {!hero && (
        <figcaption>
          <span className="latin">AL SOMMAN / FILM</span>
          <span>{title}</span>
          {failed && (
            <small>
              {en ? "The still photograph remains available." : "تظل الصورة الثابتة متاحة."}
            </small>
          )}
        </figcaption>
      )}
    </figure>
  );
}
