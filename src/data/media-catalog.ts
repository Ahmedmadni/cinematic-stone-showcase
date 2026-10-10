import { sitePhotoLibrary } from "./site-photo-library";
import { officialVideo } from "./official-video";
import { certificateScans, permitScans } from "./official-documents";
import logo from "@/assets/official/brand/alostool-logo.png";
import limestoneStrata from "@/assets/limestone-strata.svg";
import crusherFlow from "@/assets/crusher-flow.svg";
import quarryContours from "@/assets/quarry-contours.svg";

export type CatalogAsset = {
  id: string;
  kind: "image" | "video";
  url: string;
  thumbnail: string;
  ar: string;
  en: string;
  category: string;
  origin: "actual-site" | "document" | "brand" | "supplementary" | "decorative";
  webm?: string;
};
/** The library includes originals already bundled with the site, not just uploads. */
export const mediaCatalog: CatalogAsset[] = [
  ...sitePhotoLibrary.map((p) => ({
    id: p.id,
    kind: "image" as const,
    url: p.image,
    thumbnail: p.thumbnail,
    ar: p.ar,
    en: p.en,
    category: p.category,
    origin: "actual-site" as const,
  })),
  ...Object.values(officialVideo).map((v) => ({
    id: `video-${v.id}`,
    kind: "video" as const,
    url: v.src,
    webm: v.webm,
    thumbnail: v.poster,
    ar: v.ar,
    en: v.en,
    category: "video",
    origin: "actual-site" as const,
  })),
  ...Object.entries({ ...certificateScans, ...permitScans }).map(([id, d]) => ({
    id: `document-${id}`,
    kind: "image" as const,
    url: d.image,
    thumbnail: d.thumbnail,
    ar: `وثيقة ${id}`,
    en: `Document ${id}`,
    category: "documents",
    origin: "document" as const,
  })),
  {
    id: "brand-logo",
    kind: "image",
    url: logo,
    thumbnail: logo,
    ar: "شعار الأسطول الآلي",
    en: "Al Ostool logo",
    category: "brand",
    origin: "brand",
  },
  ...Object.values(officialVideo).map((v) => ({
    id: `poster-${v.id}`,
    kind: "image" as const,
    url: v.poster,
    thumbnail: v.poster,
    ar: `غلاف: ${v.ar}`,
    en: `Poster: ${v.en}`,
    category: "posters",
    origin: "actual-site" as const,
  })),
  ...[
    {
      id: "decorative-limestone-strata",
      url: limestoneStrata,
      ar: "رسم طبقات الحجر الجيري",
      en: "Limestone strata motif",
    },
    {
      id: "decorative-crusher-flow",
      url: crusherFlow,
      ar: "رسم مسار الكسارة",
      en: "Crusher flow motif",
    },
    {
      id: "decorative-quarry-contours",
      url: quarryContours,
      ar: "رسم كنتور المحجر",
      en: "Quarry contour motif",
    },
  ].map((asset) => ({
    ...asset,
    kind: "image" as const,
    thumbnail: asset.url,
    category: "decorative",
    origin: "decorative" as const,
  })),
];

// Illustrative/generated raster assets are permitted for equipment only.
// Non-equipment legacy concepts remain out of the admin picker and public site.
const equipmentEditorialFiles = new Set([
  "crushing-plant-alt.jpg",
  "crushing-plant.jpg",
  "equipment.jpg",
  "excavators-alt.jpg",
  "excavators.jpg",
  "generators-weighbridge-alt.jpg",
  "generators-weighbridge.jpg",
  "loaders-maintenance-alt.jpg",
  "loaders-maintenance.jpg",
]);
const editorialAssets = import.meta.glob<string>("/src/assets/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});
for (const [path, url] of Object.entries(editorialAssets)) {
  const name = path.split("/").pop()!;
  if (!equipmentEditorialFiles.has(name)) continue;
  mediaCatalog.push({
    id: `editorial-${name}`,
    kind: "image",
    url,
    thumbnail: url,
    ar: `تصور معدات — ${name}`,
    en: `Equipment concept — ${name}`,
    category: "supplementary",
    origin: "supplementary",
  });
}

const byUrl = new Map<string, CatalogAsset>();
for (const asset of mediaCatalog) {
  byUrl.set(asset.url, asset);
  // Video posters are separate image assets; a poster must not resolve to a video.
  if (asset.kind === "image") byUrl.set(asset.thumbnail, asset);
  if (asset.webm) byUrl.set(asset.webm, asset);
}
export function findCatalogAsset(url?: string) {
  return url ? byUrl.get(url) : undefined;
}

export const mediaContexts: Record<string, string> = {
  "*": "جميع مواضع الأصل",
  index: "الصفحة الرئيسية / الشعار",
  SiteLoader: "شاشة الدخول",
  HeroGallery: "صور الواجهة الرئيسية",
  SiteVideoLoop: "مقاطع الأقسام والواجهة",
  FullSiteTour: "الجولة الكاملة",
  AutoVisual: "المشاهد المتبدلة",
  GallerySlides: "معارض الفئات",
  GalleryLightbox: "عارض الصور المكبرة",
  SitePhotoArchive: "أرشيف الصور الـ77",
  QuarryAtlas: "بطاقات المحاجر",
  QuarryTransition: "الانتقال بين المشاهد",
  ProductionFlow: "رحلة الإنتاج",
  FleetExperience: "عرض المعدات",
  MapExperience: "الموقع والخريطة",
  EvidenceDocument: "المستندات",
  ProductionLines: "خطي الإنتاج والمنتجات",
  SiteMediaReel: "معرض وسائط الأقسام",
  BackdropMotif: "الرسوم الهندسية الزخرفية",
};
