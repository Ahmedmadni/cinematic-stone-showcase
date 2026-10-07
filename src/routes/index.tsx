import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowLeft, ArrowUpLeft, Mail, MapPin, Phone, MoveDownRight, MessageCircle, Languages, Bot, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SiteLanguageContext, translateSite, localizeDisplayNumber, type SiteLanguage } from "@/lib/site-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GallerySlides } from "@/components/GallerySlides";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { SitePhotoArchive } from "@/components/SitePhotoArchive";
import { AutoVisual } from "@/components/AutoVisual";
import { HeroGallery } from "@/components/cinematic/HeroGallery";
import { SplitHeadline, TypewriterHeadline, WordSlide } from "@/components/HeadlineMotion";
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
import { officialMedia } from "@/data/official-media";
import officialLogo from "@/assets/official/brand/alostool-logo.png";
import excavators from "@/assets/excavators.jpg";
import loaders from "@/assets/loaders-maintenance.jpg";
import powerAndWeighbridge from "@/assets/generators-weighbridge.jpg";
import excavatorsAlt from "@/assets/excavators-alt.jpg";
import loadersAlt from "@/assets/loaders-maintenance-alt.jpg";
import powerAlt from "@/assets/generators-weighbridge-alt.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Al Somman Quarry & Crushing Plant | Al Ostool Investment Opportunity" },
      { name: "description", content: "Explore the documented Al Somman quarry and crushing plant investment opportunity in Saudi Arabia through actual-site photography, three quarry records, two production lines, equipment and support facilities." },
      { property: "og:title", content: "Al Somman Quarry & Crushing Plant | Al Ostool" },
      { property: "og:description", content: "A bilingual investment presentation using actual Al Somman site photography alongside supplementary equipment visuals. Current permit status remains subject to document verification." },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "ar_SA" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Al Somman Quarry & Crushing Plant | Al Ostool",
      inLanguage: ["en", "ar-SA"],
      description: "Bilingual reference presentation of the Al Somman quarry and two crushing lines in Saudi Arabia, Eastern Province.",
      about: { "@type": "Place", name: "Al Somman Quarry", address: { "@type": "PostalAddress", addressRegion: "Eastern Province", addressCountry: "SA" } },
      publisher: { "@type": "Organization", name: "Al Ostool Alaali", email: "info@alostool.com.sa" },
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
  {
    slides: [
      { image: officialMedia.equipment.lineup.image, label: "معدات ثقيلة فعلية داخل الموقع", origin: "actual-site" as const },
      { image: excavators, label: "مشهد حفارات الاستخراج", origin: "supplementary" as const },
      { image: excavatorsAlt, label: "حفارات عند واجهة المحجر", origin: "supplementary" as const },
    ],
    title: "حفارات الاستخراج",
    description: "مشاهد تحريرية احترافية لفئة الحفارات مدعومة بتصوير فعلي لمعدات الموقع.",
    replacement: "معدات الاستخراج في الصمان",
    number: "01",
  },
  {
    slides: [
      { image: officialMedia.equipment.loader.image, label: "شيول وحفار داخل موقع الصمان", origin: "actual-site" as const },
      { image: officialMedia.equipment.front.image, label: "واجهة معدات التحميل والحفر", origin: "actual-site" as const },
      { image: loaders, label: "شيولات نقل المواد", origin: "supplementary" as const },
      { image: loadersAlt, label: "شيول تحميل الشاحنات", origin: "supplementary" as const },
    ],
    title: "الشيولات والتحميل",
    description: "تصوير فعلي لمعدات التحميل والحفر بالموقع مع مشاهد معدات تحريرية مكملة.",
    replacement: "شيولات التحميل بالموقع",
    number: "02",
  },
  {
    slides: [
      { image: officialMedia.facilities.weighbridge.image, label: "ميزان الشاحنات الفعلي بالموقع", origin: "actual-site" as const },
      { image: officialMedia.facilities.water.image, label: "خزانات المياه بالموقع", origin: "actual-site" as const },
      { image: officialMedia.facilities.fuel.image, label: "خزانات الوقود بالموقع", origin: "actual-site" as const },
      { image: powerAndWeighbridge, label: "مشهد تحريري للموازين والمولدات", origin: "supplementary" as const },
      { image: powerAlt, label: "مشهد مرافق تشغيلي مكمل", origin: "supplementary" as const },
    ],
    title: "المولدات والموازين",
    description: "تصوير فعلي لميزان الشاحنات مع مشاهد تحريرية مكملة للمرافق التشغيلية.",
    replacement: "الموازين والمرافق التشغيلية",
    number: "03",
  },
  {
    slides: [
      { image: officialMedia.facilities.office.image, label: "المكاتب الفعلية بالموقع", origin: "actual-site" as const },
      { image: officialMedia.facilities.workshop.image, label: "الورشة الفعلية بالموقع", origin: "actual-site" as const },
    ],
    title: "المكاتب ومنطقة الصيانة",
    description: "تصوير فعلي لمكاتب الإدارة والورشة ومرافق الصيانة في موقع الصمان.",
    replacement: "المكاتب والورشة",
    number: "04",
  },
  {
    slides: [
      { image: officialMedia.facilities.entrance.image, label: "مدخل الموقع وطريق الدخول", origin: "actual-site" as const },
      { image: officialMedia.facilities.access.image, label: "مدخل الكسارة والساحات", origin: "actual-site" as const },
    ],
    title: "الطرق والساحات",
    description: "تصوير فعلي لمدخل الكسارة وطرق الدخول والساحات الداخلية.",
    replacement: "الطرق والساحات الداخلية",
    number: "05",
  },
  {
    slides: [
      { image: officialMedia.facilities.housing.image, label: "سكن العمال الفعلي بالموقع", origin: "actual-site" as const },
      { image: officialMedia.facilities.additionalHousing.image, label: "السكن الإضافي للعاملين", origin: "actual-site" as const },
      { image: officialMedia.facilities.prayer.image, label: "المصلى والاستراحة بالموقع", origin: "actual-site" as const },
    ],
    title: "سكن العمال والمرافق",
    description: "تصوير فعلي لسكن العمال والسكن الإضافي والمصلى والاستراحة.",
    replacement: "سكن العمال بالموقع",
    number: "06",
  },
];

