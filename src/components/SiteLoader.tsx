import { useEffect, useState } from "react";
import logo from "@/assets/alostool-official-logo.png.asset.json";

/** Initial loading screen: waits for first-screen images (max 4.5s), then fades out. */
export function SiteLoader({ language }: { language: string }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "leaving" | "done">("loading");

  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setProgress(100);
      window.setTimeout(() => setPhase("leaving"), 250);
      window.setTimeout(() => setPhase("done"), 1150);
    };
    const images = Array.from(document.images).filter(img => {
      const r = img.getBoundingClientRect();
      return r.top < window.innerHeight * 1.5 && img.loading !== "lazy";
    });
    const videos = Array.from(document.querySelectorAll("video"));
    const items = [...images, ...videos];
    let loaded = 0;
    const tick = () => {
      loaded += 1;
      setProgress(Math.round((loaded / Math.max(items.length, 1)) * 100));
      if (loaded >= items.length) finish();
    };
    if (!items.length) finish();
    images.forEach(img => {
      if (img.complete) tick();
      else { img.addEventListener("load", tick, { once: true }); img.addEventListener("error", tick, { once: true }); }
    });
    videos.forEach(v => {
      if (v.readyState >= 3) tick();
      else { v.addEventListener("canplay", tick, { once: true }); v.addEventListener("error", tick, { once: true }); }
    });
    const timeout = window.setTimeout(finish, 4500);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = phase === "done" ? "" : "hidden";
    return () => { document.documentElement.style.overflow = ""; };
  }, [phase]);

  if (phase === "done") return null;
  return (
    <div className={`site-loader${phase === "leaving" ? " is-leaving" : ""}`} role="status" aria-live="polite">
      <img src={logo.url} alt="" className="site-loader__logo" />
      <div className="site-loader__bar"><span style={{ transform: `scaleX(${progress / 100})` }} /></div>
      <p className="site-loader__label">{language === "ar" ? "جارٍ تجهيز العرض" : "Preparing the presentation"} · {progress}%</p>
    </div>
  );
}
