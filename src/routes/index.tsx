import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowLeft, ArrowUpLeft, Mail, MapPin, Phone, MoveDownRight, MessageCircle, Languages, Bot, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SiteLanguageContext, translateSite, type SiteLanguage } from "@/lib/site-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GallerySlides } from "@/components/GallerySlides";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { AutoVisual } from "@/components/AutoVisual";
import { ProjectAssistant } from "@/components/ProjectAssistant";
import { CinematicDirector } from "@/components/cinematic/CinematicDirector";
import { AtmosphereLayers } from "@/components/cinematic/AtmosphereLayers";
import { QuarryTransition } from "@/components/cinematic/QuarryTransition";
import { ProductionFlow } from "@/components/cinematic/ProductionFlow";
import { FleetExperience } from "@/components/cinematic/FleetExperience";
import { QuarryAtlas } from "@/components/cinematic/QuarryAtlas";
import { MapExperience } from "@/components/cinematic/MapExperience";
import { EvidenceStudio, InvestorJourney } from "@/components/cinematic/EvidenceStudio";
import { inquirySchema, submitInquiry, type InquiryInput } from "@/lib/inquiries.functions";
import logoAsset from "@/assets/alostool-official-logo.png.asset.json";
import quarryAerial from "@/assets/quarry-aerial.jpg";
import quarryAerialAlt from "@/assets/quarry-aerial-alt.jpg";
import equipment from "@/assets/equipment.jpg";
import crushingPlant from "@/assets/crushing-plant.jpg";
import crushingPlantAlt from "@/assets/crushing-plant-alt.jpg";
import excavators from "@/assets/excavators.jpg";
import loaders from "@/assets/loaders-maintenance.jpg";
import powerAndWeighbridge from "@/assets/generators-weighbridge.jpg";
import officesAndWorkshop from "@/assets/offices-workshop.jpg";
import siteRoads from "@/assets/site-roads.jpg";
import housingAndRecreation from "@/assets/worker-housing-recreation.jpg";
import excavatorsAlt from "@/assets/excavators-alt.jpg";
import loadersAlt from "@/assets/loaders-maintenance-alt.jpg";
import powerAlt from "@/assets/generators-weighbridge-alt.jpg";
import officesAlt from "@/assets/offices-workshop-alt.jpg";
import roadsAlt from "@/assets/site-roads-alt.jpg";
import housingAlt from "@/assets/worker-housing-recreation-alt.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "محجر وكسارة الصمان | فرصة استثمارية — شركة الأسطول الآلي" },
      { name: "description", content: "تعرّف على فرصة الاستثمار في محجر وكسارة الصمان بالمنطقة الشرقية: ثلاثة محاجر، خطا إنتاج للبحص، حفارات وشيولات ومرافق تشغيلية. سجّل اهتمامك للتواصل." },
      { property: "og:title", content: "محجر وكسارة الصمان | شركة الأسطول الآلي" },
      { property: "og:description", content: "عرض استثماري عربي لمحاجر الصمان، خطوط التكسير والفرز، المعدات والمرافق التشغيلية. الصور توضيحية وليست صور الموقع الفعلية." },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "محجر وكسارة الصمان | شركة الأسطول الآلي",
      inLanguage: "ar-SA",
      description: "فرصة استثمارية في محاجر الصمان وخطوط إنتاج البحص بالمنطقة الشرقية في المملكة العربية السعودية.",
      about: { "@type": "Place", name: "محجر الصمان", address: { "@type": "PostalAddress", addressRegion: "المنطقة الشرقية", addressCountry: "SA" } },
      publisher: { "@type": "Organization", name: "شركة الأسطول الآلي", email: "info@alostool.com.sa" },
    }) }],
  }),
  component: Index,
});

const facts = [
  { number: "٧٤٣٬٢٨٢", unit: "م²", label: "إجمالي مساحات المحاجر" },
  { number: "٤٬٥٠٠", unit: "م³ / يوم", label: "طاقة إنتاجية تصل إلى" },
  { number: "٣", unit: "محاجر", label: "ضمن مجمع كسارات الصمان" },
];

