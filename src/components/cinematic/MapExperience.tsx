import { ManagedImage } from '@/components/ManagedImage';
import { useSiteLanguage } from "@/lib/site-language";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowUpLeft, Compass, ExternalLink, Layers3, MapPinned, MoveUpRight } from "lucide-react";
import { officialMedia } from '@/data/official-media';
import { googleMapsOpenUrl, googleSatelliteEmbedSource, quarryReferenceCenter } from "@/data/quarry-map";

const MAP_TILT_DAMPING = 0.08;
const MAP_TILT_SETTLE_EPSILON = 0.006;
const MAP_TILT_MAX_DEG = 1.6;

const landmarks = [
  {
    id: "extraction",
    name: "مناطق الاستخراج",
    heading: "مساحات الحجر الخام",
    detail: "مدرجات الاستخراج ومسارات حركة المعدات الثقيلة.",
    x: "32%", y: "33%",
  },
  {
    id: "production",
    name: "الكسارات والفرز",
    heading: "منظومة الإنتاج",
    detail: "خطوط التكسير والسيور ومراحل فرز مواد الإنتاج.",
    x: "68%", y: "49%",
  },
  {
    id: "operations",
    name: "المرافق والخدمات",
    heading: "البنية التشغيلية",
    detail: "المكاتب ومسارات الشاحنات والخدمات الداعمة بالموقع.",
    x: "48%", y: "76%",
  },
] as const;

/**
 * Dual map experience:
 *  1) live interactive Google satellite iframe at reference coordinates;
 *  2) a supplied Al Somman photograph with category navigation markers.
 *
 * Marker positions are navigation aids, not surveyed quarry geometry.
 */
