/**
 * Public-facing, document-derived metadata only.
 * Source: "عرض استثماري - كسارة الصمان (1).docx", p. 9 and pp. 6–8.
 * Supplied scans are linked separately. ISO identifiers below are transcribed
 * from those scans; neither scan nor summary verifies present validity.
 */
export const isoEvidence = [
  {
    id: "quality",
    standard: "ISO 9001:2015",
    title: "إدارة الجودة",
    number: "QCC/3F39/0825",
    issue: "18/08/2025",
    expires: "17/08/2028",
    description: "شهادة إدارة الجودة المشار إليها في العرض الاستثماري.",
  },
  {
    id: "environment",
    standard: "ISO 14001:2015",
    title: "الإدارة البيئية",
    number: "QCC/3F37/0825",
    issue: "18/08/2025",
    expires: "17/08/2028",
    description: "شهادة الإدارة البيئية المشار إليها في العرض الاستثماري.",
  },
  {
    id: "safety",
    standard: "ISO 45001:2018",
    title: "الصحة والسلامة المهنية",
    number: "QCC/FD30/0825",
    issue: "18/08/2025",
    expires: "17/08/2028",
    description: "شهادة الصحة والسلامة المهنية المشار إليها في العرض الاستثماري.",
  },
] as const;

export const evidenceIssuer = "QCC (Quality Control Certification)";
export const evidenceDisclaimers = {
  iso: "تُعرض نسخ الشهادات المرفقة وبياناتها المرجعية؛ وهي ليست نسخًا أصلية معتمدة، ولا يمثل عرضها تحققًا من استمرار السريان أو نتائج مراجعات المتابعة. يلزم التحقق لدى جهة المنح.",
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
