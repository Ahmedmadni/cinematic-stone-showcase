import { useState } from "react";
import { ArrowDownLeft, ArrowUpLeft, Images } from "lucide-react";
import { useSiteLanguage } from "@/lib/site-language";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { sitePhotoLibrary, type SitePhotoCategory } from "@/data/site-photo-library";

const categories = [
  { id: "all", ar: "جميع الصور", en: "All photographs" },
  { id: "production", ar: "الكسارات والإنتاج", en: "Crushing and production" },
  { id: "equipment", ar: "المعدات", en: "Equipment" },
  { id: "facilities", ar: "المرافق", en: "Facilities" },
  { id: "quarry", ar: "المحجر", en: "Quarry" },
] as const;
const PAGE_SIZE = 8;

/** Full source library is available on demand; no hidden 77-image DOM. */
export function SitePhotoArchive() {
  const { language } = useSiteLanguage();
  const en = language === "en";
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<SitePhotoCategory | "all">("all");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = sitePhotoLibrary.filter(photo => category === "all" || photo.category === category);
  const selectedIndex = filtered.findIndex(photo => photo.id === selected);
  const current = filtered[selectedIndex];
  function move(step: number) {
    setSelected(filtered[(selectedIndex + step + filtered.length) % filtered.length]?.id ?? null);
  }

  return (
    <div className="site-photo-archive" data-archive-open={open}>
      <div className="site-photo-archive__header">
        <div><span className="latin" dir="ltr">AL SOMMAN / 77 PHOTOGRAPHS</span>
          <h3>{en ? "The site, in its own photographs." : "الموقع، بعدسة التصوير الفعلي."}</h3>
          <p>{en ? "Browse the supplied photographs of production, equipment, support facilities and quarry benches." : "استعرض الصور المرفقة للإنتاج والمعدات والمرافق ومصاطب المحجر."}</p>
        </div>
        <button className="site-photo-archive__toggle" type="button" aria-expanded={open} aria-controls="site-photo-library" onClick={() => setOpen(value => !value)}>
          <Images size={20} aria-hidden="true" />{open ? (en ? "Close photo library" : "إغلاق معرض الصور") : (en ? "Browse all 77 photographs" : "تصفح الصور الـ77")}
          {open ? <ArrowUpLeft size={18} aria-hidden="true" /> : <ArrowDownLeft size={18} aria-hidden="true" />}
        </button>
      </div>
      {open && <div id="site-photo-library">
        <div className="site-photo-archive__filters" role="group" aria-label={en ? "Filter site photographs" : "تصنيف صور الموقع"}>
          {categories.map(item => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setLimit(PAGE_SIZE); }}>
            {en ? item.en : item.ar}<span className="latin">{item.id === "all" ? sitePhotoLibrary.length : sitePhotoLibrary.filter(photo => photo.category === item.id).length}</span>
          </button>)}
        </div>
        <div className="site-photo-archive__grid">
          {filtered.slice(0, limit).map(photo => <button className="site-photo-archive__photo" type="button" key={photo.id} onClick={() => setSelected(photo.id)} aria-label={(en ? "View photograph: " : "عرض الصورة: ") + (en ? photo.en : photo.ar)}>
            <img className="actual-site-photo" src={photo.thumbnail} width={photo.width} height={photo.height} alt={en ? photo.en : photo.ar} loading="lazy" decoding="async" data-media-origin="actual-site" />
            <span><small className="latin">{photo.id.replace("photo-", "")}</small>{en ? photo.en : photo.ar}</span>
          </button>)}
        </div>
        <div className="site-photo-archive__footer">
          <span>{en ? `${Math.min(limit, filtered.length)} of ${filtered.length} photographs` : `${Math.min(limit, filtered.length).toLocaleString("ar-SA")} من ${filtered.length.toLocaleString("ar-SA")} صورة`}</span>
          {limit < filtered.length && <button type="button" onClick={() => setLimit(value => value + PAGE_SIZE)}>{en ? "Show more photographs" : "عرض المزيد من الصور"}<ArrowDownLeft size={18} aria-hidden="true" /></button>}
        </div>
      </div>}
      {current && <GalleryLightbox title={en ? "Al Somman site photographs" : "صور موقع الصمان"} replacement={en ? "Supplied site photography" : "التصوير المرفق للموقع"} image={current.image} label={en ? current.en : current.ar} origin="actual-site" position={selectedIndex + 1} total={filtered.length} onNext={() => move(1)} onPrevious={() => move(-1)} onRequestClose={() => setSelected(null)} />}
    </div>
  );
}