export function MapExperience() {
  const { t, language } = useSiteLanguage();
  const sceneRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const tilt = useRef({ currentX: 0, currentY: 0, targetX: 0, targetY: 0 });
  const [focus, setFocus] = useState<(typeof landmarks)[number]["id"]>("production");
  const [mapAllowed, setMapAllowed] = useState(false);
  const active = landmarks.find((item) => item.id === focus) ?? landmarks[1];

  useEffect(() => {
    const scene = sceneRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionPreference = () => {
      if (!reducedMotion.matches) return;
      tilt.current.currentX = 0;
      tilt.current.currentY = 0;
      tilt.current.targetX = 0;
      tilt.current.targetY = 0;
      if (frame.current) window.cancelAnimationFrame(frame.current);
      frame.current = 0;
      scene?.style.setProperty("--map-tilt-x", "0deg");
      scene?.style.setProperty("--map-tilt-y", "0deg");
    };

    reducedMotion.addEventListener("change", handleMotionPreference);
    handleMotionPreference();

    return () => {
      reducedMotion.removeEventListener("change", handleMotionPreference);
      if (frame.current) window.cancelAnimationFrame(frame.current);
      scene?.style.setProperty("--map-tilt-x", "0deg");
      scene?.style.setProperty("--map-tilt-y", "0deg");
    };
  }, []);

  function animateTilt() {
    const state = tilt.current;
    state.currentX += (state.targetX - state.currentX) * MAP_TILT_DAMPING;
    state.currentY += (state.targetY - state.currentY) * MAP_TILT_DAMPING;

    sceneRef.current?.style.setProperty("--map-tilt-x", (state.currentX * MAP_TILT_MAX_DEG).toFixed(2) + "deg");
    sceneRef.current?.style.setProperty("--map-tilt-y", (state.currentY * MAP_TILT_MAX_DEG).toFixed(2) + "deg");

    const settling =
      Math.abs(state.targetX - state.currentX) > MAP_TILT_SETTLE_EPSILON ||
      Math.abs(state.targetY - state.currentY) > MAP_TILT_SETTLE_EPSILON;

    frame.current = settling ? window.requestAnimationFrame(animateTilt) : 0;
  }

  function scheduleTilt() {
    if (!frame.current) frame.current = window.requestAnimationFrame(animateTilt);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const px = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    const py = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    tilt.current.targetX = -py;
    tilt.current.targetY = px;
    scheduleTilt();
  }

  function resetTilt() {
    tilt.current.targetX = 0;
    tilt.current.targetY = 0;
    scheduleTilt();
  }

  return (
    <div className="somman-location-experience" aria-label={t("الخريطة التفاعلية وعرض موقع محجر الصمان")}>
      <div className="somman-location-experience__topline">
        <span><MapPinned size={18} aria-hidden="true" /> {t("استكشف الموقع من الأعلى")}</span>
        <span className="latin" dir="ltr">SATELLITE / AL SOMMAN</span>
      </div>
      <div className="somman-location-experience__grid">
        <div className="somman-location-experience__google">
          <div className="somman-location-experience__panel-title">
            <div><span className="latin" dir="ltr">01 / GOOGLE MAPS</span><h3>{t("خريطة القمر الصناعي")}</h3></div>
            <button type="button" onClick={() => setMapAllowed((enabled) => !enabled)} aria-pressed={mapAllowed} className="somman-location-experience__privacy-toggle">{mapAllowed ? t("إخفاء الخريطة") : t("إظهار الخريطة")}</button>
            <a href={googleMapsOpenUrl} target="_blank" rel="noopener noreferrer" aria-label={t("فتح موقع المحجر الاسترشادي في خرائط Google بنافذة جديدة")}>
              {t("فتح الخريطة")} <ExternalLink size={16} aria-hidden="true"/>
            </a>
          </div>
          <div className="somman-location-experience__map-frame">
            {mapAllowed ? (
              <iframe
                title={t("Google Maps — مركز استرشادي لإحداثيات رخصة محجر الصمان")}
                src={googleSatelliteEmbedSource(import.meta.env["VITE_GOOGLE_MAPS_EMBED_KEY"]).replace("hl=ar", "hl=" + language).replace("language=ar", "language=" + language)}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <div className="somman-location-experience__map-prompt">
                <MapPinned size={44} strokeWidth={1.3} aria-hidden="true" />
                <h4>{t("استكشف محيط المحجر")}</h4>
                <p>{t("اضغط لتحميل خريطة Google التفاعلية بوضع القمر الصناعي. سيتصل متصفحك بخوادم Google.")}</p>
                <button type="button" onClick={() => setMapAllowed(true)}>{t("تحميل Google Maps")} <MoveUpRight size={18} aria-hidden="true"/></button>
                <a href={googleMapsOpenUrl} target="_blank" rel="noopener noreferrer">{t("أو افتح الموقع مباشرة في خرائط Google")}</a>
              </div>
            )}
          </div>
          <div className="somman-location-experience__coordinates">
            <span>{t("مركز تقريبي محسوب من أركان الرخصة الواردة في المستند")}</span>
            <strong className="latin" dir="ltr">{quarryReferenceCenter.latitude.toFixed(6)}° N, {quarryReferenceCenter.longitude.toFixed(6)}° E</strong>
          </div>
        </div>
        <div className="somman-location-experience__simulation">
          <div className="somman-location-experience__panel-title">
            <div><span className="latin" dir="ltr">02 / AERIAL VIEW</span><h3>{language === 'en' ? 'Al Somman aerial view' : 'المشهد الجوي للصمان'}</h3></div>
            <span className="somman-location-experience__simulation-badge"><Layers3 size={15} aria-hidden="true"/> {language === 'en' ? 'Site overview' : 'نظرة على الموقع'}</span>
          </div>
          <div
            className="somman-location-experience__scene"
            ref={sceneRef}
            onPointerMove={onPointerMove}
            onPointerLeave={resetTilt}
            aria-label={language === 'en' ? 'Aerial view with category selectors' : 'مشهد جوي مع أزرار الفئات'}
          >
            <div className="somman-location-experience__scene-camera" aria-hidden="true">
              <ManagedImage mediaContext="MapExperience" src={officialMedia.hero[0].image} alt="" loading="lazy" decoding="async" width="1600" height="900"/>
              <div className="somman-location-experience__shadow" />
            </div>
            <span className="somman-location-experience__compass" aria-hidden="true"><Compass size={24}/> N</span>
            {landmarks.map((landmark, index) => (
              <button
                key={landmark.id}
                type="button"
                aria-pressed={focus === landmark.id}
                aria-label={t("استعرض") + " " + t(landmark.name) + " " + t("في عرض الموقع")}
                className={"somman-location-experience__hotspot" + (focus === landmark.id ? " is-active" : "")}
                style={{ left: landmark.x, top: landmark.y }}
                onClick={() => setFocus(landmark.id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
              </button>
            ))}
            <div className="somman-location-experience__scene-caption">
              <small className="latin" dir="ltr">AERIAL VIEW / MARKERS ARE NOT SURVEY DATA</small>
              <strong>{t(active.heading)}</strong>
              <p>{t(active.detail)}</p>
            </div>
          </div>
          <div className="somman-location-experience__scene-footer">
            <span>{language === 'en' ? 'Category markers are navigation aids, not surveyed positions or permit boundaries.' : 'علامات الفئات للتنقل فقط، ولا تحدد مواضع مساحية أو حدود تراخيص.'}</span>
            <a href="#site-gallery-title">{language === 'en' ? 'Browse the site photographs' : 'تصفح صور الموقع'} <ArrowUpLeft size={15} aria-hidden="true"/></a>
          </div>
        </div>
      </div>
      <p className="somman-location-experience__notice">{t("إحداثيات المركز استرشادية مستمدة من أربع نقاط مذكورة بالعرض الاستثماري. لا تمثل حدود المحاجر الثلاثة أو موقع المعدات بدقة، ولا تغني عن التحقق المساحي والرخص الأصلية. قد تختلف إمكانية تحميل Google Maps حسب إعدادات المتصفح والشبكة.")}</p>
    </div>
  );
}
