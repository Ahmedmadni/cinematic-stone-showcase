import { createServerFn } from "@tanstack/react-start";
import { inquirySchema } from "@/lib/inquiry-schema";
export { inquirySchema, type InquiryInput } from "@/lib/inquiry-schema";

export const submitInquiry = createServerFn({ method: "POST" })
  .validator((data) => inquirySchema.parse(data))
  .handler(async ({ data }) => {
    // All fields have already passed the existing Zod schema, including the
    // honeypot. Limit service-role writes before touching investor PII.
    const { acquirePublicInquiryPermit } = await import("@/lib/public-inquiry-guard.server");
    const release = await acquirePublicInquiryPermit();
    try {
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
    } finally {
      release();
    }
  });