import { useSiteLanguage } from "@/lib/site-language";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type TouchEvent as ReactTouchEvent } from "react";
import { gallerySwipeStep, isInteractiveGalleryTarget } from "@/lib/gallery-gestures";
import { Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type GalleryLightboxProps = {
  title: string;
  replacement: string;
  image: string;
  label: string;
  origin?: "actual-site" | "supplementary";
  position: number;
  total: number;
  onNext: () => void;
  onPrevious: () => void;
  onRequestClose: () => void;
};

/** Native modal dialog: browser-managed inert background, focus and Escape. */
export function GalleryLightbox({
  title,
  replacement,
  image,
  label,
  origin = "supplementary",
  position,
  total,
  onNext,
  onPrevious,
  onRequestClose,
}: GalleryLightboxProps) {
  const { t, language } = useSiteLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const originalFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (originalFocus?.isConnected) originalFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setMotionAllowed(!media.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion(); updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  const playing = motionAllowed && pageVisible && !manuallyPaused && total > 1;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => onNext(), 7700);
    return () => window.clearTimeout(timer);
  }, [playing, image, onNext]);

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 1 || isInteractiveGalleryTarget(event.target)) {
      touchStart.current = null;
      return;
    }
    const first = event.touches[0];
    if (first) touchStart.current = { x: first.clientX, y: first.clientY };
  }

  function navigateNext() {
    setManuallyPaused(true);
    onNext();
  }

  function navigatePrevious() {
    setManuallyPaused(true);
    onPrevious();
  }

  function handleTouchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    const first = touchStart.current;
    touchStart.current = null;
    if (!first || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const step = gallerySwipeStep(touch.clientX - first.x, touch.clientY - first.y, language === "ar" ? "rtl" : "ltr");
    if (!step) return;
    if (step === 1) navigateNext();
    else navigatePrevious();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Tab") {
      const dialog = event.currentTarget;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");

      if (focusable.length === 0) {
        event.preventDefault();
        closeRef.current?.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last?.focus({ preventScroll: true });
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first?.focus({ preventScroll: true });
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (language === "ar") navigateNext();
      else navigatePrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      if (language === "ar") navigatePrevious();
      else navigateNext();
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onRequestClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="gallery-lightbox gallery-lightbox--native"
      data-lightbox-autoplay={playing ? "playing" : "paused"}
      aria-label={(language === "en" ? "Gallery · " : "صور ") + title}
      onKeyDown={handleKeyDown}
      onCancel={(event) => { event.preventDefault(); onRequestClose(); }}
      onClick={handleBackdropClick}
    >
      <div className="lightbox-toolbar">
        <span className="latin" dir="ltr">
          {String(position).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <Button type="button" variant="ghost" disabled={!motionAllowed || total < 2} aria-pressed={!manuallyPaused && motionAllowed} title={!motionAllowed ? (language === "en" ? "Autoplay disabled by reduced motion" : "التحريك التلقائي معطل") : undefined} aria-label={manuallyPaused ? (language === "en" ? "Resume gallery slideshow" : "تشغيل معرض الصور") : (language === "en" ? "Pause gallery slideshow" : "إيقاف معرض الصور")} onClick={() => setManuallyPaused(current => !current)}>{manuallyPaused ? <Play size={20} aria-hidden="true"/> : <Pause size={20} aria-hidden="true"/>}</Button>
        <Button
          ref={closeRef}
          type="button"
          variant="ghost"
          aria-label={t("إغلاق الصورة")}
          onClick={onRequestClose}
        >
          <X size={24} aria-hidden="true" />
        </Button>
      </div>
      <div className="lightbox-content" onClick={event => event.stopPropagation()} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchCancel={() => { touchStart.current = null; }}>
        <img key={image} className={origin === "actual-site" ? "actual-site-photo" : undefined} data-media-origin={origin} src={image} alt={(origin === "actual-site" ? t("تصوير فعلي من الموقع:") : t("مشهد توضيحي مكمل:")) + " " + label} decoding="async" width={1600} height={900} />
        <div className="lightbox-caption">
          <div>
            <span>{origin === "actual-site" ? t("تصوير فعلي من موقع الصمان") : t("مشهد توضيحي مكمل")} · {replacement}</span>
            <h3>{title} — {label}</h3>
        </div>
      </div>
      </div>
    </dialog>
  );
}
