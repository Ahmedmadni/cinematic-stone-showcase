import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowUpLeft, Compass, ExternalLink, Layers3, MapPinned, MoveUpRight } from "lucide-react";
import quarryAerial from "@/assets/quarry-aerial.jpg";
import { googleMapsOpenUrl, googleSatelliteEmbedSource, quarryReferenceCenter } from "@/data/quarry-map";

const landmarks = [
  {
    id: "extraction",
    name: "مناطق الاستخراج",
    heading: "مساحات الحجر الخام",
    detail: "تمثيل بصري لمدرجات الاستخراج ومسارات المعدات الثقيلة، وليس حدًا مساحيًا موثقًا.",
    x: "32%", y: "33%",
  },
  {
    id: "production",
    name: "الكسارات والفرز",
    heading: "منظومة الإنتاج",
    detail: "تصور تخطيطي لموقعي خطوط التكسير والسيور والفرز؛ لا يعكس توزيع المعدات الفعلي.",
    x: "68%", y: "49%",
  },
  {
    id: "operations",
    name: "المرافق والخدمات",
    heading: "البنية التشغيلية",
    detail: "تمثيل تقريبي للمكاتب ومسارات الشاحنات والخدمات الداعمة بالموقع.",
    x: "48%", y: "76%",
  },
] as const;

/**
 * Dual map experience:
 *  1) live interactive Google satellite iframe at reference coordinates;
 *  2) separate simulated oblique aerial concept using existing project art.
 *
 * Do NOT imply simulated 3D image is from Google, actual drone photography,
 * or accurate licensed quarry geospatial geometry.
 */
