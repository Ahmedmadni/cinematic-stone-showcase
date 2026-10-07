import { useSiteLanguage } from "@/lib/site-language";
import { officialMedia } from "@/data/official-media";
import { AtmosphereLayers } from "@/components/cinematic/AtmosphereLayers";

/**
 * Two actual-site photographic layers from Al Somman.
 * Progress is provided by CinematicDirector as CSS variables.
 */
export function QuarryTransition() {
  const { t } = useSiteLanguage();
  return (
    <section
      className="cinematic-bridge"
      id="cinematic-bridge"
      aria-labelledby="cinematic-bridge-title"
    >
      <div className="cinematic-bridge__sticky">
        <div className="cinematic-bridge__shot cinematic-bridge__shot--quarry" aria-hidden="true">
          <img className="actual-site-photo" src={officialMedia.hero[2].image} alt="" loading="lazy" decoding="async" width={1600} height={900} />
        </div>
        <div className="cinematic-bridge__shot cinematic-bridge__shot--production" aria-hidden="true">
          <img className="actual-site-photo" src={officialMedia.production.crusher.image} alt="" loading="lazy" decoding="async" width={1600} height={900} />
        </div>
        <div className="cinematic-bridge__shadow" aria-hidden="true" />
        <AtmosphereLayers variant="bridge" />
        <div className="cinematic-bridge__edge" aria-hidden="true" />
        <div className="cinematic-bridge__body">
          <div className="cinematic-bridge__meta">
            <span className="cinematic-bridge__line" aria-hidden="true" />
            <span>{t("الفصل الثاني")}</span>
            <span className="latin" dir="ltr">FROM ROCK TO PRODUCTION</span>
          </div>
          <div className="cinematic-bridge__story">
            <p className="cinematic-bridge__before">{t("تبدأ الرحلة من عمق الأرض.")}</p>
            <h2 id="cinematic-bridge-title">{t("إلى قلب")} <em>{t("الإنتاج.")}</em></h2>
            <p className="cinematic-bridge__after">{t("حيث يتحول الحجر الخام إلى بحص عبر خطوط التكسير والفرز.")}</p>
          </div>
          <a className="cinematic-bridge__skip" href="#production-title">
            {t("انتقل مباشرة إلى تفاصيل الإنتاج")}
            <span aria-hidden="true">↙</span>
          </a>
        </div>
        <div className="cinematic-bridge__footer">
          <span>{t("تصوير فعلي من موقع محجر وكسارة الصمان")}</span>
          <span className="latin" dir="ltr">02 — PRODUCTION</span>
        </div>
        <div className="cinematic-bridge__meter" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
