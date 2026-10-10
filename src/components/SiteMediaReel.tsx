import { ManagedImage } from '@/components/ManagedImage';
import { useEffect, useMemo, useRef, useState } from "react";
import { useSiteMedia, type SiteMediaItem, type SiteMediaSection } from "@/lib/site-media";
import { officialVideo } from "@/data/official-video";
import { SiteVideoLoop } from "@/components/SiteVideoLoop";

type ReelItem = Pick<SiteMediaItem, "id" | "kind" | "url" | "title_ar" | "title_en"> & { poster?: string; webm?: string };
/** Admin uploads remain first; the bundled clip is always the fallback. */
export function SiteMediaReel({ section, language, videosOnly = false, interval = 6200 }: { section: SiteMediaSection; language: string; videosOnly?: boolean; interval?: number }) {
  const uploads = useSiteMedia(section);
  const items = useMemo<ReelItem[]>(() => {
    const cut = officialVideo[section];
    return [...uploads.filter(item => !videosOnly || item.kind === "video"), { id: "builtin-" + section, kind: "video", url: cut.src, poster: cut.poster, webm: cut.webm, title_ar: cut.ar, title_en: cut.en }];
  }, [uploads, section, videosOnly]);
  const frame = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [motion, setMotion] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  useEffect(() => {
    const node = frame.current; if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false), { threshold: .15 });
    observer.observe(node);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setMotion(!media.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion(); updateVisibility();
    media.addEventListener("change", updateMotion); document.addEventListener("visibilitychange", updateVisibility);
    return () => { observer.disconnect(); media.removeEventListener("change", updateMotion); document.removeEventListener("visibilitychange", updateVisibility); };
  }, []);
  const current = items[active % items.length];
  const playing = visible && motion && pageVisible && items.length > 1;
  useEffect(() => {
    if (!playing || !current || current.kind !== "image") return;
    const timer = window.setTimeout(() => setActive(value => (value + 1) % items.length), interval);
    return () => window.clearTimeout(timer);
  }, [playing, current, items.length, interval]);
  if (!current) return null;
  const title = language === "ar" ? current.title_ar || "مشهد من موقع الصمان" : current.title_en || "Al Somman site scene";
  return <div className="site-media-reel reveal is-visible" ref={frame}>
    {current.kind === "video" ? <SiteVideoLoop key={current.id} video={{ id: section, src: current.url, ...(current.webm ? { webm: current.webm } : {}), poster: current.poster ?? officialVideo[section].poster, ar: current.title_ar || officialVideo[section].ar, en: current.title_en || officialVideo[section].en }} language={language} onUnavailable={() => { if (!current.id.startsWith("builtin-")) setActive(items.length - 1); }} onEnded={items.length > 1 ? () => setActive(value => (value + 1) % items.length) : undefined} /> : <figure className="site-media-reel__stage"><ManagedImage mediaContext="SiteMediaReel" src={current.url} alt={title} className="site-media-reel__frame active actual-site-photo" loading="lazy" decoding="async" onError={() => setActive(items.length - 1)} /><figcaption className="photo-placeholder">{title}</figcaption></figure>}
  </div>;
}
