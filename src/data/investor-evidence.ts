/**
 * Public-facing, document-derived metadata only.
 * Source: "عرض استثماري - كسارة الصمان (1).docx", p. 9 and pp. 6–8.
 * Original certificates, permit scans and private financial records are not
 * included in this repository. These records do not verify present validity.
 */
export const isoEvidence = [
  {
    id: "quality",
    standard: "ISO 9001:2015",
    title: "إدارة الجودة",
    number: "39/0825F/3QCC",
    issue: "18/08/2025",
    expires: "17/08/2028",
    description: "شهادة إدارة الجودة المشار إليها في العرض الاستثماري.",
  },
  {
    id: "environment",
    standard: "ISO 14001:2015",
    title: "الإدارة البيئية",
    number: "37/0825F/3QCC",
    issue: "18/08/2025",
    expires: "17/08/2028",
    description: "شهادة الإدارة البيئية المشار إليها في العرض الاستثماري.",
  },
  {
    id: "safety",
    standard: "ISO 45001:2018",
    title: "الصحة والسلامة المهنية",
    number: "30/0825FD/QCC",
    issue: "18/08/2025",
    expires: "17/08/2028",
    description: "شهادة الصحة والسلامة المهنية المشار إليها في العرض الاستثماري.",
  },
] as const;

export const evidenceIssuer = "QCC (Certification Control Quality)";
export const evidenceDisclaimers = {
  iso: "هذه البيانات من نسخة العرض الاستثماري، وليست نسخًا أصلية للشهادات أو تحققًا من استمرار سريانها أو نتائج المراجعات الدورية. يلزم طلب النسخ والتحقق لدى جهة المنح.",
  permits: "حالة كل رخصة مأخوذة من المستند التاريخي؛ يلزم الاستعلام الرسمي عن التجديد، والمرخص له، وحقوق النقل والتشغيل قبل أي اتفاق.",
  documents: "قائمة إرشادية لما يمكن طلبه أثناء الفحص النافي للجهالة، ولا تفيد بأن جميع الوثائق جاهزة أو معتمدة للإفصاح.",
} as const;

export const diligenceChecklist = [
  { id: "permits", title: "التراخيص والحقوق", detail: "نسخ حديثة من الرخص والتجديدات والملاك أو المرخص لهم وصلاحية التصرف والتشغيل." },
  { id: "operation", title: "معاينة التشغيل", detail: "صور الموقع الفعلية وحالة خطوط الكسارات والنفق والجدار الاستنادي وتقرير فحص فني ميداني." },
  { id: "equipment", title: "سجل المعدات", detail: "قائمة المعدات بأرقامها التسلسلية وحالتها ومرفقات الملكية أو التمويل والقيود المحتملة." },
  { id: "certificates", title: "الاعتمادات والشهادات", detail: "النسخ الأصلية لشهادات ISO وسجلات مراجعات المتابعة والتحقق من الجهة المانحة." },
  { id: "finance", title: "البيانات المالية", detail: "المعلومات المالية وتقارير الأصول التي تعتمد الشركة مشاركتها بعد مراجعة الصلاحيات والسرية." },
] as const;

export const investorJourney = [
  { id: "explore", number: "01", label: "استكشف الموقع", detail: "تعرف على منظومة الإنتاج والمعدات والمرافق والمناطق.", href: "#الفرصة" },
  { id: "review", number: "02", label: "راجع المستندات", detail: "استعرض البيانات المرجعية وحدد الوثائق التي تحتاج التحقق.", href: "#الوثائق" },
  { id: "contact", number: "03", label: "سجّل اهتمامك", detail: "اترك بياناتك ثم اختر وسيلة التواصل المناسبة بنفسك.", href: "#التواصل" },
] as const;
