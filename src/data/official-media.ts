import heroCrusherAerial from "@/assets/official/hero/hero-crusher-aerial-01.webp";
import heroTunnelIntegration from "@/assets/official/hero/hero-tunnel-integration-01.webp";
import heroQuarrySite from "@/assets/official/hero/hero-quarry-site-01.webp";
import heroEquipmentLineup from "@/assets/official/hero/hero-equipment-lineup-01.webp";
import productionPrimaryCrusher from "@/assets/official/production/production-primary-crusher-01.webp";
import productionConveyor from "@/assets/official/production/production-conveyor-01.webp";
import facilityOffice from "@/assets/official/facilities/facility-office-01.webp";
import facilityWorkshop from "@/assets/official/facilities/facility-workshop-01.webp";
import facilityWeighbridge from "@/assets/official/facilities/facility-weighbridge-01.webp";
import facilityHousing from "@/assets/official/facilities/facility-housing-01.webp";
import equipmentLoader from "@/assets/official/equipment/equipment-loader-01.webp";
import equipmentFleetLineup from "@/assets/official/equipment/equipment-fleet-lineup-01.webp";

export type OfficialMediaItem = {
  image: string;
  en: string;
  ar: string;
  origin: "actual-site";
};

const actualSite = (
  image: string,
  en: string,
  ar: string,
): OfficialMediaItem => ({ image, en, ar, origin: "actual-site" });

export const officialMedia = {
  hero: [
    actualSite(heroCrusherAerial, "Al Somman crushing plant from the air", "تصوير جوي فعلي لكسارة الصمان"),
    actualSite(heroTunnelIntegration, "Tunnel and retaining-wall integration", "التكامل الفعلي للنفق والجدار الاستنادي مع خط الإنتاج"),
    actualSite(heroQuarrySite, "Al Somman quarry site", "تصوير فعلي لموقع محجر الصمان"),
    actualSite(heroEquipmentLineup, "Heavy-equipment lineup at the site", "معدات ثقيلة فعلية داخل الموقع"),
  ],
  production: {
    crusher: actualSite(productionPrimaryCrusher, "Primary crushing line", "خط التكسير الفعلي بالموقع"),
    conveyor: actualSite(productionConveyor, "Production conveyor system", "سيور الإنتاج الفعلية بالموقع"),
  },
  facilities: {
    office: actualSite(facilityOffice, "Site offices", "المكاتب الفعلية بالموقع"),
    workshop: actualSite(facilityWorkshop, "Maintenance workshop", "الورشة الفعلية بالموقع"),
    weighbridge: actualSite(facilityWeighbridge, "Truck weighbridge", "ميزان الشاحنات الفعلي بالموقع"),
    housing: actualSite(facilityHousing, "Worker housing", "سكن العمال الفعلي بالموقع"),
  },
  equipment: {
    loader: actualSite(equipmentLoader, "Loader operating at Al Somman", "شيول فعلي يعمل في موقع الصمان"),
    lineup: actualSite(equipmentFleetLineup, "Heavy-equipment fleet lineup", "اصطفاف فعلي لمعدات الموقع"),
  },
} as const;

export const actualSitePhotoClass = "actual-site-photo";
