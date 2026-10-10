import { ManagedImage } from '@/components/ManagedImage';
import { useSiteLanguage } from "@/lib/site-language";
import { useState } from "react";
import { ArrowUpLeft, FileCheck2, MapPin, Mountain } from "lucide-react";
import { quarrySites, totalQuarryArea } from "@/data/experience-data";
import { officialMedia } from "@/data/official-media";

const images = [
  officialMedia.hero[0].image,
  officialMedia.hero[2].image,
  officialMedia.hero[1].image,
] as const;

/** Three quarry records paired with supplied Al Somman photographs. */
export function QuarryAtlas() {
  const { t, language } = useSiteLanguage();
  const [selected, setSelected] = useState(0);
  const current = quarrySites[selected] ?? quarrySites[0];

  function chooseSite(index: number) {
    setSelected(index);
  }

  return (
    <div className="quarry-atlas quarry-cards" data-quarry-gallery-autoplay="paused" aria-label={t("المحاجر الثلاثة وملفات تراخيصها")}>
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
              <ManagedImage mediaContext="QuarryAtlas" className="actual-site-photo" data-media-origin="actual-site" src={images[index]} alt="" loading="lazy" decoding="async" width={1600} height={900} />
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

        <div className="quarry-cards__information" aria-live="polite" aria-atomic="true">
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
            <div className="quarry-operation"><dt>{language === 'en' ? 'Operating use · owner supplied' : 'الاستخدام التشغيلي · وفق المالك'}</dt><dd>{language === 'en' ? current.operationEn : current.operationAr}</dd></div>
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
        <span><Mountain size={17} aria-hidden="true"/> {t("ثلاثة محاجر ضمن منظومة الصمان التشغيلية.")}</span>
        <a href="#location-title">{t("مراجعة الموقع الاسترشادي في Google Maps")} <MapPin size={16} aria-hidden="true"/></a>
      </div>
    </div>
  );
}
