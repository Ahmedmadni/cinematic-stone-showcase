/**
 * Editorial facts taken from the supplied investment presentation.
 * Source: "عرض استثماري - كسارة الصمان (1).docx" pp. 6, 10, 15–17.
 * Historic document statuses are NOT a live official licence lookup.
 */
export const quarrySites = [
  {
    id: "ostool-1",
    name: "محجر الأسطول ١",
    area: 247900,
    license: "1438733",
    permitHolder: "شركة الأسطول الآلي",
    documentStatus: "سارية بحسب نسخة العرض",
    note: "يجب التأكد من استمرار السريان وتحديث بيانات الترخيص من الوزارة قبل أي تعاقد.",
  },
  {
    id: "ostool-2",
    name: "محجر الأسطول ٢",
    area: 246300,
    license: "14377125",
    permitHolder: "شركة الأسطول الآلي",
    documentStatus: "منتهية بحسب نسخة العرض",
    note: "ورد الترخيص منتهيًا في ملف العرض؛ يُطلب مستند التجديد وحالة الترخيص الحالية.",
  },
  {
    id: "birzeit",
    name: "محجر بير زيت",
    area: 249082,
    license: "1437731",
    permitHolder: "شركة بير زيت للخدمات البترولية",
    documentStatus: "منتهية بحسب نسخة العرض",
    note: "الترخيص باسم شركة أخرى وورد منتهيًا؛ يجب مراجعة الملكية وحق النقل والتجديد.",
  },
] as const;

export const productionSteps = [
  {
    id: "extraction",
    number: "01",
    title: "استخراج الحجر الخام",
    detail: "الحفارات تُجهّز وتستخرج المادة الخام وتدعم استمرارية التغذية لخطي الإنتاج.",
    indicator: "الاستخراج",
  },
  {
    id: "crushing",
    number: "02",
    title: "التكسير والفرز",
    detail: "تنتقل المواد عبر الكسارات والغرابيل والسيور، ثم تُصنّف بحسب المقاسات.",
    indicator: "التكسير والفرز",
  },
  {
    id: "dispatch",
    number: "03",
    title: "التحميل والوزن",
    detail: "تُستخدم الشيولات للتحميل، مع موازين الشاحنات للمساعدة في ضبط الكميات.",
    indicator: "التجهيز للتحميل",
  },
] as const;

export const fleetFacts = [
  {
    id: "excavators",
    number: "01",
    name: "الحفارات",
    count: 14,
    unit: "حفارًا",
    eyebrow: "EXTRACTION",
    description: "معدات حفر واستخراج وتحميل الحجر الخام لدعم تغذية خطوط الكسارات.",
    supporting: "بحسب قائمة المعدات: 10 حفارات XCMG، وحفاران كاتربلر، وحفاران فولفو.",
  },
  {
    id: "loaders",
    number: "02",
    name: "الشيولات",
    count: 6,
    unit: "شيولات",
    eyebrow: "LOADING",
    description: "تحميل المنتج وتحريك المواد داخل الموقع وتغذية الهوبر.",
    supporting: "تضم القائمة شيولات كاتربلر وهيتاشي وكاواساكي وXCMG.",
  },
  {
    id: "weighbridges",
    number: "03",
    name: "موازين الشاحنات",
    count: 2,
    unit: "ميزان",
    eyebrow: "WEIGHING",
    description: "تستخدم لوزن الشاحنات الداخلة والخارجة وضبط كميات المواد.",
    supporting: "ميزانا شاحنات بالمواصفات المذكورة في العرض: 3 × 18 متر.",
  },
  {
    id: "power",
    number: "04",
    name: "مولدات الكهرباء",
    count: 3,
    unit: "مولدات",
    eyebrow: "POWER",
    description: "مرافق مساندة لتوفير الطاقة الكهربائية للكسارات والخدمات.",
    supporting: "ثلاثة مولدات كهربائية بحسب ملخص الأصول المرفق.",
  },
] as const;

export const totalQuarryArea = quarrySites.reduce((sum, item) => sum + item.area, 0);
