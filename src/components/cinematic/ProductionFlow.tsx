import { ManagedImage } from '@/components/ManagedImage';
import { useSiteLanguage } from "@/lib/site-language";
import { useEffect, useRef, useState } from "react";
import { ArrowDownLeft, Layers3, Mouse, Mountain, Truck } from "lucide-react";
import { productionSteps } from "@/data/experience-data";
import { fleetSceneTarget } from "@/lib/cinematic-progress";
import { officialMedia } from "@/data/official-media";

const stepPhotos = [
  { image: officialMedia.hero[2].image, origin: "actual-site" as const },
  { image: officialMedia.production.crusher.image, origin: "actual-site" as const },
  { image: officialMedia.equipment.loader.image, origin: "actual-site" as const },
] as const;
const icons = [Mountain, Layers3, Truck] as const;
const noteLabels = ["الاستخراج والتجهيز", "التكسير والفرز", "التحميل وضبط الكميات"] as const;
const motionEvent = "somman:material-scene";

/**
 * Three visible production operations, illustrated by actual image assets
 * already used by this project. Native scroll drives the chapters through the
 * shared CinematicDirector; buttons work without motion or on touch screens.
 */
export function ProductionFlow() {
  const { t } = useSiteLanguage();
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const current = productionSteps[active] ?? productionSteps[0];

  useEffect(() => {
    const onChange = (event: Event) => {
      const index = (event as CustomEvent<{ index: number }>).detail?.index;
      if (Number.isInteger(index) && index >= 0 && index < productionSteps.length) {
        setActive((previous) => previous === index ? previous : index);
      }
    };
    window.addEventListener(motionEvent, onChange);
    const scene = Number(document.querySelector(".presentation")?.getAttribute("data-cinema-material-scene"));
    if (Number.isInteger(scene) && scene >= 0 && scene < productionSteps.length) setActive(scene);
    return () => window.removeEventListener(motionEvent, onChange);
  }, []);

  function chooseStep(index: number) {
    setActive(index);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const distance = Math.max(0, rect.height - window.innerHeight);
    window.scrollTo({
      top: window.scrollY + rect.top + distance * fleetSceneTarget(index, productionSteps.length),
      behavior: "smooth",
    });
  }

  return (
    <div className="production-flow production-flow--story" aria-label={t("مراحل دورة الحجر الخام")}>
      <div className="production-flow__top">
        <span className="latin" dir="ltr">THE MATERIAL JOURNEY</span>
        <span>{t("كيف يتحول الحجر الخام إلى بحص جاهز للتحميل؟")}</span>
      </div>
      <div className="production-flow__track" id="material-scroll-track" ref={trackRef}>
        <div className="production-flow__story">
          <div className="production-flow__navigation">
            <div className="production-flow__chapter-intro">
              <span className="latin" dir="ltr">FROM ROCK TO PRODUCT / 03</span>
              <h3>{t("من الصخر الخام")} <em>{t("إلى المنتج.")}</em></h3>
              <p>{t("ثلاث مراحل تشغيلية مترابطة ضمن منظومة الكسارات والفرز والتحميل.")}</p>
              <span className="production-flow__instruction"><Mouse size={15} aria-hidden="true" /> {t("مرّر للانتقال بين المراحل أو اختر مرحلة مباشرة")}</span>
            </div>
            <div className="production-flow__steps" role="group" aria-label={t("اختر مرحلة الإنتاج")}>
              {productionSteps.map((step, index) => {
                const Icon = icons[index] ?? Layers3;
                return (
                  <button
                    key={step.id}
                    type="button"
                    aria-label={t("المرحلة") + " " + step.number + " — " + t(step.title)}
                    aria-pressed={active === index}
                    className={"production-flow__step" + (index === active ? " is-active" : "")}
                    onClick={() => chooseStep(index)}
                  >
                    <span className="latin" dir="ltr">{step.number}</span>
                    <strong>{t(step.title)}</strong>
                    <Icon size={21} strokeWidth={1.5} aria-hidden="true" />
                    <span className="production-flow__step-line" aria-hidden="true"/>
                  </button>
                );
              })}
            </div>
            <p className="production-flow__scroll-note">{t("يعرض هذا الفصل المحجر والتكسير ومعدات التحميل.")}</p>
          </div>

          <div className="production-flow__visual" aria-live="polite" aria-atomic="true">
            {productionSteps.map((step, index) => (
              <ManagedImage mediaContext="ProductionFlow"
                src={(stepPhotos[index] ?? stepPhotos[0]).image}
                key={step.id}
                alt={active === index ? t("المرحلة") + " " + t(step.title) : ""}
                aria-hidden={active !== index}
                className={"production-flow__photo production-flow__photo--" + index + ((stepPhotos[index] ?? stepPhotos[0]).origin === "actual-site" ? " actual-site-photo" : "") + (index === active ? " is-active" : index === active - 1 ? " is-underlay" : "")}
                loading="lazy"
                decoding="async"
                width={1536}
                height={1024}
              />
            ))}
            <div className="production-flow__photo-shade" aria-hidden="true" />
            <div className="production-flow__photo-header">
              <span className="latin" dir="ltr">{current.number} / 03</span>
              <span>{t(noteLabels[active] ?? noteLabels[0])}</span>
            </div>
            <div className="production-flow__photo-info" key={current.id}>
              <span className="production-flow__indicator">{t(current.indicator)}</span>
              <h4>{t(current.title)}</h4>
              <p>{t(current.detail)}</p>
              <small>{t("ملخص توضيحي من العرض الاستثماري؛ لا يمثل مخطط تشغيل هندسيًا أو مراقبة تشغيل مباشرة.")}</small>
            </div>
            <div className="production-flow__stage-progress" aria-hidden="true"><span /></div>
            <a className="production-flow__visual-marker" href="#equipment-title" aria-label={t("تجاوز مشاهد رحلة الحجر والانتقال إلى قسم المعدات")}>{t("إلى المعدات")} <ArrowDownLeft size={18} aria-hidden="true" /></a>
          </div>
        </div>
      </div>
      <a className="production-flow__continue" href="#equipment-title">{t("اكتشف المعدات التي تشغّل المنظومة")} <ArrowDownLeft size={17} aria-hidden="true"/></a>
    </div>
  );
}
