import { useCallback, useState } from "react";
import { useSiteLanguage } from "@/lib/site-language";
import { useSiteMedia } from "@/lib/site-media";
import { officialVideo } from "@/data/official-video";
import { HeroGallery } from "./HeroGallery";
import { SiteVideoLoop } from "@/components/SiteVideoLoop";

export function HeroSiteFilm({ entered }: { entered: boolean }) {
  const { language } = useSiteLanguage();
  const uploads = useSiteMedia("hero");
  const [failedUpload, setFailedUpload] = useState<string | null>(null);
  const uploadedVideo = uploads.find(item => item.kind === "video" && item.id !== failedUpload);
  const [film, setFilm] = useState(true);
  const [covered, setCovered] = useState(false);
  const cover = useCallback((value: boolean) => setCovered(value), []);
  return <>
    <HeroGallery suspended={!entered || (film && covered)} />
    {film && <SiteVideoLoop key={uploadedVideo?.id ?? "official-hero"} video={uploadedVideo ? { id: "hero", poster: officialVideo.hero.poster, src: uploadedVideo.url, ar: uploadedVideo.title_ar || officialVideo.hero.ar, en: uploadedVideo.title_en || officialVideo.hero.en } : officialVideo.hero} language={language} hero enabled={entered} onCoverChange={cover} onEnded={() => setFilm(false)} onUnavailable={() => { if (uploadedVideo) setFailedUpload(uploadedVideo.id); else setFilm(false); }} />}
  </>;
}
