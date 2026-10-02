/** 
 * Lightweight server-side admission check for the public quarry Q&A endpoint.
 * Not a semantic classifier; the model still receives strict project-only rules.
 * Refused requests never reach the paid upstream AI gateway.
 */
const quarrySubjects = [
  /\b(?:somman|quarr(?:y|ies)|crusher|crushing|aggregat(?:e|es)|limestone|rock|stone|excavat(?:or|ion|ors)|loader|weighbridge|generator|conveyor|screening|fleet|site facilities|permits?|licen[cs]es?|iso\s*(?:9001|14001|45001))\b/i,
  /(?:الصمان|محجر|محاجر|المحجر|الكسار|كسارة|كسارات|البحص|الحجر|الصخر|صخور|الحفارات?|حفار|شيولات?|شيول|اللودر|الجرار|الوزن|الموازين|مولدات?|سيور|الغرابيل|غربال|فرز|استخراج|التكسير|التحميل|الاسطول|الأسطول|الرخص|ترخيص|تراخيص|الشهادات|شهادة|التشغيل|التوريد|الانتاج|الإنتاج|الانفاق|النفق|المعدات|المساحات)/,
  /\b(?:project|investment opportunity|equipment|operations?|production|site location|site area|workers?|staff|contact|certifications?|documents?)\b/i,
  /(?:المشروع|الفرصة|الاستثمارية|الموقع|المساحة|المرافق|الموظفين|العاملين|التواصل|الوثائق|المستندات|الاعتمادات|السلامة|القدرة الإنتاجية|الطاقة الانتاجية)/,
];

/** Obviously unrelated tasks and attempts to rewrite the assistant's rules. */
const forbiddenIntents = [
  /\b(?:ignore (?:prior|previous|your|all)|system prompt|developer message|jailbreak|act as|bypass (?:rules|instructions)|forget (?:instructions|rules))\b/i,
  /(?:تجاهل (?:تعليمات|كل ما سبق)|اكشف (?:التعليمات|البرومبت)|غير تعليماتك|تجاوز (?:القيود|التعليمات)|تصرف كأنك)/,
  /\b(?:recipe|cook(?:ing)?|football|soccer|sports? results?|elections?|politics|weather|stock market|bitcoin|write code|write (?:a )?(?:poem|story)|translate (?:this|the)|programming)\b/i,
  /(?:وصفة طبخ|طبخ|مباراة|كرة القدم|الانتخابات|سياسة|حالة الطقس|البورصة|بتكوين|اكتب (?:لي )?(?:قصيدة|قصة|كود)|ترجم (?:هذا|العبارة)|برمجة تطبيق)/,
];

export function isQuarryQuestion(question: string): boolean {
  const text = question.trim().replace(/\s+/g, " ");
  if (text.length < 3 || text.length > 500) return false;
  if (forbiddenIntents.some((pattern) => pattern.test(text))) return false;
  return quarrySubjects.some((pattern) => pattern.test(text));
}

export const OFF_TOPIC_REPLY = {
  ar: "أعتذر، أنا مساعد متخصص في محجر وكسارة الصمان فقط. يسعدني الإجابة عن أسئلة المحاجر وخطوط الإنتاج والمعدات والتراخيص والموقع والمرافق الواردة في العرض.",
  en: "Sorry, I can only answer questions about Al Somman quarry and crushing plant, including its equipment, operations, location, permits and documented facilities.",
} as const;
