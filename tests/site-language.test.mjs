import test from "node:test";
import assert from "node:assert/strict";
import { translateSite } from "../src/lib/site-language.ts";

test("site language switches without changing source facts or brand identity", () => {
  assert.equal(translateSite("محجر الصمان","ar"), "محجر الصمان");
  assert.equal(translateSite("محجر الصمان","en"), "Al Somman Quarry");
  assert.equal(translateSite("الشيولات","en"), "Wheel loaders");
  assert.equal(translateSite("منتهية بحسب نسخة العرض","en"), "Listed as expired in the historical presentation");
  assert.equal(translateSite("شركة بير زيت للخدمات البترولية","en"), "Bir Zeit Petroleum Services Company");
  assert.equal(translateSite("1437731","en"), "1437731");
});
test("translation includes assistant scope and original illustrative-media caveats", () => {
  assert.match(translateSite("مساعد الصمان","en"), /assistant/i);
  assert.match(translateSite("الصور المعروضة تجريبية وليست صوراً فعلية للموقع أو المعدات.","en"), /illustrative/);
  assert.match(translateSite("هذه البيانات من نسخة العرض الاستثماري، وليست نسخًا أصلية للشهادات أو تحققًا من استمرار سريانها أو نتائج المراجعات الدورية. يلزم طلب النسخ والتحقق لدى جهة المنح.","en"), /not.*current validity/i);
});
