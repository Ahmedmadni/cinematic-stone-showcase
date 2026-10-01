import { useState } from "react";
import { ArrowUpLeft } from "lucide-react";
import { productionSteps } from "@/data/experience-data";

/** An interactive editorial sequence; never implies live production telemetry. */
export function ProductionFlow() {
  const [active, setActive] = useState(0);
  const item = productionSteps[active] ?? productionSteps[0];
  return (
    <div className="production-flow reveal" aria-label="المراحل الرئيسية لدورة الإنتاج">
      <div className="production-flow__top">
        <span className="latin" dir="ltr">THE MATERIAL JOURNEY</span>
        <span>كيف يتحرك الحجر داخل المنظومة؟</span>
      </div>
      <div className="production-flow__layout">
        <div className="production-flow__steps" role="group" aria-label="اختر مرحلة الإنتاج">
          {productionSteps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className={"production-flow__step" + (index === active ? " is-active" : "")}
              onClick={() => setActive(index)}
              aria-pressed={active === index}
            >
              <span className="latin" dir="ltr">{step.number}</span>
              <strong>{step.title}</strong>
              <ArrowUpLeft size={18} strokeWidth={1.3} aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="production-flow__view" aria-live="polite" aria-atomic="true">
          <div className="production-flow__scan" aria-hidden="true">
            <span className={"production-flow__beam production-flow__beam--" + item.id} />
            <span className="production-flow__center"><span className="latin" dir="ltr">{item.number} / 03</span></span>
          </div>
          <span className="production-flow__indicator">{item.indicator}</span>
          <h3>{item.title}</h3>
          <p>{item.detail}</p>
          <small>وصف مبسط للعمليات الواردة في العرض، وليس مخطط تشغيل هندسيًا.</small>
        </div>
      </div>
    </div>
  );
}