export function MapExperience() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [focus, setFocus] = useState<(typeof landmarks)[number]["id"]>("production");
  const [mapAllowed, setMapAllowed] = useState(true);
  const active = landmarks.find((item) => item.id === focus) ?? landmarks[1];

  useEffect(() => {
    const scene = sceneRef.current;
    return () => {
      if (frame.current) window.cancelAnimationFrame(frame.current);
      scene?.style.setProperty("--map-tilt-x", "0deg");
      scene?.style.setProperty("--map-tilt-y", "0deg");
    };
  }, []);

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    const py = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    if (frame.current) window.cancelAnimationFrame(frame.current);
    frame.current = window.requestAnimationFrame(() => {
      sceneRef.current?.style.setProperty("--map-tilt-x", (-py * 3).toFixed(2) + "deg");
      sceneRef.current?.style.setProperty("--map-tilt-y", (px * 3).toFixed(2) + "deg");
      frame.current = 0;
    });
  }

  function resetTilt() {
    if (frame.current) window.cancelAnimationFrame(frame.current);
    frame.current = 0;
    sceneRef.current?.style.setProperty("--map-tilt-x", "0deg");
    sceneRef.current?.style.setProperty("--map-tilt-y", "0deg");
  }

  return (
    <div className="somman-location-experience" aria-label="الخريطة التفاعلية والمنظور التصوري لمحجر الصمان">
      <div className="somman-location-experience__topline">
        <span><MapPinned size={18} aria-hidden="true" /> استكشف الموقع من الأعلى</span>
        <span className="latin" dir="ltr">SATELLITE / 3D CONCEPT</span>
      </div>
      <div className="somman-location-experience__grid">
        <div className="somman-location-experience__google">
          <div className="somman-location-experience__panel-title">
            <div><span className="latin" dir="ltr">01 / GOOGLE MAPS</span><h3>خريطة القمر الصناعي</h3></div>
            <button type="button" onClick={() => setMapAllowed((enabled) => !enabled)} aria-pressed={mapAllowed} className="somman-location-experience__privacy-toggle">{mapAllowed ? "إخفاء الخريطة" : "إظهار الخريطة"}</button>
            <a href={googleMapsOpenUrl} target="_blank" rel="noopener noreferrer" aria-label="فتح موقع المحجر الاسترشادي في خرائط Google بنافذة جديدة">
              فتح الخريطة <ExternalLink size={16} aria-hidden="true"/>
            </a>
          </div>
          <div className="somman-location-experience__map-frame">
            {mapAllowed ? (
              <iframe
                title="Google Maps — مركز استرشادي لإحداثيات رخصة محجر الصمان"
                src={googleSatelliteEmbedSource(import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY)}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <div className="somman-location-experience__map-prompt">
                <MapPinned size={44} strokeWidth={1.3} aria-hidden="true" />
                <h4>استكشف محيط المحجر فعليًا</h4>
                <p>اضغط لتحميل خريطة Google التفاعلية بوضع القمر الصناعي. سيتصل متصفحك بخوادم Google.</p>
                <button type="button" onClick={() => setMapAllowed(true)}>تحميل Google Maps <MoveUpRight size={18} aria-hidden="true"/></button>
                <a href={googleMapsOpenUrl} target="_blank" rel="noopener noreferrer">أو افتح الموقع مباشرة في خرائط Google</a>
              </div>
            )}
          </div>
          <div className="somman-location-experience__coordinates">
            <span>مركز تقريبي محسوب من أركان الرخصة الواردة في المستند</span>
            <strong className="latin" dir="ltr">{quarryReferenceCenter.latitude.toFixed(6)}° N, {quarryReferenceCenter.longitude.toFixed(6)}° E</strong>
          </div>
        </div>
        <div className="somman-location-experience__simulation">
          <div className="somman-location-experience__panel-title">
            <div><span className="latin" dir="ltr">02 / CONCEPTUAL AERIAL</span><h3>منظور مجسّم تصوري</h3></div>
            <span className="somman-location-experience__simulation-badge"><Layers3 size={15} aria-hidden="true"/> تخيّلي</span>
          </div>
          <div
            className="somman-location-experience__scene"
            ref={sceneRef}
            onPointerMove={onPointerMove}
            onPointerLeave={resetTilt}
            aria-label="رسم تصوري علوي لكسارات ومحجر صخري"
          >
            <div className="somman-location-experience__scene-camera" aria-hidden="true">
              <img src={quarryAerial} alt="" loading="lazy" decoding="async" width="1536" height="1024"/>
              <div className="somman-location-experience__shadow" />
            </div>
            <span className="somman-location-experience__compass" aria-hidden="true"><Compass size={24}/> N</span>
            {landmarks.map((landmark, index) => (
              <button
                key={landmark.id}
                type="button"
                aria-pressed={focus === landmark.id}
                aria-label={"استعرض " + landmark.name + " في المشهد التصوري"}
                className={"somman-location-experience__hotspot" + (focus === landmark.id ? " is-active" : "")}
                style={{ left: landmark.x, top: landmark.y }}
                onClick={() => setFocus(landmark.id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
              </button>
            ))}
            <div className="somman-location-experience__scene-caption">
              <small className="latin" dir="ltr">ILLUSTRATIVE VIEW / NOT SURVEY DATA</small>
              <strong>{active.heading}</strong>
              <p>{active.detail}</p>
            </div>
          </div>
          <div className="somman-location-experience__scene-footer">
            <span>تصور بصري مستوحى من طبيعة محاجر الحجر الجيري؛ ليس صورة Google Earth أو تصويرًا موثقًا لموقع الشركة.</span>
            <a href="#التواصل">استفسر عن صور الموقع الحقيقية <ArrowUpLeft size={15} aria-hidden="true"/></a>
          </div>
        </div>
      </div>
      <p className="somman-location-experience__notice">إحداثيات المركز استرشادية مستمدة من أربع نقاط مذكورة بالعرض الاستثماري. لا تمثل حدود المحاجر الثلاثة أو موقع المعدات بدقة، ولا تغني عن التحقق المساحي والرخص الأصلية. قد تختلف إمكانية تحميل Google Maps حسب إعدادات المتصفح والشبكة.</p>
    </div>
  );
}
