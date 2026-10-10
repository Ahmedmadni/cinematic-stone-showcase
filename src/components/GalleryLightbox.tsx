import { ManagedImage } from '@/components/ManagedImage';
import { useSiteLanguage } from "@/lib/site-language";
import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type TouchEvent as ReactTouchEvent } from "react";
import { gallerySwipeStep, isInteractiveGalleryTarget } from "@/lib/gallery-gestures";
import { X } from "lucide-react";
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

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 1 || isInteractiveGalleryTarget(event.target)) {
      touchStart.current = null;
      return;
    }
    const first = event.touches[0];
    if (first) touchStart.current = { x: first.clientX, y: first.clientY };
  }

  function navigateNext() {
    onNext();
  }

  function navigatePrevious() {
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
      data-lightbox-autoplay="paused"
      aria-label={(language === "en" ? "Gallery · " : "صور ") + title}
      onKeyDown={handleKeyDown}
      onCancel={(event) => { event.preventDefault(); onRequestClose(); }}
      onClick={handleBackdropClick}
    >
      <div className="lightbox-toolbar">
        <span className="latin" dir="ltr">
          {String(position).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
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
        <ManagedImage mediaContext="GalleryLightbox" key={image} className={origin === "actual-site" ? "actual-site-photo" : undefined} data-media-origin={origin} src={image} alt={label} decoding="async" width={1600} height={900} />
        <div className="lightbox-caption">
          <div>
            <span>{replacement}</span>
            <h3>{title} — {label}</h3>
        </div>
      </div>
      </div>
    </dialog>
  );
}
