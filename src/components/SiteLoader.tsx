import { ManagedImage } from '@/components/ManagedImage';
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/official/brand/alostool-logo.png";

/** Only first hero decode and fonts are critical. Every exit is bounded/cancellable. */
export function SiteLoader({ language, onEntered }: { language: string; onEntered: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const complete = useRef<(reason: string) => void>(() => {});
  const callback = useRef(onEntered); callback.current = onEntered;
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<"loading" | "leaving" | "done">("loading");
  const [outcome, setOutcome] = useState("pending");
  const en = language === "en";
  useEffect(() => {
    let finished = false;
    let loaded = 0;
    let exitTimer: number | undefined;
    const node = dialog.current;
    const originalOverflow = document.documentElement.style.overflow;
    node?.showModal();
    document.documentElement.style.overflow = "hidden";
    function finish(reason: string) {
      if (finished) return;
      finished = true; setOutcome(reason); setPhase("leaving");
      exitTimer = window.setTimeout(() => {
        node?.close(); document.documentElement.style.overflow = originalOverflow;
        setPhase("done"); callback.current();
      }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 350);
    }
    complete.current = finish;
    const settled = () => { if (!finished) { loaded += 1; setCount(loaded); if (loaded === 2) finish("ready"); } };
    const image = document.querySelector<HTMLImageElement>(".hero-gallery__photo--active");
    const decode = () => { if (image) void image.decode().then(settled).catch(() => finish("image-error")); };
    const error = () => finish("image-error");
    if (image?.complete && image.naturalWidth > 0) decode();
    else if (image) { image.addEventListener("load", decode, { once: true }); image.addEventListener("error", error, { once: true }); }
    else finish("no-hero");
    void document.fonts.ready.then(settled).catch(() => finish("font-error"));
    const timeout = window.setTimeout(() => finish("timeout"), 4500);
    return () => {
      finished = true; window.clearTimeout(timeout); window.clearTimeout(exitTimer);
      image?.removeEventListener("load", decode); image?.removeEventListener("error", error);
      if (node?.open) node.close();
      document.documentElement.style.overflow = originalOverflow;
    };
  }, []);
  if (phase === "done") return null;
  return <dialog ref={dialog} className={"site-loader" + (phase === "leaving" ? " is-leaving" : "")} data-entry-outcome={outcome} aria-label={en ? "Preparing the presentation" : "تجهيز العرض"} onCancel={event => { event.preventDefault(); complete.current("skipped"); }}>
    <ManagedImage mediaContext="SiteLoader" src={logo} alt="" width={420} height={544} className="site-loader__logo" />
    <div className="site-loader__bar" role="progressbar" aria-label={en ? "Essential media readiness" : "جاهزية الوسائط الأساسية"} aria-valuemin={0} aria-valuemax={2} aria-valuenow={count}><span style={{ transform: `scaleX(${count / 2})` }} /></div>
    <p className="site-loader__label" aria-live="polite">{phase === "loading" ? (en ? "Preparing the presentation" : "جارٍ تجهيز العرض") : (en ? "Opening the presentation" : "جارٍ فتح العرض")}</p>
    <small className="site-loader__detail">{en ? 'Preparing the opening photograph and typography. Videos load when needed.' : 'تجهيز الصورة الافتتاحية والخطوط. تُحمّل الفيديوهات عند الحاجة.'}</small>
    <button type="button" onClick={() => complete.current("skipped")}>{en ? "Enter presentation" : "الدخول إلى العرض"}</button>
  </dialog>;
}
