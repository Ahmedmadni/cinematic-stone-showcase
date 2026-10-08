import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteMediaSection = "hero" | "production" | "fleet" | "facilities" | "quarry";
export type SiteMediaItem = {
  id: string; section: SiteMediaSection; kind: "image" | "video";
  storage_path: string; title_ar: string; title_en: string; sort_order: number; url: string;
};

export const SITE_MEDIA_BUCKET = "site-media";
export const siteMediaSections: { id: SiteMediaSection; ar: string; en: string }[] = [
  { id: "hero", ar: "الواجهة الرئيسية", en: "Hero" },
  { id: "production", ar: "خطوط الإنتاج", en: "Production" },
  { id: "fleet", ar: "المعدات", en: "Fleet" },
  { id: "facilities", ar: "المرافق والمكاتب", en: "Facilities" },
  { id: "quarry", ar: "المحجر", en: "Quarry" },
];

let cache: Promise<SiteMediaItem[]> | null = null;

export async function fetchSiteMedia(force = false): Promise<SiteMediaItem[]> {
  if (cache && !force) return cache;
  cache = (async () => {
    const { data, error } = await supabase.from("site_media").select("*").order("sort_order").order("created_at", { ascending: false });
    if (error || !data?.length) return [];
    const { data: signed } = await supabase.storage.from(SITE_MEDIA_BUCKET).createSignedUrls(data.map(d => d.storage_path), 60 * 60 * 12);
    const urls = new Map((signed ?? []).map(s => [s.path, s.signedUrl]));
    return data.flatMap(d => { const url = urls.get(d.storage_path); return url ? [{ ...(d as Omit<SiteMediaItem, "url">), url }] : []; });
  })().catch(() => []);
  return cache;
}

/** Uploaded media for one section; empty until loaded so the site falls back to built-in photos. */
export function useSiteMedia(section: SiteMediaSection) {
  const [items, setItems] = useState<SiteMediaItem[]>([]);
  useEffect(() => {
    let alive = true;
    fetchSiteMedia().then(all => { if (alive) setItems(all.filter(i => i.section === section)); });
    return () => { alive = false; };
  }, [section]);
  return items;
}
