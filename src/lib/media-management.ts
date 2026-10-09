import { useEffect, useSyncExternalStore } from "react";
import { hasSupabaseBrowserConfig, supabase } from "@/integrations/supabase/client";
import { findCatalogAsset, mediaCatalog, type CatalogAsset } from "@/data/media-catalog";
import { fetchSiteMedia } from "./site-media";
import type { SiteVideo } from "@/data/official-video";
import { selectMediaOverride } from "./media-rules";
export { allowedMediaTypes, validateMediaFile } from "./media-rules";

export type MediaOverride = {
  target_key: string;
  replacement_id: string;
  title_ar: string;
  title_en: string;
  fit: "cover" | "contain";
  focal_x: number;
  focal_y: number;
};
type Snapshot = { overrides: MediaOverride[]; uploads: CatalogAsset[]; error: string };
const empty: Snapshot = { overrides: [], uploads: [], error: "" };
let snapshot = empty;
let pending: Promise<void> | null = null;
let loadedAt = 0;
const listeners = new Set<() => void>();
let subscribers = 0;
let timer: number | undefined;
const onVisible = () => {
  if (!document.hidden) void refreshMediaManagement();
};
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function emit() {
  listeners.forEach((fn) => fn());
}
export async function refreshMediaManagement(force = false) {
  if (pending) return pending;
  if (!force && Date.now() - loadedAt < 5 * 60_000) return;
  pending = (async () => {
    // Defer even a synchronous configuration error until pending is assigned.
    await Promise.resolve();
    try {
      if (!hasSupabaseBrowserConfig()) {
        snapshot = {
          ...snapshot,
          error:
            "النسخة المحلية تعرض جميع الأصول الأصلية. فعّل اتصال Supabase لحفظ التخصيصات والملفات المرفوعة.",
        };
        return;
      }
      const [{ data, error }, uploads] = await Promise.all([
        supabase.from("media_overrides").select("*"),
        fetchSiteMedia(force),
      ]);
      if (error) throw error;
      snapshot = {
        overrides: (data ?? []) as MediaOverride[],
        uploads: uploads.map((u) => ({
          id: `upload-${u.id}`,
          kind: u.kind,
          url: u.url,
          thumbnail: u.kind === "image" ? u.url : "",
          ar: u.title_ar,
          en: u.title_en,
          category: u.section,
          origin: "actual-site",
        })),
        error: "",
      };
    } catch {
      snapshot = {
        ...snapshot,
        error:
          "تعذّر تحميل التخصيصات السحابية. الأصول الأصلية متاحة؛ تحقق من إعداد الاتصال وترحيل قاعدة البيانات.",
      };
    } finally {
      loadedAt = Date.now();
      pending = null;
      emit();
    }
  })();
  return pending;
}
export function useMediaManagement() {
  const state = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => empty,
  );
  useEffect(() => {
    void refreshMediaManagement();
    if (subscribers++ === 0) {
      timer = window.setInterval(onVisible, 5 * 60_000);
      document.addEventListener("visibilitychange", onVisible);
    }
    return () => {
      if (--subscribers === 0) {
        window.clearInterval(timer);
        document.removeEventListener("visibilitychange", onVisible);
      }
    };
  }, []);
  return state;
}
export function resolveMedia(asset: CatalogAsset | undefined, context: string, state: Snapshot) {
  if (!asset) return undefined;
  const override = selectMediaOverride(state.overrides, context, asset.id);
  const replacement =
    override &&
    [...mediaCatalog, ...state.uploads].find(
      (a) =>
        a.id === override.replacement_id &&
        a.kind === asset.kind &&
        (asset.origin === "decorative"
          ? a.origin === "decorative"
          : a.origin !== "decorative" &&
            (a.origin !== "supplementary" || asset.origin === "supplementary")),
    );
  return { asset: replacement ?? asset, override };
}
export function useManagedAsset(url: string | undefined, context: string) {
  const state = useMediaManagement();
  return resolveMedia(
    findCatalogAsset(url) ?? state.uploads.find((a) => a.url === url),
    context,
    state,
  );
}

export function useManagedVideo(original: SiteVideo, context: string): SiteVideo {
  const resolved = useManagedAsset(original.src, context);
  const posterSource = resolved?.override ? resolved.asset.thumbnail : original.poster;
  const managedPosterSource = posterSource || original.poster;
  const poster = useManagedAsset(managedPosterSource, context);
  if (!resolved?.override)
    return { ...original, poster: poster?.override ? poster.asset.url : original.poster };
  return {
    ...original,
    src: resolved.asset.url,
    webm: resolved.asset.webm,
    poster: poster?.override ? poster.asset.url : resolved.asset.thumbnail || "",
    ar: resolved.override.title_ar || resolved.asset.ar,
    en: resolved.override.title_en || resolved.asset.en,
  };
}
