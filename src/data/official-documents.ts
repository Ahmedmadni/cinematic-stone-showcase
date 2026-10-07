import qualityScan from "@/assets/official/documents/iso-9001.jpg";
import qualityPreview from "@/assets/official/documents/iso-9001-preview.webp";
import environmentScan from "@/assets/official/documents/iso-14001.jpg";
import environmentPreview from "@/assets/official/documents/iso-14001-preview.webp";
import safetyScan from "@/assets/official/documents/iso-45001.jpg";
import safetyPreview from "@/assets/official/documents/iso-45001-preview.webp";
import permit1 from "@/assets/official/documents/permit-1438733.png";
import permit1Preview from "@/assets/official/documents/permit-1438733-preview.webp";
import permit2 from "@/assets/official/documents/permit-14377125.png";
import permit2Preview from "@/assets/official/documents/permit-14377125-preview.webp";
import permit3 from "@/assets/official/documents/permit-1437731.png";
import permit3Preview from "@/assets/official/documents/permit-1437731-preview.webp";

export type SuppliedDocument = { image: string; thumbnail: string; width: number; height: number };
export const certificateScans: Record<string, SuppliedDocument> = {
  quality: { image: qualityScan, thumbnail: qualityPreview, width: 1130, height: 1600 },
  environment: { image: environmentScan, thumbnail: environmentPreview, width: 1130, height: 1600 },
  safety: { image: safetyScan, thumbnail: safetyPreview, width: 1130, height: 1600 },
};
export const permitScans: Record<string, SuppliedDocument> = {
  "1438733": { image: permit1, thumbnail: permit1Preview, width: 1348, height: 953 },
  "14377125": { image: permit2, thumbnail: permit2Preview, width: 1348, height: 953 },
  "1437731": { image: permit3, thumbnail: permit3Preview, width: 1348, height: 953 },
};