const investmentEmail = "a.elmadin@alostool.com.sa";
const investmentWhatsApp = "966560409811";

function contactLinks(inquiry: InquiryInput, language: SiteLanguage) {
  // Contacts are visitor-initiated. The user reviews the email/WhatsApp
  // content in their own app before deciding to send it.
  const subject = language === "en"
    ? "Al Somman Quarry — investment inquiry"
    : "استفسار استثماري — محجر الصمان";
  const body = (language === "en" ? [
    "Investment inquiry — Al Somman quarry and crushing plant",
    "Name: " + inquiry.name,
    "Email: " + inquiry.email,
    inquiry.phone && "Phone: " + inquiry.phone,
    inquiry.company && "Company: " + inquiry.company,
    inquiry.message && "Message: " + inquiry.message,
  ] : [
    "استفسار استثماري بشأن محجر وكسارة الصمان",
    "الاسم: " + inquiry.name,
    "البريد الإلكتروني: " + inquiry.email,
    inquiry.phone && "رقم الهاتف: " + inquiry.phone,
    inquiry.company && "الجهة / الشركة: " + inquiry.company,
    inquiry.message && "الرسالة: " + inquiry.message,
  ]).filter(Boolean).join("\n");
  return {
    email: "mailto:" + investmentEmail + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body),
    whatsApp: "https://wa.me/" + investmentWhatsApp + "?text=" + encodeURIComponent(body),
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
  const [language, setLanguage] = useState<SiteLanguage>("en");
  const [localeReady, setLocaleReady] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const assistantTrigger = useRef<HTMLButtonElement>(null);
  const assistantClose = useRef<HTMLButtonElement>(null);
  const t = (value: string) => translateSite(value, language);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [readyInquiry, setReadyInquiry] = useState<InquiryInput | null>(null);
  const [formError, setFormError] = useState("");
  const [fields, setFields] = useState<InquiryInput>({ name: "", email: "", phone: "", company: "", message: "", website: "", privacyConsent: false });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<SelectedGalleryImage | null>(null);

  const updateField = (key: keyof InquiryInput, value: string | boolean) => {
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
      setFormError("تعذّر إرسال طلبك الآن. يمكنك مراسلتنا مباشرة عبر البريد الإلكتروني.");
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
    try { if (localStorage.getItem("somman:language") === "ar") setLanguage("ar"); }
    catch { /* Storage is optional. */ }
    setLocaleReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.title = language === "en" ? "Al Somman Quarry | Investment Opportunity — Al Ostool Alaali" : "محجر وكسارة الصمان | فرصة استثمارية — شركة الأسطول الآلي";
    if (localeReady) {
      try { localStorage.setItem("somman:language", language); } catch { /* optional */ }
    }
  }, [language, localeReady]);

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

  const links = readyInquiry ? contactLinks(readyInquiry, language) : null;
  const selectedGallery = selectedImage ? siteGallery[selectedImage.item] : undefined;
  const selectedSlide = selectedImage ? selectedGallery?.slides[selectedImage.slide] : undefined;

  return (
    <SiteLanguageContext.Provider value={{ language, t }}>
    <div className="presentation" dir={language === "ar" ? "rtl" : "ltr"} data-language={language}>
      <a className="skip-to-content" href="#main-content">{t("تجاوز إلى المحتوى الرئيسي")}</a>
      <CinematicDirector />
      <div className="scene-backdrop" aria-hidden="true">
        <AutoVisual className="scene-visual actual-site-visual" interval={9200} images={[
          { image: officialMedia.hero[0].image, alt: "", origin: "actual-site", width: 1600, height: 899 },
          { image: officialMedia.hero[2].image, alt: "", origin: "actual-site", width: 1600, height: 900 },
        ]} />
        <div className="scene-shade" />
      </div>

      <header className="site-header">
        <a href="#البداية" className="brand" aria-label={t("العودة إلى بداية العرض")}>
          <img className="brand-logo" src={officialLogo} width={420} height={544} alt={t("شعار شركة الأسطول الآلي")} /><span className="brand-project">{t("محجر الصمان")}</span>
        </a>
        <a className="header-contact" href="#التواصل">{t("تواصل للاستفسار")} <ArrowUpLeft size={17} strokeWidth={1.5} /></a>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="hero hero-cinematic" id="البداية" aria-labelledby="hero-title">
          <HeroGallery />
          <div className="hero-side-note latin" dir="ltr">AL SOMMAN  /  INVESTMENT OPPORTUNITY</div>
          <span className="hero-cinematic__chapter latin" dir="ltr" aria-hidden="true">CHAPTER 01 / THE AWAKENING</span>
          <div className="hero-content">
            <span className="photo-placeholder hero-photo-label">{t("تصوير فعلي من موقع الصمان، مع مشاهد معدات تحريرية مكملة ومميزة بوضوح.")}</span>
            <div className="hero-kicker"><span className="kicker-dot" /> {t("أصل صناعي في قلب الصمان")} <span className="kicker-rule" /></div>
            <h1 id="hero-title"><span className="cinema-title-line">{t("محجر")} <em><SplitHeadline text={t("الصمان")} /></em></span><span className="hero-title-second cinema-title-line">{t("قوّةٌ من الأرض.")}</span></h1>
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
              {facts.map((fact) => <div className="fact reveal" key={t(fact.label)}><div className="fact-number"><b>{localizeDisplayNumber(fact.number, language)}</b><span>{t(fact.unit)}</span></div><p>{t(fact.label)}</p></div>)}
            </div>
          </div>
        </section>

        <QuarryTransition />

        <section className="visual-chapter section-pad production-cinematic" aria-labelledby="production-title">
          <div className="section-inner">
            <Eyebrow number="02 / 06">{t("القدرة التشغيلية")}</Eyebrow>
            <div className="chapter-top reveal"><h2 className="section-heading" id="production-title">{t("من الحجر الخام")}<br /><span>{t("إلى قيمة تُبنى.")}</span></h2><p>{t("خطا إنتاج للكسارات والفرز، بمراحل تشغيلية مترابطة وغرف تحكم وسيور ناقلة وغرابيل لتصنيف المواد.")}</p></div>
            <figure className="image-feature reveal">
              <div className="image-window"><span className="photo-placeholder">{t("تصوير فعلي · خطوط التكسير والسيور — مجمع كسارات الصمان")}</span><AutoVisual className="actual-site-visual" interval={6800} images={[
                { image: officialMedia.production.crusher.image, alt: t("تصوير فعلي لخط التكسير في كسارة الصمان"), origin: "actual-site", width: 1600, height: 900 },
                { image: officialMedia.production.conveyor.image, alt: t("تصوير فعلي لسيور وخطوط الإنتاج في الصمان"), origin: "actual-site", width: 1600, height: 900 },
              ]} /></div>
              <figcaption><span className="latin" dir="ltr">FIG. 01 — ACTUAL PRODUCTION</span><span>{t("خطوط الكسارات والفرز — مجمع كسارات الصمان")} <small>{t("تصوير فعلي من الموقع")}</small></span></figcaption>
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
            <div className="gallery-intro reveal"><h2 className="section-heading" id="site-gallery-title">{t("ما وراء خطوط الإنتاج.")}<br /><span>{t("موقعٌ متكامل.")}</span><WordSlide words={siteGallery.slice(0, 3).map(item => t(item.title))} /></h2><p>{t("تصوير فعلي للمكاتب والورشة والموازين والسكن والمعدات وطرق الدخول، مع إبقاء بعض مشاهد المعدات الاحترافية كمادة تحريرية مكملة.")}</p></div>
            <div className="site-gallery">
              {siteGallery.map((item, index) => <figure className="gallery-item reveal" key={item.number}>
                <GallerySlides slides={item.slides.map(slide => ({ ...slide, label: t(slide.label) }))} title={t(item.title)} replacement={t(item.replacement)} interval={5900 + index * 480} isPaused={selectedImage !== null} onOpen={(slide) => setSelectedImage({ item: index, slide })} />
                <figcaption><div><span className="gallery-number latin" dir="ltr">FIG. {item.number}</span><h3>{t(item.title)}</h3><p>{t(item.description)}</p></div><small>{item.slides.every(slide => slide.origin === "actual-site") ? t("تصوير فعلي من موقع الصمان") : t("ACTUAL SITE + CURATED EDITORIAL")} · {t(item.replacement)}</small></figcaption>
              </figure>)}
            </div>
            <SitePhotoArchive />
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
            <div><Eyebrow number="Q / A">{t("اسأل عن المشروع")}</Eyebrow><h2 className="section-heading" id="assistant-title">{t("لديك سؤال؟")}<br /><span><TypewriterHeadline text={t("اسأل مباشرة.")} language={language} /></span></h2><p className="assistant-intro">{t("اطرح أسئلتك عن المحاجر والكسارات والمعدات والموقع، وتحصل على إجابة فورية مبنية على معلومات المشروع المعتمدة.")}</p></div>
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
                <div className="inquiry-consent">
                  <label htmlFor="inquiry-consent" className="inquiry-consent__choice">
                    <input id="inquiry-consent" type="checkbox" name="privacyConsent" required checked={fields.privacyConsent}
                      onChange={(event) => updateField("privacyConsent", event.target.checked)}
                      aria-invalid={Boolean(fieldErrors["privacyConsent"])}
                      aria-describedby={fieldErrors["privacyConsent"] ? "inquiry-consent-description inquiry-consent-error" : "inquiry-consent-description"} />
                    <span>{t("أوافق على حفظ بيانات هذا النموذج حتى يتمكن فريق الاستثمار من مراجعة اهتمامي والتواصل معي بشأن محجر الصمان.")}</span>
                  </label>
                  <p id="inquiry-consent-description">{t("الاسم والبريد الإلكتروني مطلوبان، ورقم الهاتف والشركة والرسالة اختيارية. لن تُرسل رسائل بريد أو واتساب تلقائيًا.")}</p>
                  {fieldErrors["privacyConsent"] && <small id="inquiry-consent-error" className="form-error" role="alert">{t(fieldErrors["privacyConsent"])}</small>}
                  <p className="inquiry-consent__request">{t("للاستفسار عن البيانات التي قدمتها أو طلب تعديلها أو حذفها، راسل")} <a href="mailto:info@alostool.com.sa" dir="ltr">info@alostool.com.sa</a>.</p>
                </div>
                {formError && <p className="form-error" role="alert">{t(formError)}</p>}
                <Button type="submit" disabled={submitting} className="contact-button">{submitting ? t("جارٍ حفظ البيانات...") : t("احفظ بياناتك واختر طريقة التواصل")} <ArrowLeft size={18} /></Button>
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
          origin={selectedSlide.origin}
          position={selectedImage.slide + 1}
          total={selectedGallery.slides.length}
          onNext={() => setSelectedImage((current) => moveGallerySelection(current, 1))}
          onPrevious={() => setSelectedImage((current) => moveGallerySelection(current, -1))}
          onRequestClose={() => setSelectedImage(null)}
        />
      )}
      <div className="somman-floating-tools" role="group" aria-label={language === "ar" ? "أدوات الموقع" : "Site tools"}>
        <button type="button" className="somman-tool somman-tool--language" aria-label={language === "ar" ? "Switch website to English" : "تغيير لغة الموقع إلى العربية"} title={language === "ar" ? "English" : "العربية"} onClick={() => setLanguage(prev => prev === "ar" ? "en" : "ar")}>
          <Languages size={23} strokeWidth={1.8} aria-hidden="true"/>
        </button>
        <button type="button" className="somman-tool somman-tool--assistant" ref={assistantTrigger} aria-label={assistantOpen ? t("أغلق المساعد") : t("فتح مساعد الصمان")} aria-expanded={assistantOpen} aria-controls="somman-assistant-drawer" title={assistantOpen ? t("أغلق المساعد") : t("فتح مساعد الصمان")} onClick={() => setAssistantOpen(open => !open)}>
          <Bot size={23} strokeWidth={1.8} aria-hidden="true"/>
        </button>
      </div>
      <aside id="somman-assistant-drawer" hidden={!assistantOpen} className="somman-assistant-drawer" role="region" aria-label={t("مساعد الصمان")} dir={language === "ar" ? "rtl" : "ltr"}>
        <button type="button" className="somman-assistant-close" ref={assistantClose} aria-label={t("أغلق المساعد")} onClick={() => { setAssistantOpen(false); assistantTrigger.current?.focus(); }}><X size={20} aria-hidden="true"/></button>
        <ProjectAssistant active={assistantOpen} />
      </aside>
      <footer className="site-footer"><span>{t("© شركة الأسطول الآلي")}</span><span>{t("يستخدم العرض تصويرًا فعليًا من موقع الصمان إلى جانب مشاهد معدات تحريرية مكملة عند الإشارة إليها.")}</span><a href="#البداية">{t("العودة للأعلى ↑")}</a></footer>
    </div>
    </SiteLanguageContext.Provider>
  );
}