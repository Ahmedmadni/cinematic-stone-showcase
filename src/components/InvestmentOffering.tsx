import { AlertTriangle, Factory, FileSearch, HardHat, Home, Zap } from "lucide-react";
import { ManagedImage } from "@/components/ManagedImage";
import { useSiteLanguage } from "@/lib/site-language";
import {
  investmentAssetRows,
  investmentDisclosure,
  investmentHeadlineFacts,
  investmentPhoto,
} from "@/data/investment-offering";

const lineFacts = [
  {
    number: "01",
    capacity: "250 t/h",
    value: "3,817,769 SAR",
    ar: "الخط الأصغر ذو الكسارة وتجهيزات التغذية الزرقاء، وفق توصيف المالك.",
    en: "The smaller line, identified by its blue crusher and feed assembly, according to the owner.",
  },
  {
    number: "02",
    capacity: "350 t/h",
    value: "5,377,509 SAR",
    ar: "الخط الأكبر بمرحلتين والسيور المتعددة، ويشمل كسارة كون قائمة قبل شراء الكسارتين الفكيّتين.",
    en: "The larger two-stage line with multiple conveyors, including a cone crusher that pre-dated the two jaw crushers.",
  },
] as const;

const facilityFacts = [
  { Icon: HardHat, value: "30", ar: "موظفًا وعاملًا", en: "employees and workers" },
  { Icon: Home, value: "47", ar: "فردًا — سعة السكن", en: "people — housing capacity" },
  { Icon: Factory, value: "19", ar: "غرفة سكن", en: "housing rooms" },
  { Icon: Zap, value: "3", ar: "مولدات كهرباء", en: "power generators" },
] as const;

const featurePhotos = [
  "photo-079",
  "photo-084",
  "photo-088",
  "photo-090",
  "photo-086",
  "photo-091",
].map(investmentPhoto);

export function InvestmentOffering() {
  const { language } = useSiteLanguage();
  const en = language === "en";

  return (
    <section
      className="investment-offering section-pad"
      id="العرض-الاستثماري"
      aria-labelledby="investment-offering-title"
    >
      <div className="section-inner">
        <div className="investment-offering__header reveal">
          <span className="investment-offering__eyebrow">
            <span className="latin" dir="ltr">
              INVESTMENT OFFERING / 2026
            </span>
            <span>{en ? "Document summary" : "ملخص العرض"}</span>
          </span>
          <div>
            <h2 id="investment-offering-title">
              {en ? "The offer," : "العرض،"} <em>{en ? "in clear numbers." : "بلغة الأرقام."}</em>
            </h2>
            <p>
              {en
                ? "A structured reading of the supplied 16-page offering, paired with the newly supplied site photographs and explicit verification notes."
                : "قراءة منظمة للعرض المقدم في 16 صفحة، مرتبطة بالصور الجديدة للموقع ومصحوبة بملاحظات تحقق واضحة."}
            </p>
          </div>
        </div>

        <div className="investment-offering__headline-facts reveal">
          {investmentHeadlineFacts.map((fact) => (
            <article key={fact.value}>
              <strong className="latin" dir="ltr">
                {fact.value}
              </strong>
              <span>{en ? fact.unitEn : fact.unitAr}</span>
              <p>{en ? fact.labelEn : fact.labelAr}</p>
            </article>
          ))}
        </div>

        <div className="investment-offering__lines reveal">
          <div className="investment-offering__section-heading">
            <span className="latin" dir="ltr">
              PRODUCTION / 02 LINES
            </span>
            <h3>{en ? "Nominal production configuration" : "تكوين الإنتاج الاسمي"}</h3>
          </div>
          <div className="investment-offering__line-grid">
            {lineFacts.map((line) => (
              <article key={line.number}>
                <span className="latin" dir="ltr">
                  LINE {line.number}
                </span>
                <strong className="latin" dir="ltr">
                  {line.capacity}
                </strong>
                <p>{en ? line.en : line.ar}</p>
                <small>
                  {en ? "Management estimate" : "تقدير الإدارة"}:{" "}
                  <b className="latin" dir="ltr">
                    {line.value}
                  </b>
                </small>
              </article>
            ))}
          </div>
        </div>

        <div className="investment-offering__assets reveal">
          <div className="investment-offering__section-heading">
            <span className="latin" dir="ltr">
              ASSET SUMMARY / SAR
            </span>
            <h3>{en ? "Management valuation breakdown" : "تفصيل التقييم الإداري"}</h3>
          </div>
          <div
            className="investment-offering__asset-table"
            role="table"
            aria-label={en ? "Estimated asset values" : "القيم التقديرية للأصول"}
          >
            {investmentAssetRows.map((row) => (
              <div role="row" key={row.labelEn}>
                <span role="cell">
                  <b>{en ? row.labelEn : row.labelAr}</b>
                  <small>{en ? row.noteEn : row.noteAr}</small>
                </span>
                <strong role="cell" className="latin" dir="ltr">
                  {row.value}
                </strong>
              </div>
            ))}
          </div>
        </div>

        <div className="investment-offering__facilities reveal">
          {facilityFacts.map(({ Icon, value, ar, en: label }) => (
            <article key={label}>
              <Icon size={22} strokeWidth={1.4} aria-hidden="true" />
              <strong className="latin" dir="ltr">
                {value}
              </strong>
              <span>{en ? label : ar}</span>
            </article>
          ))}
        </div>

        <div className="investment-offering__visuals reveal">
          <div className="investment-offering__section-heading">
            <span className="latin" dir="ltr">
              SITE SYSTEMS / OCT 2026
            </span>
            <h3>{en ? "Production and support infrastructure" : "الإنتاج والبنية المساندة"}</h3>
          </div>
          <div className="investment-offering__photo-grid">
            {featurePhotos.map((photo, index) => (
              <figure key={photo.id} className={index === 0 ? "is-wide" : undefined}>
                <ManagedImage
                  mediaContext="InvestmentOffering"
                  src={photo.image}
                  alt={en ? photo.en : photo.ar}
                  loading="lazy"
                  decoding="async"
                  width={photo.width}
                  height={photo.height}
                />
                <figcaption>{en ? photo.en : photo.ar}</figcaption>
              </figure>
            ))}
          </div>
          <p className="investment-offering__archive-note">
            {en
              ? "The complete set of 17 newly supplied photographs is catalogued in the site photo archive by production, equipment, facilities and quarry context."
              : "تمت فهرسة مجموعة الصور الجديدة كاملة وعددها 17 صورة في أرشيف الموقع بحسب الإنتاج والمعدات والمرافق وسياق المحاجر."}
          </p>
        </div>

        <aside
          className="investment-offering__disclosure reveal"
          aria-labelledby="investment-disclosure-title"
        >
          <div>
            <AlertTriangle size={26} strokeWidth={1.5} aria-hidden="true" />
            <span className="latin" dir="ltr">
              IMPORTANT NOTICE
            </span>
            <h3 id="investment-disclosure-title">
              {en ? "Verification and liability notes" : "ملاحظات التحقق وإخلاء المسؤولية"}
            </h3>
          </div>
          <ul>
            {(en ? investmentDisclosure.en : investmentDisclosure.ar).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <a href="#الوثائق">
            <FileSearch size={18} aria-hidden="true" />
            {en ? "Review the due-diligence file" : "مراجعة ملف الفحص النافي للجهالة"}
          </a>
        </aside>
      </div>
    </section>
  );
}
