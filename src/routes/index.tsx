import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowLeft, ArrowUpLeft, Mail, MapPin, Phone, MoveDownRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import quarryAerial from "@/assets/quarry-aerial.jpg";
import crushingPlant from "@/assets/crushing-plant.jpg";
import equipment from "@/assets/equipment.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "محجر الصمان | فرصة استثمارية من شركة الأسطول الآلي" },
      { name: "description", content: "عرض استثماري لمحجر وكسارة الصمان: محاجر مواد البناء، منظومة الإنتاج، المعدات، والموقع في المنطقة الشرقية." },
      { property: "og:title", content: "محجر الصمان | شركة الأسطول الآلي" },
      { property: "og:description", content: "نظرة على الأصل التشغيلي ومحاجره وخطوط إنتاجه ومعداته في الصمان." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const facts = [
  { number: "٧٤٣٬٢٨٢", unit: "م²", label: "إجمالي مساحات المحاجر" },
  { number: "٤٬٥٠٠", unit: "م³ / يوم", label: "طاقة إنتاجية تصل إلى" },
  { number: "٣", unit: "محاجر", label: "ضمن مجمع كسارات الصمان" },
];

const quarries = [
  { name: "محجر الأسطول ١", area: "٢٤٧٬٩٠٠", index: "01" },
  { name: "محجر الأسطول ٢", area: "٢٤٦٬٣٠٠", index: "02" },
  { name: "محجر بير زيت", area: "٢٤٩٬٠٨٢", index: "03" },
];

function Eyebrow({ number, children }: { number: string; children: React.ReactNode }) {
  return <div className="eyebrow"><span className="eyebrow-line" /><span className="latin" dir="ltr">{number}</span><span>{children}</span></div>;
}

function Index() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const x = (event.clientX / window.innerWidth - 0.5) * 18;
    const y = (event.clientY / window.innerHeight - 0.5) * 18;
    sceneRef.current?.style.setProperty("--pointer-x", `${x}px`);
    sceneRef.current?.style.setProperty("--pointer-y", `${y}px`);
  };

  return (
    <div className="presentation" dir="rtl" onPointerMove={onPointerMove}>
      <div className="scene-backdrop" ref={sceneRef} aria-hidden="true">
        <img src={quarryAerial} width={1920} height={1080} alt="" />
        <div className="scene-shade" />
      </div>

      <header className="site-header">
        <a href="#البداية" className="brand" aria-label="العودة إلى بداية العرض">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span className="brand-type"><strong>الأسطول الآلي</strong><small>محجر الصمان</small></span>
        </a>
        <a className="header-contact" href="#التواصل">تواصل للاستفسار <ArrowUpLeft size={17} strokeWidth={1.5} /></a>
      </header>

      <main>
        <section className="hero" id="البداية" aria-labelledby="hero-title">
          <div className="hero-side-note latin" dir="ltr">AL SOMMAN  /  INVESTMENT OPPORTUNITY</div>
          <div className="hero-content">
            <div className="hero-kicker"><span className="kicker-dot" /> أصل صناعي في قلب الصمان <span className="kicker-rule" /></div>
            <h1 id="hero-title">محجر <em>الصمان</em><span className="hero-title-second">قوّةٌ من الأرض.</span></h1>
            <p className="hero-lead">فرصة استثمارية في منظومة متكاملة لاستخراج وإنتاج مواد البناء، من عمق المحجر إلى المنتج النهائي.</p>
            <a className="hero-discover" href="#الفرصة"><span className="discover-icon"><MoveDownRight size={21} strokeWidth={1.4} /></span><span>استكشف الفرصة</span></a>
          </div>
          <div className="hero-bottom"><span>شركة الأسطول الآلي <span className="hero-bottom-divider">/</span> شركة مساهمة مقفلة</span><span className="latin" dir="ltr">25°30′ N — 48°21′ E</span></div>
        </section>

        <section className="overview section-pad" id="الفرصة">
          <div className="section-inner">
            <Eyebrow number="01 / 05">الفرصة</Eyebrow>
            <div className="overview-grid">
              <h2 className="section-heading reveal">ليست مجرد كسارة.<br /><span>إنها منظومة إنتاج.</span></h2>
              <div className="overview-copy reveal">
                <p>في منطقة الصمان، يتكامل الاستخراج والتكسير والفرز والتحميل ضمن أصل تشغيلي واحد لإنتاج البحص بمختلف أحجامه، بما يخدم مشاريع الطرق والإنشاءات.</p>
                <p>ثلاثة محاجر وخطا كسارات، تدعمهما معدات ثقيلة ومرافق تشغيلية على أرض الموقع.</p>
              </div>
            </div>
            <div className="facts-grid">
              {facts.map((fact) => <div className="fact reveal" key={fact.label}><div className="fact-number"><b>{fact.number}</b><span>{fact.unit}</span></div><p>{fact.label}</p></div>)}
            </div>
          </div>
        </section>

        <section className="visual-chapter section-pad" aria-labelledby="production-title">
          <div className="section-inner">
            <Eyebrow number="02 / 05">القدرة التشغيلية</Eyebrow>
            <div className="chapter-top reveal"><h2 className="section-heading" id="production-title">من الحجر الخام<br /><span>إلى قيمة تُبنى.</span></h2><p>خطا إنتاج للكسارات والفرز، بمراحل تشغيلية مترابطة وغرف تحكم وسيور ناقلة وغرابيل لتصنيف المواد.</p></div>
            <figure className="image-feature reveal">
              <div className="image-window"><img src={crushingPlant} loading="lazy" width={1536} height={1024} alt="صورة تجريبية توضيحية لخط تكسير وفرز الأحجار في محجر" /></div>
              <figcaption><span className="latin" dir="ltr">FIG. 01 — PRODUCTION</span><span>خطوط الكسارات والإنتاج <small>صورة تجريبية</small></span></figcaption>
            </figure>
            <div className="production-detail reveal"><div><span className="detail-index latin">01 — 02</span><h3>خطان للإنتاج</h3></div><p>كسارات ثابتة وكون وجاو، مع معدات فرز ونقل للمواد. وتدعم خطوط الإنتاج بنية تشمل نفقاً وجداراً استنادياً واستمرارية التغذية بالحجر.</p><ArrowDownLeft size={29} strokeWidth={1} aria-hidden="true" /></div>
          </div>
        </section>

        <section className="equipment-chapter section-pad" aria-labelledby="equipment-title">
          <div className="section-inner equipment-layout">
            <div className="equipment-text reveal"><Eyebrow number="03 / 05">الأصول والمعدات</Eyebrow><h2 className="section-heading" id="equipment-title">القوة خلف<br /><span>كل حركة.</span></h2><p>أسطول من الحفارات والشيولات يعمل مع منظومة الإنتاج، إلى جانب الموازين والمولدات والمرافق الداعمة للتشغيل.</p><div className="equipment-counts"><div><strong>١٤</strong><span>حفاراً</span></div><div><strong>٦</strong><span>شيولات</span></div><div><strong>٢</strong><span>ميزان شاحنات</span></div><div><strong>٣</strong><span>مولدات كهرباء</span></div></div></div>
            <figure className="equipment-image reveal"><div className="image-window"><img src={equipment} loading="lazy" width={1536} height={1024} alt="صورة تجريبية توضيحية لحفار وشيول في محجر حجري" /></div><figcaption><span className="latin" dir="ltr">FIG. 02 — EXTRACTION</span><span>معدات الاستخراج والتحميل <small>صورة تجريبية</small></span></figcaption></figure>
          </div>
        </section>

        <section className="location-chapter section-pad" aria-labelledby="location-title">
          <div className="section-inner">
            <Eyebrow number="04 / 05">الموقع والمحاجر</Eyebrow>
            <div className="location-heading reveal"><div><h2 className="section-heading" id="location-title">الصمان،<br /><span>حيث تبدأ الحكاية.</span></h2><p>مجمع كسارات الصمان في المنطقة الشرقية، محافظة الأحساء، بالقرب من طريق الرياض–الدمام.</p></div><div className="coordinate"><MapPin size={20} strokeWidth={1.2} /><span className="latin" dir="ltr">25° 31′ 03″ N<br />48° 21′ 54″ E</span></div></div>
            <div className="quarry-list">
              {quarries.map((quarry) => <div className="quarry-row reveal" key={quarry.index}><span className="latin quarry-index">{quarry.index}</span><h3>{quarry.name}</h3><span className="quarry-area">{quarry.area} <small>م²</small></span><ArrowUpLeft size={20} strokeWidth={1.2} aria-hidden="true" /></div>)}
            </div>
            <p className="license-note reveal">المساحات وبيانات المحاجر وفق المستند المقدم. يخضع وضع الرخص وسريانها للتحقق ضمن إجراءات الفحص النافي للجهالة.</p>
          </div>
        </section>

        <section className="assurance-chapter section-pad" aria-labelledby="assurance-title">
          <div className="section-inner assurance-layout reveal"><div><Eyebrow number="05 / 05">الجاهزية والاعتماد</Eyebrow><h2 className="section-heading" id="assurance-title">أساسٌ متين<br /><span>للمستقبل.</span></h2></div><div className="assurance-details"><p>فريق تشغيلي وإداري يضم ٣٠ موظفاً وعاملاً، مع مكاتب ومستودعات وسكن للعمال وبنية تحتية داخل الموقع.</p><div className="iso-list"><div><span>إدارة الجودة</span><strong className="latin" dir="ltr">ISO 9001</strong></div><div><span>الإدارة البيئية</span><strong className="latin" dir="ltr">ISO 14001</strong></div><div><span>الصحة والسلامة المهنية</span><strong className="latin" dir="ltr">ISO 45001</strong></div></div><small>الشهادات الواردة في المستند صالحة حتى ١٧ أغسطس ٢٠٢٨.</small></div></div>
        </section>

        <section className="contact-chapter section-pad" id="التواصل" aria-labelledby="contact-title"><div className="section-inner contact-content reveal"><div className="contact-kicker"><span className="kicker-dot" /> الخطوة التالية</div><h2 id="contact-title">لنبدأ <em>الحديث.</em></h2><p>للاستفسار عن الفرصة الاستثمارية والحصول على المزيد من التفاصيل، تواصل مع شركة الأسطول الآلي.</p><div className="contact-actions"><Button asChild size="lg" className="contact-button"><a href="mailto:info@alostool.com.sa?subject=استفسار%20عن%20فرصة%20محجر%20الصمان"><Mail size={18} /> راسلنا الآن <ArrowLeft size={18} /></a></Button><a href="tel:920026556" className="phone-link" dir="ltr"><Phone size={17} /> 920026556</a></div></div></section>
      </main>
      <footer className="site-footer"><span>© شركة الأسطول الآلي</span><span>الصور المعروضة تجريبية وليست صوراً فعلية للموقع أو المعدات.</span><a href="#البداية">العودة للأعلى ↑</a></footer>
    </div>
  );
}