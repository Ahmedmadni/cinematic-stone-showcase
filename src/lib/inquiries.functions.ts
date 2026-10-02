import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "أدخل اسمك الكامل").max(100, "الاسم طويل جداً"),
  email: z.string().trim().email("أدخل بريداً إلكترونياً صحيحاً").max(255, "البريد الإلكتروني طويل جداً"),
  phone: z.string().trim().max(30, "رقم الهاتف طويل جداً").regex(/^[+\d\s()-]*$/, "أدخل رقم هاتف صحيحاً"),
  company: z.string().trim().max(120, "اسم الجهة طويل جداً"),
  message: z.string().trim().max(1000, "الرسالة طويلة جداً"),
  website: z.string().max(0),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

export const submitInquiry = createServerFn({ method: "POST" })
  .validator((data) => inquirySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("investment_inquiries").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      company: data.company || null,
      message: data.message || null,
    });

    if (error) throw new Error("تعذر إرسال طلبك الآن. حاول مرة أخرى لاحقاً.");
    return { success: true };
  });