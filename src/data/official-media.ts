import { sitePhotoLibrary, type SitePhoto } from "@/data/site-photo-library";

export type OfficialMediaItem = SitePhoto & { origin: "actual-site" };
function actualSite(id: string): OfficialMediaItem {
  const photo = sitePhotoLibrary.find(item => item.id === id);
  if (!photo) throw new Error("Unknown supplied site photograph: " + id);
  return { ...photo, origin: "actual-site" };
}

/** Curated lead photographs drawn from the complete, inspected source library. */
export const officialMedia = {
  hero: [actualSite("photo-025"), actualSite("photo-066"), actualSite("photo-077"), actualSite("photo-044")],
  production: { crusher: actualSite("photo-033"), conveyor: actualSite("photo-011"), overview: actualSite("photo-031") },
  facilities: {
    office: actualSite("photo-063"), workshop: actualSite("photo-065"),
    weighbridge: actualSite("photo-064"), housing: actualSite("photo-071"),
    additionalHousing: actualSite("photo-070"), prayer: actualSite("photo-062"),
    water: actualSite("photo-068"), fuel: actualSite("photo-069"),
    entrance: actualSite("photo-075"), access: actualSite("photo-076"),
  },
  equipment: { loader: actualSite("photo-045"), lineup: actualSite("photo-042"), front: actualSite("photo-046") },
} as const;
export const actualSitePhotoClass = "actual-site-photo";
