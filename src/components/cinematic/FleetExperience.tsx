import { ManagedImage } from '@/components/ManagedImage';
import { useSiteLanguage } from "@/lib/site-language";
import { useEffect, useRef, useState } from "react";
import { ArrowDownLeft, Gauge, Mouse, Pickaxe, Truck, Zap } from "lucide-react";
import { AtmosphereLayers } from "@/components/cinematic/AtmosphereLayers";
import { fleetSceneTarget } from "@/lib/cinematic-progress";
import { fleetFacts } from "@/data/experience-data";
import { officialMedia } from "@/data/official-media";

const images = [officialMedia.equipment.lineup.image, officialMedia.equipment.front.image, officialMedia.facilities.weighbridge.image, officialMedia.facilities.workshop.image] as const;
const icons = [Pickaxe, Truck, Gauge, Zap] as const;
const sceneTotal = fleetFacts.length;

type SceneUpdate = { index: number; progress: number };
const fleetSceneEvent = "somman:fleet-scene";

/**
 * Native scroll controls the scenes via CinematicDirector. No scroll-jacking,
 * timers or render-per-scroll React state updates: one update per chapter.
 *
 * Buttons also work with keyboard, touch and reduced-motion preferences.
 */
export function FleetExperience() {
  const { t, language } = useSiteLanguage();
  const trackRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const current = fleetFacts[selected] ?? fleetFacts[0];

  useEffect(() => {
    function onScrollChapter(event: Event) {
      const { index } = (event as CustomEvent<SceneUpdate>).detail;
      if (typeof index === "number" && index >= 0 && index < sceneTotal) {
        setSelected((previous) => previous === index ? previous : index);
      }
    }
    window.addEventListener(fleetSceneEvent, onScrollChapter);
    const activeScene = Number(document.querySelector(".presentation")?.getAttribute("data-cinema-fleet-scene"));
    if (Number.isInteger(activeScene) && activeScene >= 0 && activeScene < sceneTotal) {
      setSelected(activeScene);
    }
    return () => window.removeEventListener(fleetSceneEvent, onScrollChapter);
  }, []);

  function chooseScene(index: number) {
    setSelected(index);
    const track = trackRef.current;
    if (!track) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // In the static layout, keep the manual selection.
    const rect = track.getBoundingClientRect();
    const distance = Math.max(0, rect.height - window.innerHeight);
    const start = window.scrollY + rect.top;
    const target = start + distance * fleetSceneTarget(index, sceneTotal);
    window.scrollTo({ top: target, behavior: "smooth" });
  }

  return (
    <div className="fleet-experience" id="equipment-experience">
      <div className="fleet-experience__header reveal">
        <div>
          <span className="fleet-experience__eyebrow">
            <span className="latin" dir="ltr">03 / SCROLL-DRIVEN FLEET</span> {t("— الأصول والمعدات")}
          </span>
          <h2 id="equipment-title">{t("أربعة مشاهد.")} <em>{t("قوة واحدة.")}</em></h2>
        </div>
        <div className="fleet-experience__introduction">
          <p>{t("حرّك الصفحة لاكتشاف معدات المحجر واحدة تلو الأخرى؛ أو اختر أي فئة للانتقال مباشرة إلى مشهدها.")}</p>
          <span className="fleet-experience__instruction"><Mouse size={17} aria-hidden="true" /> {t("مرّر لاكتشاف المشهد التالي")}</span>
        </div>
      </div>

      <div className="fleet-experience__scroll" id="fleet-scroll-track" ref={trackRef}>
        <div className="fleet-experience__composition">
          <div className="fleet-experience__stage" aria-label={language === 'en' ? 'Al Somman equipment' : 'معدات الصمان'}>
            {fleetFacts.map((item, index) => (
              <ManagedImage mediaContext="FleetExperience"
                key={item.id}
                src={images[index]}
                alt={index === selected ? (index === 3 ? (language === 'en' ? 'Maintenance workshop; generator detail is unavailable' : 'ورشة الصيانة؛ لا تتوفر لقطة تفصيلية للمولدات') : t(item.name)) : ""}
                aria-hidden={index !== selected}
                className={"fleet-experience__image fleet-experience__image--" + index + (index === selected ? " is-active" : index === selected - 1 ? " is-underlay" : "")}
                loading="lazy"
                decoding="async"
                width={1536}
                height={1024}
              />
            ))}
            <div className="fleet-experience__shade" aria-hidden="true" />
            <AtmosphereLayers variant="fleet" />
            <span className="fleet-experience__photo-note">{language === 'en' ? 'The power chapter shows the support workshop; a generator detail is unavailable.' : 'يعرض فصل الطاقة ورشة الخدمات؛ لا تتوفر لقطة تفصيلية للمولدات.'}</span>
            <div className="fleet-experience__headline">
              <span className="latin" dir="ltr">{current.eyebrow} / {current.number}</span>
              <strong key={current.id}>{t(current.name)}</strong>
            </div>
            <div className="fleet-experience__corners" aria-hidden="true" />
            <div className="fleet-experience__image-progress" aria-hidden="true"><span /></div>
            <span className="fleet-experience__stage-number latin" aria-hidden="true" dir="ltr">0{selected + 1} / 0{sceneTotal}</span>
          </div>

          <div className="fleet-experience__console">
            <div className="fleet-experience__console-label">
              <span className="latin" dir="ltr">EXPLORE / BY SCROLL</span>
              <span>{t("الأصول والمعدات")}</span>
            </div>
            <div className="fleet-experience__selectors" role="group" aria-label={t("فئات معدات المحجر")}>
              {fleetFacts.map((item, index) => {
                const Icon = icons[index] ?? Pickaxe;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected === index}
                    aria-label={t("مشهد") + " " + (index + 1) + " " + t("من") + " " + sceneTotal + " — " + t(item.name)}
                    className={"fleet-experience__selector" + (selected === index ? " is-selected" : "")}
                    onClick={() => chooseScene(index)}
                  >
                    <span className="fleet-experience__selector-icon"><Icon size={18} strokeWidth={1.6} aria-hidden="true" /></span>
                    <span>{t(item.name)}</span>
                    <span className="latin" dir="ltr">{item.number}</span>
                    <span className="fleet-experience__selector-fill" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            <div className="fleet-experience__actual-evidence" aria-label={t("معدات موقع الصمان")}>
              <span className="fleet-experience__actual-label"><span className="latin" dir="ltr">AL SOMMAN / 02</span>{t("معدات الموقع")}</span>
              <div className="fleet-experience__actual-grid">
                {[officialMedia.equipment.loader, officialMedia.equipment.lineup].map((item) => (
                  <figure key={item.image}>
                    <ManagedImage mediaContext="FleetExperience"
                      className="actual-site-photo"
                      src={item.image}
                      alt={language === "en" ? item.en : item.ar}
                      loading="lazy"
                      decoding="async"
                      width={1600}
                      height={900}
                    />
                    <figcaption>{language === "en" ? item.en : item.ar}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
            <div className="fleet-experience__detail" aria-live="polite" aria-atomic="true">
              <div key={current.id} className="fleet-experience__detail-inner">
                <span className="fleet-experience__detail-eyebrow latin" dir="ltr">{current.eyebrow}</span>
                <div className="fleet-experience__count" dir="rtl">
                  <strong>{current.count.toLocaleString(language === "ar" ? "ar-SA" : "en-US")}</strong><span>{t(current.unit)}</span>
                </div>
                <p>{t(current.description)}</p>
                <small>{t(current.supporting)}</small>
              </div>
            </div>
            <div className="fleet-experience__console-footer">
              <span role="status" className="fleet-experience__counter">{t("المشهد")} {selected + 1} {t("من")} {sceneTotal}</span>
              <a href="#site-gallery-title" className="fleet-experience__next">
                {t("شاهد مرافق الموقع")} <ArrowDownLeft size={17} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
