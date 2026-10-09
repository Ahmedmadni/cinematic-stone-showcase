import { ManagedImage } from "@/components/ManagedImage";
import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { Play, X } from "lucide-react";
import { useSiteLanguage } from "@/lib/site-language";
import { officialVideo } from "@/data/official-video";
import { useManagedVideo } from "@/lib/media-management";

function TourDialog({
  onClose,
  opener,
}: {
  onClose: () => void;
  opener: RefObject<HTMLButtonElement | null>;
}) {
  const { language } = useSiteLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const [failed, setFailed] = useState(false);
  const failedSources = useRef(0);
  function sourceError() {
    failedSources.current += 1;
    if (failedSources.current >= (video.webm ? 2 : 1)) setFailed(true);
  }
  const en = language === "en";
  const video = useManagedVideo(officialVideo.fullTour, "FullSiteTour");
  useEffect(() => {
    const node = dialog.current;
    const focusTarget = opener.current ?? document.activeElement;
    const overflow = document.body.style.overflow;
    if (!node) return;
    node.showModal();
    document.body.style.overflow = "hidden";
    close.current?.focus({ preventScroll: true });
    return () => {
      node.querySelector("video")?.pause();
      if (node.open) node.close();
      document.body.style.overflow = overflow;
      if (focusTarget instanceof HTMLElement && focusTarget.isConnected)
        focusTarget.focus({ preventScroll: true });
    };
  }, [opener]);
  function trap(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const node = event.currentTarget;
    const elements = Array.from(
      node.querySelectorAll<HTMLElement>("button:not([disabled]), video[controls], a[href]"),
    );
    const first = elements[0],
      last = elements.at(-1),
      active = document.activeElement;
    if (event.shiftKey && (active === first || !node.contains(active))) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && (active === last || !node.contains(active))) {
      event.preventDefault();
      first?.focus();
    }
  }
  return (
    <dialog
      ref={dialog}
      className="site-tour-dialog"
      aria-label={en ? video.en : video.ar}
      onKeyDown={trap}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header>
        <strong>{en ? video.en : video.ar}</strong>
        <button
          ref={close}
          type="button"
          aria-label={en ? "Close site tour" : "إغلاق جولة الموقع"}
          onClick={onClose}
        >
          <X size={24} aria-hidden="true" />
        </button>
      </header>
      <video
        poster={video.poster}
        controls
        autoPlay
        playsInline
        preload="metadata"
        aria-label={
          en
            ? "Complete supplied site tour, without audio"
            : "الجولة الكاملة المرفقة للموقع، دون صوت"
        }
        onError={(event) => {
          if (event.target === event.currentTarget) setFailed(true);
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
      <p>
        {failed
          ? en
            ? "The film could not play. You can still browse the site photographs."
            : "تعذّر تشغيل الفيديو. يمكنك متابعة صور الموقع."
          : video.src !== officialVideo.fullTour.src
            ? en
              ? "Selected site video."
              : "فيديو الموقع المختار."
            : en
              ? "2:57 · Actual site footage · Original recording has no audio."
              : "٢:٥٧ · تصوير فعلي للموقع · التسجيل الأصلي دون صوت."}
      </p>
    </dialog>
  );
}

/** The 177-second film has no mounted video/source/request before visitor opt-in. */
export function FullSiteTour() {
  const { language } = useSiteLanguage();
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const en = language === "en";
  const video = useManagedVideo(officialVideo.fullTour, "FullSiteTour");
  return (
    <section className="site-tour" aria-labelledby="site-tour-title" data-tour-open={open}>
      <div>
        <span className="latin">INSIDE AL SOMMAN / THE FILM</span>
        <h3 id="site-tour-title">{en ? "Inside Al Somman." : "داخل الصمان."}</h3>
        <p>
          {en
            ? "The complete filmed route through the plant, equipment, facilities and quarry."
            : "الجولة المصوّرة الكاملة بين خطوط الكسارة والمعدات والمرافق والمحجر."}
        </p>
      </div>
      <button
        ref={opener}
        className="site-tour__open"
        type="button"
        onClick={() => setOpen(true)}
        aria-label={en ? "Watch the full site tour" : "مشاهدة الجولة الكاملة للموقع"}
      >
        <ManagedImage
          mediaContext="FullSiteTour"
          src={video.poster}
          alt=""
          width={1280}
          height={720}
          loading="lazy"
          decoding="async"
        />
        <span>
          <Play size={24} aria-hidden="true" />
          {video.src !== officialVideo.fullTour.src
            ? en
              ? "Watch selected film"
              : "مشاهدة الفيديو المختار"
            : en
              ? "Watch full tour · 2:57"
              : "مشاهدة الجولة الكاملة · ٢:٥٧"}
        </span>
      </button>
      {open && <TourDialog opener={opener} onClose={() => setOpen(false)} />}
    </section>
  );
}