const siteGallery = [
  { slides: [{ image: excavators, label: "مشهد حفارات الاستخراج" }, { image: excavatorsAlt, label: "حفارات عند واجهة المحجر" }], title: "حفارات الاستخراج", description: "معدات الحفر واستخراج الحجر الخام وتغذية الكسارات في المحاجر الثلاثة.", replacement: "حفارات محاجر الصمان", number: "01" },
  { slides: [{ image: loaders, label: "شيولات نقل المواد" }, { image: loadersAlt, label: "شيول تحميل الشاحنات" }], title: "الشيولات والتحميل", description: "شيولات لتحريك المواد وتحميل المنتج وتغذية الهوبر ضمن دورة التشغيل.", replacement: "شيولات التحميل بالموقع", number: "02" },
  { slides: [{ image: powerAndWeighbridge, label: "مرافق الموازين والمولدات" }, { image: powerAlt, label: "ميزان الشاحنات والمولدات" }], title: "المولدات والموازين", description: "مولدات لدعم التشغيل وموازين شاحنات ضمن المرافق المساندة للإنتاج.", replacement: "مولدات الكهرباء وموازين الشاحنات", number: "03" },
  { slides: [{ image: officesAndWorkshop, label: "مكاتب ومنطقة الصيانة" }, { image: officesAlt, label: "الورشة ومكاتب الإدارة" }], title: "المكاتب ومنطقة الصيانة", description: "مكاتب الإدارة وغرف المتابعة، مع مشهد توضيحي لمنطقة صيانة المعدات.", replacement: "مكاتب الإدارة والورشة إن توفرت صورتها", number: "04" },
  { slides: [{ image: siteRoads, label: "الطرق الداخلية" }, { image: roadsAlt, label: "طرق نقل المواد والساحات" }], title: "الطرق والساحات", description: "تمهيدات الطرق والساحات التي تربط مناطق الاستخراج والخدمات داخل الموقع.", replacement: "الطرق والساحات الداخلية", number: "05" },
  { slides: [{ image: housingAndRecreation, label: "السكن والمرافق الترفيهية" }, { image: housingAlt, label: "سكن العمال والملعب" }], title: "السكن والمرافق الترفيهية", description: "سكن العمال والملعب الترفيهي للموظفين ضمن المرافق المذكورة في العرض.", replacement: "سكن العمال والملعب الترفيهي", number: "06" },
];

const investmentEmail = "a.elmadin@alostool.com.sa";
const investmentWhatsApp = "966560409811";

function contactLinks(inquiry: InquiryInput) {
  const body = [
    "استفسار استثماري بشأن محجر وكسارة الصمان",
    `الاسم: ${inquiry.name}`,
    `البريد الإلكتروني: ${inquiry.email}`,
    inquiry.phone && `رقم الهاتف: ${inquiry.phone}`,
    inquiry.company && `الجهة / الشركة: ${inquiry.company}`,
    inquiry.message && `الرسالة: ${inquiry.message}`,
  ].filter(Boolean).join("\n");
  return {
    email: `mailto:${investmentEmail}?subject=${encodeURIComponent("استفسار استثماري — محجر الصمان")}&body=${encodeURIComponent(body)}`,
    whatsApp: `https://wa.me/${investmentWhatsApp}?text=${encodeURIComponent(body)}`,
  };
}

type SelectedGalleryImage = { item: number; slide: number };

function moveGallerySelection(current: SelectedGalleryImage | null, delta: number): SelectedGalleryImage | null {
  if (!current) return null;
  const gallery = siteGallery[current.item];
  if (!gallery || gallery.slides.length === 0) return null;
  const count = gallery.slides.length;
  return { item: current.item, slide: (current.slide + delta + count) % count };
}

function Eyebrow({ number, children }: { number: string; children: React.ReactNode }) {
  return <div className="eyebrow"><span className="eyebrow-line" /><span className="latin" dir="ltr">{number}</span><span>{children}</span></div>;
}

