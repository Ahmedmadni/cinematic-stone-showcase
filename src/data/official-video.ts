import fullTourWebm from "@/assets/official/video/full-tour.webm";
import quarryWebm from "@/assets/official/video/quarry.webm";
import facilitiesWebm from "@/assets/official/video/facilities.webm";
import fleetWebm from "@/assets/official/video/fleet.webm";
import productionWebm from "@/assets/official/video/production.webm";
import heroWebm from "@/assets/official/video/hero.webm";
import hero from "@/assets/official/video/hero.mp4";
import heroPoster from "@/assets/official/video/hero-poster.webp";
import production from "@/assets/official/video/production.mp4";
import productionPoster from "@/assets/official/video/production-poster.webp";
import fleet from "@/assets/official/video/fleet.mp4";
import fleetPoster from "@/assets/official/video/fleet-poster.webp";
import facilities from "@/assets/official/video/facilities.mp4";
import facilitiesPoster from "@/assets/official/video/facilities-poster.webp";
import quarry from "@/assets/official/video/quarry.mp4";
import quarryPoster from "@/assets/official/video/quarry-poster.webp";
import fullTour from "@/assets/official/video/full-tour.mp4";
import fullTourPoster from "@/assets/official/video/full-tour-poster.webp";

export type SiteVideo = { id: string; src: string; webm?: string | undefined; poster: string; ar: string; en: string };
export const officialVideo = {
  hero: { id: "hero", src: hero, webm: heroWebm, poster: heroPoster, ar: "مشهد جوي لخطوط الكسارة والسيور", en: "Aerial view of the crushing plant and conveyors" },
  production: { id: "production", src: production, webm: productionWebm, poster: productionPoster, ar: "خطوط التكسير والفرز والسيور", en: "Crushing, screening and conveyor lines" },
  fleet: { id: "fleet", src: fleet, webm: fleetWebm, poster: fleetPoster, ar: "المعدات الثقيلة في ساحة الموقع", en: "Heavy equipment in the site yard" },
  facilities: { id: "facilities", src: facilities, webm: facilitiesWebm, poster: facilitiesPoster, ar: "مرافق العاملين داخل الموقع", en: "Staff facilities within the site" },
  quarry: { id: "quarry", src: quarry, webm: quarryWebm, poster: quarryPoster, ar: "مصاطب المحجر ومعدات التكسير المتنقلة", en: "Quarry benches and mobile crushing equipment" },
  fullTour: { id: "full-tour", src: fullTour, webm: fullTourWebm, poster: fullTourPoster, ar: "داخل الصمان — الجولة الكاملة", en: "Inside Al Somman — the full tour" },
} satisfies Record<string, SiteVideo>;
