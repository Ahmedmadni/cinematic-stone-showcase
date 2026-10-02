import { useState } from "react";
import { ArrowUpLeft, FileCheck2, MapPin, Mountain } from "lucide-react";
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
  const [selected, setSelected] = useState(0);
  const current = quarrySites[selected] ?? quarrySites[0];

  return (
    <div className="quarry-atlas quarry-cards" aria-label="المحاجر الثلاثة وملفات تراخيصها">
      <div className="quarry-cards__heading">
        <div>
          <span className="latin" dir="ltr">THREE QUARRIES / LICENSE RECORDS</span>
          <h3>ثلاثة محاجر. <em>ملفات واضحة.</em></h3>
          <p>اختر محجرًا لتظهر مساحته ورقم رخصته والمرخص له، كما وردت في العرض الاستثماري.</p>
        </div>
        <div className="quarry-cards__total">
          <span>إجمالي مساحات المحاجر المذكورة</span>
          <strong>{totalQuarryArea.toLocaleString("ar-SA")}</strong>
          <span>متر مربع</span>
        </div>
      </div>

      <div className="quarry-cards__layout">
        <div className="quarry-cards__gallery" role="group" aria-label="اختيار أحد المحاجر">
          {quarrySites.map((entry, index) => (
            <button
              type="button"
              key={entry.id}
              onClick={() => setSelected(index)}
              aria-pressed={selected === index}
              aria-label={"عرض ملف " + entry.name}
              className={"quarry-cards__site" + (selected === index ? " is-selected" : "")}
            >
              <img src={images[index]} alt="" loading="lazy" decoding="async" width={1536} height={1024} />
              <span className="quarry-cards__shade" aria-hidden="true" />
              <span className="quarry-cards__site-index latin" dir="ltr">0{index + 1}</span>
              <span className="quarry-cards__site-label">
                <strong>{entry.name}</strong>
                <span>{entry.area.toLocaleString("ar-SA")} م²</span>
              </span>
              <ArrowUpLeft className="quarry-cards__site-arrow" size={22} aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="quarry-cards__information" aria-live="polite" aria-atomic="true">
          <span className="quarry-cards__info-eyebrow">
            <FileCheck2 size={18} aria-hidden="true" />
            سجل ترخيص — بيانات تاريخية من المستند
          </span>
          <div className="quarry-cards__info-head" key={current.id}>
            <span className="latin" dir="ltr">SITE 0{selected + 1} / 03</span>
            <h4>{current.name}</h4>
            <div className="quarry-cards__area">
              <strong>{current.area.toLocaleString("ar-SA")}</strong>
              <span>متر مربع</span>
            </div>
          </div>
          <dl>
            <div><dt>رقم الرخصة بالمستند</dt><dd dir="ltr">{current.license}</dd></div>
            <div><dt>المرخص له</dt><dd>{current.permitHolder}</dd></div>
            <div><dt>الحالة الواردة بالمستند</dt><dd>{current.documentStatus}</dd></div>
          </dl>
          <p className="quarry-cards__caveat">{current.note}</p>
          <a href="#التواصل">
            طلب مستندات الترخيص الحديثة <ArrowUpLeft size={17} aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="quarry-cards__footer">
        <span><Mountain size={17} aria-hidden="true"/> الصور الجوية توضيحية فقط، ولا تمثل صورًا أو حدودًا أو ترتيبًا جغرافيًا موثقًا لكل محجر.</span>
        <a href="#location-title">مراجعة الموقع الاسترشادي في Google Maps <MapPin size={16} aria-hidden="true"/></a>
      </div>
    </div>
  );
}
