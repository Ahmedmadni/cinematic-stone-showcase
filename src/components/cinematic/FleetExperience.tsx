import { useState } from "react";
import { ArrowDownLeft, Pickaxe, Gauge, Zap, Truck } from "lucide-react";
import { fleetFacts } from "@/data/experience-data";
import excavators from "@/assets/excavators.jpg";
import loaders from "@/assets/loaders-maintenance.jpg";
import weighbridges from "@/assets/generators-weighbridge.jpg";
import equipment from "@/assets/equipment.jpg";

const images = [excavators, loaders, weighbridges, equipment] as const;
const icons = [Pickaxe, Truck, Gauge, Zap] as const;

/** Self-contained equipment chapter: interactive focus, not an auto-playing carousel. */
export function FleetExperience() {
  const [selected, setSelected] = useState(0);
  const current = fleetFacts[selected] ?? fleetFacts[0];

  return (
    <div className="fleet-experience" id="equipment-experience">
      <div className="fleet-experience__header reveal">
        <div>
          <span className="fleet-experience__eyebrow"><span className="latin" dir="ltr">03 / IMMERSIVE FLEET</span> — الأصول والمعدات</span>
          <h2 id="equipment-title">القوة خلف <em>كل حركة.</em></h2>
        </div>
        <p>استكشف المعدات المساندة لاستخراج الحجر وتكسيره ونقله، وفق القائمة الواردة في العرض الاستثماري.</p>
      </div>

      <div className="fleet-experience__composition">
        <div className="fleet-experience__stage" aria-label="صور توضيحية لفئات المعدات">
          {fleetFacts.map((item, index) => (
            <img
              key={item.id}
              src={images[index]}
              alt={index === selected ? "مشهد توضيحي لفئة " + item.name + "، وليس صورة موثقة للموقع" : ""}
              aria-hidden={index !== selected}
              className={"fleet-experience__image" + (index === selected ? " is-active" : "")}
              loading="lazy"
              decoding="async"
              width={1536}
              height={1024}
            />
          ))}
          <div className="fleet-experience__shade" aria-hidden="true" />
          <span className="fleet-experience__photo-note">صور توضيحية — تُستبدل بتصوير المعدات الفعلية</span>
          <div className="fleet-experience__headline">
            <span className="latin" dir="ltr">{current.eyebrow} / {current.number}</span>
            <strong key={current.id}>{current.name}</strong>
          </div>
          <div className="fleet-experience__corners" aria-hidden="true" />
        </div>
        <div className="fleet-experience__console">
          <div className="fleet-experience__console-label"><span className="latin" dir="ltr">EXPLORE THE FLEET</span><span>اختر فئة المعدات</span></div>
          <div className="fleet-experience__selectors" role="group" aria-label="فئات المعدات المتاحة">
            {fleetFacts.map((item, index) => {
              const Icon = icons[index] ?? Pickaxe;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected === index}
                  className={"fleet-experience__selector" + (selected === index ? " is-selected" : "")}
                  onClick={() => setSelected(index)}
                >
                  <span className="fleet-experience__selector-icon"><Icon size={18} strokeWidth={1.6} aria-hidden="true" /></span>
                  <span>{item.name}</span>
                  <span className="latin" dir="ltr">{item.number}</span>
                </button>
              );
            })}
          </div>
          <div className="fleet-experience__detail" aria-live="polite" aria-atomic="true">
            <div className="fleet-experience__count" dir="rtl">
              <strong>{current.count.toLocaleString("ar-SA")}</strong><span>{current.unit}</span>
            </div>
            <p>{current.description}</p>
            <small>{current.supporting}</small>
          </div>
          <a href="#site-gallery-title" className="fleet-experience__next">شاهد مرافق الموقع <ArrowDownLeft size={17} aria-hidden="true" /></a>
        </div>
      </div>
    </div>
  );
}
