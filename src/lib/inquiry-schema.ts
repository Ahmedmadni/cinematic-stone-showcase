import { z } from "zod";

/**
 * Shared browser/server validation of voluntarily supplied investor leads.
 *
 * Consent is a required, explicit action on each inquiry. No assumed checks,
 * and the form must not persist investor PII if the field is missing/false.
 * This flag is not a persistent consent receipt: the existing lead table
 * contains only name/contact/message fields; approval of a versioned legal
 * notice and a stored receipt require a separately reviewed DB migration.
 */
export const inquirySchema = z.object({
  name: z.string().trim().min(2, "أدخل اسمك الكامل").max(100, "الاسم طويل جداً"),
  email: z.string().trim().email("أدخل بريداً إلكترونياً صحيحاً").max(255, "البريد الإلكتروني طويل جداً"),
  phone: z.string().trim().max(30, "رقم الهاتف طويل جداً").regex(/^[+\d\s()-]*$/, "أدخل رقم هاتف صحيحاً"),
  company: z.string().trim().max(120, "اسم الجهة طويل جداً"),
  message: z.string().trim().max(1000, "الرسالة طويلة جداً"),
  website: z.string().max(0),
  privacyConsent: z.boolean().refine(value => value === true, {
    message: "يلزم الموافقة على استخدام البيانات قبل إرسال الطلب.",
  }),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
