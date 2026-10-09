import { useSiteLanguage } from "@/lib/site-language";
import { sitePhotoLibrary } from "@/data/site-photo-library";
import { ManagedImage } from "./ManagedImage";

const records = [
  {
    id: "photo-033",
    ar: "الخط ١ — الخط الأصغر",
    en: "Line 1 — the smaller line",
    detailAr: "يُعرف بالصفاق والكسارة ذوي الهيكل الأزرق، وفق توصيف المالك.",
    detailEn:
      "Identified by the blue primary crusher and feeder assembly, as described by the owner.",
  },
  {
    id: "photo-025",
    ar: "الخط ٢ — الخط الأكبر",
    en: "Line 2 — the larger line",
    detailAr: "منظومة التكسير والفرز الكبيرة ذات السيور المتعددة المتشعبة.",
    detailEn: "The larger crushing and screening installation, with multiple branching conveyors.",
  },
];
export function ProductionLines() {
  const { language } = useSiteLanguage();
  const en = language === "en";
  const products = ["photo-021", "photo-011"].map((id) =>
    sitePhotoLibrary.find((p) => p.id === id)!,
  );
  return (
    <section className="production-lines" aria-labelledby="production-lines-title">
      <h3 id="production-lines-title">
        {en ? "Two lines. Clearly identified." : "خطان للإنتاج. تعريف واضح."}
      </h3>
      <div className="production-lines__grid">
        {records.map((record) => {
          const photo = sitePhotoLibrary.find((p) => p.id === record.id)!;
          return (
            <figure key={record.id}>
              <ManagedImage
                mediaContext="ProductionLines"
                src={photo.image}
                alt={en ? record.en : record.ar}
                loading="lazy"
                decoding="async"
                width={1600}
                height={900}
              />
              <figcaption>
                <h3>{en ? record.en : record.ar}</h3>
                <p>{en ? record.detailEn : record.detailAr}</p>
              </figcaption>
            </figure>
          );
        })}
      </div>
      <h3>{en ? "Aggregate, from the actual site." : "البحص، من الموقع الفعلي."}</h3>
      <div className="production-lines__grid">
        {products.map((product) => (
          <figure key={product.id}>
            <ManagedImage
              mediaContext="ProductionLines"
              src={product.image}
              alt={
                en
                  ? "Actual aggregate stockpiles beneath production conveyors"
                  : "مخزون فعلي للبحص أسفل سيور الإنتاج"
              }
              loading="lazy"
              width={1600}
              height={900}
            />
            <figcaption>
              {en
                ? "Actual stockpiles and discharge conveyors. Photographs do not establish aggregate grading, laboratory results or available quantities."
                : "مخزون المنتج وسيور التفريغ كما تظهر في التصوير الفعلي. لا تُستنتج المقاسات أو نتائج الفحص أو الكميات المتاحة من الصورة."}
            </figcaption>
          </figure>
        ))}
      </div>
      <p>
        {en
          ? "Ask the team to confirm current aggregate sizes and specifications before ordering."
          : "تُؤكد مقاسات البحص ومواصفاته المتاحة مع الفريق قبل طلب التوريد."}
      </p>
    </section>
  );
}
