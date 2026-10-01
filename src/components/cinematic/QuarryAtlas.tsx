import { useState } from "react";
import { ArrowUpLeft, Compass, Layers3 } from "lucide-react";
import { quarrySites, totalQuarryArea } from "@/data/experience-data";

/**
 * A deliberately non-geographic illustrated atlas: the source provides
 * independent permit coordinates, but not a verified unified survey map.
 */
export function QuarryAtlas() {
  const [active, setActive] = useState(0);
  const site = quarrySites[active] ?? quarrySites[0];

  return (
    <div className="quarry-atlas">
      <div className="quarry-atlas__topline">
        <span><Layers3 size={17} aria-hidden="true" /> تصور بصري لمساحات المحاجر</span>
        <span className="latin" dir="ltr">THREE QUARRIES / ONE OVERVIEW</span>
      </div>
      <div className="quarry-atlas__body">
        <div className="quarry-atlas__field" role="group" aria-label="اختيار أحد المحاجر الثلاثة">
          <div className="quarry-atlas__contours" aria-hidden="true" />
          {quarrySites.map((entry, index) => (
            <button
              type="button"
              key={entry.id}
              className={"quarry-atlas__tile quarry-atlas__tile--" + (index + 1) + (active === index ? " is-active" : "")}
              onClick={() => setActive(index)}
              aria-pressed={active === index}
            >
              <span className="quarry-atlas__tile-number latin" dir="ltr">0{index + 1}</span>
              <span className="quarry-atlas__tile-title">{entry.name}</span>
              <span className="quarry-atlas__tile-size">{entry.area.toLocaleString("ar-SA")} <small>م²</small></span>
            </button>
          ))}
          <div className="quarry-atlas__annotation" aria-hidden="true">
            <Compass size={26} strokeWidth={1.2} /><span className="latin" dir="ltr">ILLUSTRATIVE ATLAS</span>
          </div>
        </div>
        <div className="quarry-atlas__readout" aria-live="polite" aria-atomic="true">
          <span className="quarry-atlas__mini-label">ملف المحجر المحدد</span>
          <span className="latin quarry-atlas__record" dir="ltr">SITE 0{active + 1}</span>
          <h3>{site.name}</h3>
          <div className="quarry-atlas__metric">
            <strong>{site.area.toLocaleString("ar-SA")}</strong><span>م²</span>
          </div>
          <dl>
            <div><dt>رقم الرخصة</dt><dd dir="ltr">{site.license}</dd></div>
            <div><dt>المرخص له بالمستند</dt><dd>{site.permitHolder}</dd></div>
            <div><dt>الحالة الواردة بالمستند</dt><dd>{site.documentStatus}</dd></div>
          </dl>
          <p>{site.note}</p>
          <a href="#التواصل">طلب معلومات محدثة عن الترخيص <ArrowUpLeft size={17} aria-hidden="true" /></a>
        </div>
      </div>
      <div className="quarry-atlas__footer">
        <p>هذا رسم تجريدي للتفاعل فقط؛ مواضع الأشكال لا تمثل الحدود أو الاتجاهات أو المسافات الجغرافية. حالة التراخيص المذكورة من نسخة العرض وليست تحققًا آنيًا من الوزارة.</p>
        <span>إجمالي المساحات الواردة: <strong>{totalQuarryArea.toLocaleString("ar-SA")} م²</strong></span>
      </div>
    </div>
  );
}
