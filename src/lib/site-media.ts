import { useEffect, useState } from "react";
import { hasSupabaseBrowserConfig, supabase } from "@/integrations/supabase/client";

export type SiteMediaSection = "hero" | "production" | "fleet" | "facilities" | "quarry";
export type SiteMediaItem = {
  id: string;
  section: SiteMediaSection;
  kind: "image" | "video";
  storage_path: string;
  poster_path: string | null;
  title_ar: string;
  title_en: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  url: string;
  poster_url: string | null;
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
let expires = 0;

export async function fetchSiteMedia(force = false): Promise<SiteMediaItem[]> {
  if (!hasSupabaseBrowserConfig()) return [];
  if (cache && !force && Date.now() < expires) return cache;
  expires = Date.now() + 5 * 60_000;
  cache = (async () => {
    await Promise.resolve();
    const { data, error } = await supabase
      .from("site_media")
      .select("*")
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!data?.length) return [];
    const paths = [
      ...new Set(data.flatMap((item) => [item.storage_path, item.poster_path].filter(Boolean))),
    ] as string[];
    const { data: signed, error: signingError } = await supabase.storage
      .from(SITE_MEDIA_BUCKET)
      .createSignedUrls(paths, 60 * 60);
    if (signingError) throw signingError;
    const urls = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
    return data.flatMap((d) => {
      const url = urls.get(d.storage_path);
      return url
        ? [
            {
              ...(d as Omit<SiteMediaItem, "url" | "poster_url">),
              url,
              poster_url: d.poster_path ? (urls.get(d.poster_path) ?? null) : null,
            },
          ]
        : [];
    });
  })().catch((error) => {
    cache = null;
    expires = 0;
    throw error;
  });
  return cache;
}

/** Uploaded media for one section; empty until loaded so the site falls back to built-in photos. */
export function useSiteMedia(section: SiteMediaSection) {
  const [items, setItems] = useState<SiteMediaItem[]>([]);
  useEffect(() => {
    let alive = true;
    const refresh = () => {
      if (!document.hidden)
        void fetchSiteMedia()
          .then((all) => {
            if (alive) setItems(all.filter((i) => i.section === section));
          })
          .catch(() => {
            /* Keep built-in media available offline. */
          });
    };
    refresh();
    const timer = window.setInterval(refresh, 5 * 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [section]);
  return items;
}
