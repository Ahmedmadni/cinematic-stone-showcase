import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type GalleryLightboxProps = {
  title: string;
  replacement: string;
  image: string;
  label: string;
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
  position,
  total,
  onNext,
  onPrevious,
  onRequestClose,
}: GalleryLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

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

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onNext();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      onPrevious();
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onRequestClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="gallery-lightbox gallery-lightbox--native"
      aria-label={"صور " + title}
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
          aria-label="إغلاق الصورة"
          onClick={onRequestClose}
        >
          <X size={24} aria-hidden="true" />
        </Button>
      </div>
      <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
        <img src={image} alt={"صورة تجريبية توضيحية: " + label} decoding="async" />
        <div className="lightbox-caption">
          <div>
            <span>صورة تجريبية · {replacement}</span>
            <h3>{title} — {label}</h3>
          </div>
          <div className="lightbox-controls">
            <Button type="button" variant="outline" aria-label="الصورة السابقة" onClick={onPrevious}>
              <ArrowRight size={20} aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" aria-label="الصورة التالية" onClick={onNext}>
              <ArrowLeft size={20} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
