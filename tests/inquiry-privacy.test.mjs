import test from "node:test";
import assert from "node:assert/strict";
import { inquirySchema } from "../src/lib/inquiry-schema.ts";
import { translateSite } from "../src/lib/site-language.ts";

const base = {
  name: "Example Visitor",
  email: "example@example.org",
  phone: "",
  company: "",
  message: "",
  website: "",
};

test("public investor form refuses absent or false data-use consent", () => {
  const missing = inquirySchema.safeParse(base);
  assert.equal(missing.success, false);
  assert.ok(missing.error.issues.some(issue => issue.path[0] === "privacyConsent"));

  const unchecked = inquirySchema.safeParse({ ...base, privacyConsent: false });
  assert.equal(unchecked.success, false);
  const error = unchecked.error.issues.find(issue => issue.path[0] === "privacyConsent");
  assert.match(error?.message ?? "", /يلزم الموافقة/);
});

test("consent must be boolean true, not a coercible string from an automated bot", () => {
  for (const privacyConsent of ["true", "on", 1, "yes", null]) {
    assert.equal(inquirySchema.safeParse({ ...base, privacyConsent }).success, false);
  }
});

test("explicit agreement preserves existing name/email/phone and honeypot restrictions", () => {
  const valid = inquirySchema.safeParse({ ...base, privacyConsent: true });
  assert.equal(valid.success, true);
  assert.equal(valid.data.name, "Example Visitor");
  assert.equal(valid.data.privacyConsent, true);
  assert.equal(inquirySchema.safeParse({ ...base, privacyConsent: true, website: "spambot" }).success, false);
  assert.equal(inquirySchema.safeParse({ ...base, privacyConsent: true, phone: "<script>" }).success, false);
  assert.equal(inquirySchema.safeParse({ ...base, privacyConsent: true, name: "Z" }).success, false);
});

test("the consent and data rights instructions are translated fully in English UI", () => {
  const consent = "أوافق على حفظ بيانات هذا النموذج حتى يتمكن فريق الاستثمار من مراجعة اهتمامي والتواصل معي بشأن محجر الصمان.";
  const rights = "للاستفسار عن البيانات التي قدمتها أو طلب تعديلها أو حذفها، راسل";
  const notice = "الاسم والبريد الإلكتروني مطلوبان، ورقم الهاتف والشركة والرسالة اختيارية. لن تُرسل رسائل بريد أو واتساب تلقائيًا.";
  assert.match(translateSite(consent, "en"), /I agree/i);
  assert.match(translateSite(rights, "en"), /request deletion/i);
  assert.match(translateSite(notice, "en"), /No email or WhatsApp/i);
  assert.equal(translateSite(consent, "ar"), consent);
});
