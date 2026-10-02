import { useSiteLanguage } from "@/lib/site-language";
import { useEffect, useRef, useState } from "react";
import { ArrowUpLeft, FileCheck2, MapPin, Mountain, Pause, Play } from "lucide-react";
import { quarrySites, totalQuarryArea } from "@/data/experience-data";
import aerialOne from "@/assets/quarry-aerial.jpg";
import aerialTwo from "@/assets/quarry-aerial-alt.jpg";
import roads from "@/assets/site-roads.jpg";

const images = [aerialOne, aerialTwo, roads] as const;

/**
 * Three document-supported quarry records, rendered against clearly
 * illustrative aerial photography. These photos do not assert the actual
 * location, shape or legal boundaries of any of the licensed parcels.
 */
export function QuarryAtlas() {
  const { t, language } = useSiteLanguage();
  const frame = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const [inView, setInView] = useState(false);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [interacting, setInteracting] = useState(false);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const current = quarrySites[selected] ?? quarrySites[0];

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), { threshold: 0.15 });
    const element = frame.current;
    if (element) observer.observe(element);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setMotionAllowed(!mq.matches);
    const onPage = () => setPageVisible(!document.hidden);
    onMotion(); onPage();
    mq.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onPage);
    return () => {
      observer.disconnect();
      mq.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onPage);
    };
  }, []);

  const playing = inView && motionAllowed && pageVisible && !interacting && !manuallyPaused;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setSelected(index => (index + 1) % quarrySites.length), 11500);
    return () => window.clearTimeout(timer);
  }, [playing, selected]);

  function chooseSite(index: number) {
    setSelected(index);
    // Keep historical licence details stable after a visitor selects them.
    setManuallyPaused(true);
  }

  return (
    <div className="quarry-atlas quarry-cards" ref={frame} data-quarry-gallery-autoplay={playing ? "playing" : "paused"} aria-label={t("المحاجر الثلاثة وملفات تراخيصها")} onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={(event) => {if(!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);}}>
      <div className="quarry-cards__heading">
        <div>
          <span className="latin" dir="ltr">THREE QUARRIES / LICENSE RECORDS</span>
          <h3>{t("ثلاثة محاجر.")} <em>{t("ملفات واضحة.")}</em></h3>
          <p>{t("اختر محجرًا لتظهر مساحته ورقم رخصته والمرخص له، كما وردت في العرض الاستثماري.")}</p>
        </div>
        <div className="quarry-cards__total">
          <span>{t("إجمالي مساحات المحاجر المذكورة")}</span>
          <strong>{totalQuarryArea.toLocaleString(language === "ar" ? "ar-SA" : "en-US")}</strong>
          <span>{t("متر مربع")}</span>
        </div>
      </div>

      <div className="quarry-cards__autoplay-tools"><span className="latin" dir="ltr">01—03 / PHOTO RECORDS</span><button type="button" aria-pressed={!manuallyPaused} aria-label={manuallyPaused ? (language === "en" ? "Resume quarry photo gallery" : "تشغيل عرض صور المحاجر") : (language === "en" ? "Pause quarry photo gallery" : "إيقاف عرض صور المحاجر")} onClick={() => setManuallyPaused(previous => !previous)}>{manuallyPaused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}</button></div>
      <div className="quarry-cards__layout">
        <div className="quarry-cards__gallery" role="group" aria-label={t("اختيار أحد المحاجر")}>
          {quarrySites.map((entry, index) => (
            <button
              type="button"
              key={entry.id}
              onClick={() => chooseSite(index)}
              aria-pressed={selected === index}
              aria-label={t("عرض ملف") + " " + t(entry.name)}
              className={"quarry-cards__site" + (selected === index ? " is-selected" : "")}
            >
              <img src={images[index]} alt="" loading="lazy" decoding="async" width={1536} height={1024} />
              <span className="quarry-cards__shade" aria-hidden="true" />
              <span className="quarry-cards__site-index latin" dir="ltr">0{index + 1}</span>
              <span className="quarry-cards__site-label">
                <strong>{t(entry.name)}</strong>
                <span>{entry.area.toLocaleString(language === "ar" ? "ar-SA" : "en-US")} m²</span>
              </span>
              <ArrowUpLeft className="quarry-cards__site-arrow" size={22} aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="quarry-cards__information" aria-live={playing ? "off" : "polite"} aria-atomic="true">
          <span className="quarry-cards__info-eyebrow">
            <FileCheck2 size={18} aria-hidden="true" />
            {t("سجل ترخيص — بيانات تاريخية من المستند")}
          </span>
          <div className="quarry-cards__info-head" key={current.id}>
            <span className="latin" dir="ltr">SITE 0{selected + 1} / 03</span>
            <h4>{t(current.name)}</h4>
            <div className="quarry-cards__area">
              <strong>{current.area.toLocaleString(language === "ar" ? "ar-SA" : "en-US")}</strong>
              <span>{t("متر مربع")}</span>
            </div>
          </div>
          <dl>
            <div><dt>{t("رقم الرخصة بالمستند")}</dt><dd dir="ltr">{current.license}</dd></div>
            <div><dt>{t("المرخص له")}</dt><dd>{t(current.permitHolder)}</dd></div>
            <div><dt>{t("الحالة الواردة بالمستند")}</dt><dd>{t(current.documentStatus)}</dd></div>
          </dl>
          <p className="quarry-cards__caveat">{t(current.note)}</p>
          <a href="#التواصل">
            {t("طلب مستندات الترخيص الحديثة")} <ArrowUpLeft size={17} aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="quarry-cards__footer">
        <span><Mountain size={17} aria-hidden="true"/> {t("الصور الجوية توضيحية فقط، ولا تمثل صورًا أو حدودًا أو ترتيبًا جغرافيًا موثقًا لكل محجر.")}</span>
        <a href="#location-title">{t("مراجعة الموقع الاسترشادي في Google Maps")} <MapPin size={16} aria-hidden="true"/></a>
      </div>
    </div>
  );
}
