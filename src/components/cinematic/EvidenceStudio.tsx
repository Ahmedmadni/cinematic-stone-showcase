import { useSiteLanguage } from "@/lib/site-language";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpLeft, Award, ClipboardCheck, FileText, Leaf, LockKeyhole, ShieldCheck } from "lucide-react";
import { quarrySites } from "@/data/experience-data";
import { diligenceChecklist, evidenceDisclaimers, evidenceIssuer, investorJourney, isoEvidence } from "@/data/investor-evidence";

type EvidenceView = "certificates" | "permits" | "diligence";

const evidenceNavigation = [
  { id: "certificates", number: "01", label: "شهادات الإدارة", meta: "ISO / 03" },
  { id: "permits", number: "02", label: "ملفات التراخيص", meta: "PERMITS / 03" },
  { id: "diligence", number: "03", label: "الفحص النافي للجهالة", meta: "DUE DILIGENCE" },
] as const;

const evidenceIcons = [Award, Leaf, ShieldCheck] as const;

/**
 * This is an editorial evidence viewer, not an image of an issued certificate.
 * The private originals and financial records are deliberately not bundled.
 */
export function EvidenceStudio() {
  const { t, language } = useSiteLanguage();
  const [view, setView] = useState<EvidenceView>("certificates");
  const [certificateIndex, setCertificateIndex] = useState(0);
  const [permitIndex, setPermitIndex] = useState(0);
  const [checkIndex, setCheckIndex] = useState(0);
  const certificate = isoEvidence[certificateIndex] ?? isoEvidence[0];
  const permit = quarrySites[permitIndex] ?? quarrySites[0];
  const item = diligenceChecklist[checkIndex] ?? diligenceChecklist[0];

  return (
    <div className="evidence-studio">
      <div className="evidence-studio__header reveal">
        <span className="evidence-studio__eyebrow"><span className="latin" dir="ltr">THE EVIDENCE / 06</span><span>{t("الجاهزية والمستندات")}</span></span>
        <div className="evidence-studio__heading">
          <div>
            <h2 id="assurance-title">{t("المعلومة")} <em>{t("قبل القرار.")}</em></h2>
            <p>{t("استعرض ملخص الوثائق والاعتمادات المذكورة في العرض الاستثماري، وحدد ما يحتاج تحققًا قبل دراسة الفرصة.")}</p>
          </div>
          <div className="evidence-studio__population">
            <strong>{t("٣٠")}</strong><span>{t("موظفًا وعاملًا بحسب العرض، بين التشغيل والإدارة والصيانة.")}</span>
          </div>
        </div>
      </div>

      <div className="evidence-studio__workbench">
        <div className="evidence-studio__topbar">
          <span className="latin" dir="ltr">AL SOMMAN / DOCUMENT INTELLIGENCE</span>
          <span>{t("عرض معلوماتي — لا يحل محل المستندات الأصلية")}</span>
        </div>
        <div className="evidence-studio__layout">
          <div className="evidence-studio__navigation" role="group" aria-label={t("اختر نوع البيانات المراد استعراضها")}>
            {evidenceNavigation.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={entry.id === view}
                className={"evidence-studio__nav" + (view === entry.id ? " is-current" : "")}
                onClick={() => setView(entry.id)}
              >
                <span className="latin" dir="ltr">{entry.number}</span>
                <strong>{t(entry.label)}</strong>
                <small className="latin" dir="ltr">{entry.meta}</small>
              </button>
            ))}
            <div className="evidence-studio__policy">
              <LockKeyhole size={19} aria-hidden="true" />
              <p>{t("الملفات الأصلية والبيانات المالية التفصيلية غير منشورة على الموقع. طلبها يخضع لموافقة الجهة المسؤولة.")}</p>
            </div>
          </div>
          <div className="evidence-studio__stage">
            {view === "certificates" && (
              <div key="certificates" className="evidence-studio__panel" aria-label={t("بيانات شهادات أنظمة الإدارة")}>
                <div className="evidence-studio__overline"><span className="latin" dir="ltr">MANAGEMENT SYSTEMS</span><span>{t("ملخص بيانات الشهادات")}</span></div>
                <div className="evidence-studio__cert-controls" role="group" aria-label={t("اختر شهادة ISO")}>
                  {isoEvidence.map((entry, index) => {
                    const Icon = evidenceIcons[index] ?? Award;
                    return (
                      <button key={entry.id} type="button" onClick={() => setCertificateIndex(index)} aria-pressed={certificateIndex === index} className={"evidence-studio__cert-button" + (certificateIndex === index ? " is-selected" : "")}>
                        <Icon size={18} aria-hidden="true" /><span className="latin" dir="ltr">{entry.standard}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="evidence-studio__certificate" key={certificate.id}>
                  <span className="evidence-studio__certificate-watermark latin" dir="ltr" aria-hidden="true">ISO</span>
                  <div className="evidence-studio__certificate-label"><Award size={21} aria-hidden="true" /><span>{t("بطاقة بيانات مرجعية — ليست صورة شهادة")}</span></div>
                  <span className="evidence-studio__certificate-standard latin" dir="ltr">{certificate.standard}</span>
                  <h3>{t(certificate.title)}</h3>
                  <p>{t(certificate.description)}</p>
                  <dl>
                    <div><dt>{t("جهة المنح المذكورة")}</dt><dd dir="ltr">{evidenceIssuer}</dd></div>
                    <div><dt>{t("الرقم المذكور")}</dt><dd dir="ltr">{certificate.number}</dd></div>
                    <div><dt>{t("تاريخ الإصدار المذكور")}</dt><dd dir="ltr">{certificate.issue}</dd></div>
                    <div><dt>{t("تاريخ الانتهاء المذكور")}</dt><dd dir="ltr">{certificate.expires}</dd></div>
                  </dl>
                </div>
                <p className="evidence-studio__disclaimer">{evidenceDisclaimers.iso}</p>
              </div>
            )}
            {view === "permits" && (
              <div key="permits" className="evidence-studio__panel" aria-label={t("البيانات المرجعية للتراخيص")}>
                <div className="evidence-studio__overline"><span className="latin" dir="ltr">REGULATORY DOCUMENTS</span><span>{t("الوضع المذكور في نسخة العرض")}</span></div>
                <div className="evidence-studio__permit-switch" role="group" aria-label={t("اختر الترخيص المراد عرضه")}>
                  {quarrySites.map((entry, index) => (
                    <button type="button" key={entry.id} onClick={() => setPermitIndex(index)} aria-pressed={permitIndex === index} className={"evidence-studio__permit-tab" + (permitIndex === index ? " is-selected" : "")}>
                      <span className="latin" dir="ltr">0{index + 1}</span>{t(entry.name)}
                    </button>
                  ))}
                </div>
                <div className="evidence-studio__permit-card" key={permit.id}>
                  <div className="evidence-studio__permit-icon"><FileText size={43} strokeWidth={1.2} aria-hidden="true" /></div>
                  <span>{t("بيانات ترخيص مواد بناء كما وردت بالمستند")}</span>
                  <h3>{t(permit.name)}</h3>
                  <strong className="latin" dir="ltr">{permit.license}</strong>
                  <dl>
                    <div><dt>{t("المرخص له")}</dt><dd>{t(permit.permitHolder)}</dd></div>
                    <div><dt>{t("المساحة المذكورة")}</dt><dd>{permit.area.toLocaleString(language === "ar" ? "ar-SA" : "en-US")} m²</dd></div>
                    <div><dt>{t("الحالة بالمستند")}</dt><dd>{t(permit.documentStatus)}</dd></div>
                  </dl>
                </div>
                <p className="evidence-studio__disclaimer">{permit.note} {evidenceDisclaimers.permits}</p>
              </div>
            )}
            {view === "diligence" && (
              <div key="diligence" className="evidence-studio__panel" aria-label={t("قائمة المراجعة الاستثمارية")}>
                <div className="evidence-studio__overline"><span className="latin" dir="ltr">DOCUMENT REQUEST GUIDE</span><span>{t("خطوات للفحص النافي للجهالة")}</span></div>
                <div className="evidence-studio__checks" role="group" aria-label={t("بنود مراجعة الوثائق")}>
                  {diligenceChecklist.map((entry, index) => (
                    <button key={entry.id} type="button" aria-pressed={checkIndex === index} onClick={() => setCheckIndex(index)} className={"evidence-studio__check" + (checkIndex === index ? " is-selected" : "")}>
                      <span className="latin" dir="ltr">{String(index + 1).padStart(2, "0")}</span>{t(entry.title)}
                    </button>
                  ))}
                </div>
                <div className="evidence-studio__check-detail" key={item.id}>
                  <ClipboardCheck size={35} strokeWidth={1.2} aria-hidden="true" />
                  <span className="latin" dir="ltr">VERIFICATION PRIORITY</span>
                  <h3>{t(item.title)}</h3>
                  <p>{t(item.detail)}</p>
                </div>
                <p className="evidence-studio__disclaimer">{evidenceDisclaimers.documents}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <a href="#التواصل" className="evidence-studio__request">{t("طلب مستندات ومعلومات إضافية")} <ArrowUpLeft size={19} aria-hidden="true" /></a>
    </div>
  );
}

/** A simple investor narrative that uses the original inquiry workflow. */
export function InvestorJourney() {
  const { t } = useSiteLanguage();
  return (
    <section className="investor-journey section-pad" aria-labelledby="investor-journey-heading">
      <div className="section-inner">
        <div className="investor-journey__header reveal">
          <span className="latin" dir="ltr">INVESTMENT JOURNEY / 07</span>
          <h2 id="investor-journey-heading">{t("من الاستكشاف")} <em>{t("إلى التواصل.")}</em></h2>
          <p>{t("خطوات واضحة للتعرف على المشروع، ومراجعة البيانات، وطلب التواصل مع الفريق المختص دون إتاحة معلومات مالية غير معتمدة للنشر.")}</p>
        </div>
        <div className="investor-journey__steps">
          {investorJourney.map((step) => (
            <a href={step.href} key={step.id} className="investor-journey__step reveal">
              <span className="latin" dir="ltr">{step.number}</span>
              <h3>{t(step.label)}</h3>
              <p>{t(step.detail)}</p>
              <ArrowDownLeft size={23} aria-hidden="true" />
            </a>
          ))}
        </div>
        <p className="investor-journey__note">{t("البيانات الواردة في العرض تقديرية ومقدمة لأغراض التعريف الأولي؛ لا تشكل عرضًا ملزمًا أو ضمانًا للعوائد الاستثمارية.")}</p>
      </div>
    </section>
  );
}