function Index() {
  const [language, setLanguage] = useState<SiteLanguage>("ar");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const assistantTrigger = useRef<HTMLButtonElement>(null);
  const assistantClose = useRef<HTMLButtonElement>(null);
  const t = (value: string) => translateSite(value, language);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [readyInquiry, setReadyInquiry] = useState<InquiryInput | null>(null);
  const [formError, setFormError] = useState("");
  const [fields, setFields] = useState<InquiryInput>({ name: "", email: "", phone: "", company: "", message: "", website: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<SelectedGalleryImage | null>(null);

  const updateField = (key: keyof InquiryInput, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: "" }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setFormError("");
    const parsed = inquirySchema.safeParse(fields);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => { const key = String(issue.path[0]); if (!errors[key]) errors[key] = issue.message; });
      setFieldErrors(errors);
      return;
    }
    setSubmitting(true);
    try {
      await submitInquiry({ data: parsed.data });
      setReadyInquiry(parsed.data);
      setSubmitted(true);
    } catch {
      setFormError("تعذر إرسال طلبك الآن. يمكنك مراسلتنا مباشرة عبر البريد الإلكتروني.");
    } finally {
      setSubmitting(false);
    }
  };

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

  useEffect(() => {
    try { if (localStorage.getItem("somman:language") === "en") setLanguage("en"); }
    catch { /* Storage is optional. */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.title = language === "en" ? "Al Somman Quarry | Investment Opportunity — Al Ostool Alaali" : "محجر وكسارة الصمان | فرصة استثمارية — شركة الأسطول الآلي";
    try { localStorage.setItem("somman:language", language); } catch { /* optional */ }
  }, [language]);

  useEffect(() => {
    if (assistantOpen) assistantClose.current?.focus();
  }, [assistantOpen]);

  useEffect(() => {
    if (!assistantOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setAssistantOpen(false); assistantTrigger.current?.focus(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [assistantOpen]);

  const links = readyInquiry ? contactLinks(readyInquiry) : null;
  const selectedGallery = selectedImage ? siteGallery[selectedImage.item] : undefined;
  const selectedSlide = selectedImage ? selectedGallery?.slides[selectedImage.slide] : undefined;

  return (
    <SiteLanguageContext.Provider value={{ language, t }}>
    <div className="presentation" dir={language === "ar" ? "rtl" : "ltr"} data-language={language}>
      <CinematicDirector />
      <div className="scene-backdrop" aria-hidden="true">
        <AutoVisual className="scene-visual" interval={9200} images={[{ image: quarryAerial, alt: "" }, { image: quarryAerialAlt, alt: "" }]} />
        <div className="scene-shade" />
      </div>

      <header className="site-header">
        <a href="#البداية" className="brand" aria-label={t("العودة إلى بداية العرض")}>
          <img className="brand-logo" src={logoAsset.url} width={1804} height={2338} alt={t("شعار شركة الأسطول الآلي")} /><span className="brand-project">{t("محجر الصمان")}</span>
        </a>
        <a className="header-contact" href="#التواصل">{t("تواصل للاستفسار")} <ArrowUpLeft size={17} strokeWidth={1.5} /></a>
      </header>

      <main>
        <section className="hero hero-cinematic" id="البداية" aria-labelledby="hero-title">
          <div className="hero-media" aria-hidden="true">
            <picture><source media="(max-width: 640px)" srcSet={equipment} /><img src={equipment} alt="" width={1536} height={1024} fetchPriority="high" decoding="async" /></picture>
          </div>
          <div className="hero-side-note latin" dir="ltr">AL SOMMAN  /  INVESTMENT OPPORTUNITY</div>
          <span className="hero-cinematic__chapter latin" dir="ltr" aria-hidden="true">CHAPTER 01 / THE AWAKENING</span>
          <div className="hero-content">
            <span className="photo-placeholder hero-photo-label">{t("صورة تجريبية · منظر عام لمحجر الصمان")}</span>
            <div className="hero-kicker"><span className="kicker-dot" /> {t("أصل صناعي في قلب الصمان")} <span className="kicker-rule" /></div>
            <h1 id="hero-title"><span className="cinema-title-line">{t("محجر")} <em>{t("الصمان")}</em></span><span className="hero-title-second cinema-title-line">{t("قوّةٌ من الأرض.")}</span></h1>
            <p className="hero-lead">{t("فرصة استثمارية في منظومة متكاملة لاستخراج وإنتاج مواد البناء، من عمق المحجر إلى المنتج النهائي.")}</p>
            <a className="hero-discover" data-cinema-magnetic="true" href="#الفرصة"><span className="discover-icon"><MoveDownRight size={21} strokeWidth={1.4} /></span><span>{t("استكشف الفرصة")}</span></a>
          </div>
          <div className="hero-bottom"><span>{t("شركة الأسطول الآلي")} <span className="hero-bottom-divider">/</span> {t("شركة مساهمة مقفلة")}</span><span className="latin" dir="ltr">25°30′ N — 48°21′ E</span></div>
        </section>

        <section className="overview section-pad" id="الفرصة">
          <div className="section-inner">
            <Eyebrow number="01 / 06">{t("الفرصة")}</Eyebrow>
            <div className="overview-grid">
              <h2 className="section-heading reveal">{t("ليست مجرد كسارة.")}<br /><span>{t("إنها منظومة إنتاج.")}</span></h2>
              <div className="overview-copy reveal">
                <p>{t("في منطقة الصمان، يتكامل الاستخراج والتكسير والفرز والتحميل ضمن أصل تشغيلي واحد لإنتاج البحص بمختلف أحجامه، بما يخدم مشاريع الطرق والإنشاءات.")}</p>
                <p>{t("ثلاثة محاجر وخطا كسارات، تدعمهما معدات ثقيلة ومرافق تشغيلية على أرض الموقع.")}</p>
              </div>
            </div>
            <div className="facts-grid">
              {facts.map((fact) => <div className="fact reveal" key={t(fact.label)}><div className="fact-number"><b>{fact.number}</b><span>{t(fact.unit)}</span></div><p>{t(fact.label)}</p></div>)}
            </div>
          </div>
        </section>

        <QuarryTransition />

        <section className="visual-chapter section-pad production-cinematic" aria-labelledby="production-title">
          <div className="section-inner">
            <Eyebrow number="02 / 06">{t("القدرة التشغيلية")}</Eyebrow>
            <div className="chapter-top reveal"><h2 className="section-heading" id="production-title">{t("من الحجر الخام")}<br /><span>{t("إلى قيمة تُبنى.")}</span></h2><p>{t("خطا إنتاج للكسارات والفرز، بمراحل تشغيلية مترابطة وغرف تحكم وسيور ناقلة وغرابيل لتصنيف المواد.")}</p></div>
            <figure className="image-feature reveal">
              <div className="image-window"><span className="photo-placeholder">{t("صورة تجريبية · خطا الكسارات والفرز — مجمع كسارات الصمان")}</span><AutoVisual interval={6800} images={[{ image: crushingPlant, alt: "صورة تجريبية توضيحية لخط تكسير وفرز الأحجار في محجر" }, { image: crushingPlantAlt, alt: "صورة تجريبية توضيحية لسيور الكسارات والفرز في محجر" }]} /></div>
              <figcaption><span className="latin" dir="ltr">FIG. 01 — PRODUCTION</span><span>{t("خطا الكسارات والفرز — مجمع كسارات الصمان")} <small>{t("صورة بديلة للتحديث")}</small></span></figcaption>
            </figure>
            <div className="production-detail reveal"><div><span className="detail-index latin">01 — 02</span><h3>{t("خطان للإنتاج")}</h3></div><p>{t("كسارات ثابتة وكون وجاو، مع معدات فرز ونقل للمواد. وتدعم خطوط الإنتاج بنية تشمل نفقاً وجداراً استنادياً واستمرارية التغذية بالحجر.")}</p><ArrowDownLeft size={29} strokeWidth={1} aria-hidden="true" /></div>
            <ProductionFlow />
          </div>
        </section>

        <section className="equipment-chapter section-pad" aria-labelledby="equipment-title">
          <div className="section-inner"><FleetExperience /></div>
        </section>

        <section className="site-gallery-chapter section-pad" aria-labelledby="site-gallery-title">
          <div className="section-inner">
            <Eyebrow number="04 / 06">{t("مشاهد من المنظومة")}</Eyebrow>
            <div className="gallery-intro reveal"><h2 className="section-heading" id="site-gallery-title">{t("ما وراء خطوط الإنتاج.")}<br /><span>{t("موقعٌ متكامل.")}</span></h2><p>{t("معدات ومرافق وطرق وسكن تدعم سير العمل اليومي. المشاهد التالية توضيحية، وتُستبدل بصور الموقع الفعلية عند توفرها.")}</p></div>
            <div className="site-gallery">
              {siteGallery.map((item, index) => <figure className="gallery-item reveal" key={item.number}>
                <GallerySlides slides={item.slides.map(slide => ({ ...slide, label: t(slide.label) }))} title={t(item.title)} replacement={t(item.replacement)} isPaused={selectedImage !== null} onOpen={(slide) => setSelectedImage({ item: index, slide })} />
                <figcaption><div><span className="gallery-number latin" dir="ltr">FIG. {item.number}</span><h3>{t(item.title)}</h3><p>{t(item.description)}</p></div><small>تُستبدل بصورة: {t(item.replacement)}</small></figcaption>
              </figure>)}
            </div>
          </div>
        </section>

        <section className="location-chapter section-pad" aria-labelledby="location-title">
          <div className="section-inner">
            <Eyebrow number="05 / 06">{t("الموقع والمحاجر")}</Eyebrow>
            <div className="location-heading reveal"><div><h2 className="section-heading" id="location-title">{t("الصمان،")}<br /><span>{t("حيث تبدأ الحكاية.")}</span></h2><p>{t("مجمع كسارات الصمان في المنطقة الشرقية، محافظة الأحساء، بالقرب من طريق الرياض–الدمام.")}</p></div><div className="coordinate"><MapPin size={20} strokeWidth={1.2} /><span className="latin" dir="ltr">25° 31′ 03″ N<br />48° 21′ 54″ E</span></div></div>
            <MapExperience />
            <QuarryAtlas />
            <p className="license-note reveal">{t("المساحات وبيانات المحاجر وفق المستند المقدم. يخضع وضع الرخص وسريانها للتحقق ضمن إجراءات الفحص النافي للجهالة.")}</p>
          </div>
        </section>

        <section className="assurance-chapter section-pad" id="الوثائق" aria-labelledby="assurance-title">
          <div className="section-inner"><EvidenceStudio /></div>
        </section>

        <section className="assistant-chapter section-pad" id="اسأل" aria-labelledby="assistant-title">
          <div className="section-inner assistant-layout reveal">
            <div><Eyebrow number="Q / A">{t("اسأل عن المشروع")}</Eyebrow><h2 className="section-heading" id="assistant-title">{t("لديك سؤال؟")}<br /><span>{t("اسأل مباشرة.")}</span></h2><p className="assistant-intro">{t("اطرح أسئلتك عن المحاجر والكسارات والمعدات والموقع، وتحصل على إجابة فورية مبنية على معلومات المشروع المعتمدة.")}</p></div>
            <div className="assistant-inline-cta"><Bot size={34} strokeWidth={1.4} aria-hidden="true" /><p>{t("مساعد الصمان")} — {t("يجيب من معلومات المشروع المعتمدة فقط")}</p><button type="button" onClick={() => setAssistantOpen(true)}>{t("اسأل مساعد الصمان")} <ArrowUpLeft size={18} aria-hidden="true" /></button></div>
          </div>
        </section>


        <InvestorJourney />

        <section className="contact-chapter section-pad" id="التواصل" aria-labelledby="contact-title">
          <div className="section-inner contact-layout reveal">
            <div className="contact-content">
              <div className="contact-kicker"><span className="kicker-dot" /> {t("الخطوة التالية")}</div>
              <h2 id="contact-title">{t("لنبدأ")} <em>{t("الحديث.")}</em></h2>
              <p>{t("مهتم بفرصة محجر الصمان؟ اترك بياناتك، ثم اختر التواصل مع مسؤول الاستثمار عبر البريد الإلكتروني أو واتساب.")}</p>
              <div className="contact-direct"><a href="mailto:info@alostool.com.sa?subject=استفسار%20عن%20فرصة%20محجر%20الصمان"><Mail size={17} /> info@alostool.com.sa</a><a href="tel:920026556" dir="ltr"><Phone size={17} /> 920026556</a></div>
            </div>
            <div className="inquiry-panel">
              {submitted && links ? <div className="inquiry-success" role="status"><span>{t("تم حفظ بيانات اهتمامك")}</span><h3>{t("اختر طريقة التواصل.")}</h3><p>{t("رسالتك جاهزة ببياناتك. اختر البريد الإلكتروني أو واتساب، ثم اضغط إرسال في التطبيق الذي يُفتح.")}</p><div className="inquiry-channels"><Button asChild className="contact-button"><a href={links.email}><Mail size={19} aria-hidden="true" /> {t("التواصل عبر البريد الإلكتروني")} <ArrowUpLeft size={17} aria-hidden="true" /></a></Button><Button asChild variant="outline" className="contact-button"><a href={links.whatsApp} target="_blank" rel="noopener noreferrer"><MessageCircle size={19} aria-hidden="true" /> {t("التواصل عبر واتساب")} <ArrowUpLeft size={17} aria-hidden="true" /></a></Button></div><p className="channel-note">{t("لن تُرسل الرسالة تلقائياً؛ يمكنك مراجعتها قبل الإرسال.")}</p></div> : <form onSubmit={handleSubmit} noValidate>
                <div className="form-title"><span className="latin" dir="ltr">INVESTMENT INQUIRY</span><h3>{t("سجّل اهتمامك")}</h3></div>
                <div className="form-fields">
                  <div className="form-field"><Label htmlFor="inquiry-name">{t("الاسم الكامل")} <span>*</span></Label><Input id="inquiry-name" name="name" autoComplete="name" value={fields.name} onChange={(e) => updateField("name", e.target.value)} maxLength={100} aria-invalid={!!fieldErrors["name"]} aria-describedby={fieldErrors["name"] ? "name-error" : undefined} placeholder={t("الاسم الكامل")} /><small id="name-error">{fieldErrors["name"]}</small></div>
                  <div className="form-field"><Label htmlFor="inquiry-email">{t("البريد الإلكتروني")} <span>*</span></Label><Input id="inquiry-email" name="email" type="email" dir="ltr" autoComplete="email" value={fields.email} onChange={(e) => updateField("email", e.target.value)} maxLength={255} aria-invalid={!!fieldErrors["email"]} aria-describedby={fieldErrors["email"] ? "email-error" : undefined} placeholder="name@example.com" /><small id="email-error">{fieldErrors["email"]}</small></div>
                  <div className="form-field"><Label htmlFor="inquiry-phone">{t("رقم الهاتف")}</Label><Input id="inquiry-phone" name="phone" type="tel" dir="ltr" autoComplete="tel" value={fields.phone} onChange={(e) => updateField("phone", e.target.value)} maxLength={30} aria-invalid={!!fieldErrors["phone"]} aria-describedby={fieldErrors["phone"] ? "phone-error" : undefined} placeholder="+966" /><small id="phone-error">{fieldErrors["phone"]}</small></div>
                  <div className="form-field"><Label htmlFor="inquiry-company">{t("الجهة / الشركة")}</Label><Input id="inquiry-company" name="company" autoComplete="organization" value={fields.company} onChange={(e) => updateField("company", e.target.value)} maxLength={120} placeholder={t("اسم الجهة")} /></div>
                  <div className="form-field form-field-wide"><Label htmlFor="inquiry-message">{t("رسالتك")} <span className="optional-label">{t("اختياري")}</span></Label><Textarea id="inquiry-message" name="message" value={fields.message} onChange={(e) => updateField("message", e.target.value)} maxLength={1000} placeholder={t("ما الذي تود معرفته عن الفرصة؟")} /></div>
                  <div className="form-honeypot" aria-hidden="true"><Label htmlFor="inquiry-website">{t("الموقع الإلكتروني")}</Label><Input id="inquiry-website" name="website" value={fields.website} onChange={(e) => updateField("website", e.target.value)} tabIndex={-1} autoComplete="off" /></div>
                </div>
                {formError && <p className="form-error" role="alert">{formError}</p>}
                <Button type="submit" disabled={submitting} className="contact-button">{submitting ? "جارٍ حفظ البيانات..." : "احفظ بياناتك واختر طريقة التواصل"} <ArrowLeft size={18} /></Button>
                <p className="form-privacy">{t("تُحفظ بياناتك للتواصل بشأن هذه الفرصة فقط. لن يُرسل بريد أو واتساب تلقائياً.")}</p>
              </form>}
            </div>
          </div>
        </section>
      </main>
      {selectedImage !== null && selectedGallery && selectedSlide && (
        <GalleryLightbox
          title={t(selectedGallery.title)}
          replacement={t(selectedGallery.replacement)}
          image={selectedSlide.image}
          label={t(selectedSlide.label)}
          position={selectedImage.slide + 1}
          total={selectedGallery.slides.length}
          onNext={() => setSelectedImage((current) => moveGallerySelection(current, 1))}
          onPrevious={() => setSelectedImage((current) => moveGallerySelection(current, -1))}
          onRequestClose={() => setSelectedImage(null)}
        />
      )}
      <div className="somman-floating-tools" role="group" aria-label={language === "ar" ? "أدوات الموقع" : "Site tools"}>
        <button type="button" className="somman-tool somman-tool--language" aria-label={language === "ar" ? "Switch website to English" : "تغيير لغة الموقع إلى العربية"} title={language === "ar" ? "English" : "العربية"} onClick={() => setLanguage(prev => prev === "ar" ? "en" : "ar")}>
          <Languages size={21} strokeWidth={1.8} aria-hidden="true"/><span>{language === "ar" ? "EN" : "عربي"}</span>
        </button>
        <button type="button" className="somman-tool somman-tool--assistant" ref={assistantTrigger} aria-label={assistantOpen ? t("أغلق المساعد") : t("فتح مساعد الصمان")} aria-expanded={assistantOpen} aria-controls="somman-assistant-drawer" onClick={() => setAssistantOpen(open => !open)}>
          <Bot size={23} strokeWidth={1.8} aria-hidden="true"/><span>{language === "ar" ? "اسأل الصمان" : "Ask Somman"}</span>
        </button>
      </div>
      <aside id="somman-assistant-drawer" hidden={!assistantOpen} className="somman-assistant-drawer" role="region" aria-label={t("مساعد الصمان")} dir={language === "ar" ? "rtl" : "ltr"}>
        <button type="button" className="somman-assistant-close" ref={assistantClose} aria-label={t("أغلق المساعد")} onClick={() => { setAssistantOpen(false); assistantTrigger.current?.focus(); }}><X size={20} aria-hidden="true"/></button>
        <ProjectAssistant />
      </aside>
      <footer className="site-footer"><span>{t("© شركة الأسطول الآلي")}</span><span>{t("الصور المعروضة تجريبية وليست صوراً فعلية للموقع أو المعدات.")}</span><a href="#البداية">{t("العودة للأعلى ↑")}</a></footer>
    </div>
    </SiteLanguageContext.Provider>
  );
}