import { useEffect, useRef, useState } from "react";
import { useSiteMedia, type SiteMediaSection } from "@/lib/site-media";

/** Auto-rotating reel of uploaded site photos and videos; renders nothing without uploads. */
export function SiteMediaReel({ section, language, videosOnly = false, interval = 6200 }: { section: SiteMediaSection; language: string; videosOnly?: boolean; interval?: number }) {
  const all = useSiteMedia(section);
  const items = videosOnly ? all.filter(i => i.kind === "video") : all;
  const frame = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    const el = frame.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => setVisible(e?.isIntersecting ?? false), { threshold: 0.15 });
    o.observe(el);
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMotion(!m.matches);
    return () => o.disconnect();
  }, [items.length]);

  const current = items[active % Math.max(items.length, 1)];
  const playing = visible && motion && !document.hidden && items.length > 1;

  useEffect(() => {
    if (!playing || !current || current.kind === "video") return;
    const t = window.setTimeout(() => setActive(a => (a + 1) % items.length), interval);
    return () => window.clearTimeout(t);
  }, [playing, current, items.length, interval]);

  if (!items.length || !current) return null;
  const title = language === "ar" ? current.title_ar || current.title_en : current.title_en || current.title_ar;

  return (
    <figure className="site-media-reel reveal is-visible" ref={frame}>
      <div className="site-media-reel__stage">
        {items.map((item, i) => i === active % items.length ? (
          item.kind === "video"
            ? <video key={item.id} src={item.url} className="site-media-reel__frame active" muted playsInline autoPlay={motion && visible} controls={!motion} preload="metadata" onEnded={() => setActive(a => (a + 1) % items.length)} loop={items.length === 1} />
            : <img key={item.id} src={item.url} alt={title} className="site-media-reel__frame active" loading="lazy" decoding="async" />
        ) : null)}
        <span className="photo-placeholder">{language === "ar" ? "تصوير فعلي من الموقع" : "Actual site footage"}{title ? ` · ${title}` : ""}</span>
        {items.length > 1 && <span className="site-media-reel__count latin" dir="ltr">{String(active % items.length + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>}
      </div>
    </figure>
  );
}
