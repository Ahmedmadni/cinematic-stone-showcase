import { createFileRoute } from "@tanstack/react-router";
import { MediaStudio } from "@/components/MediaStudio";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "استوديو وسائط الصمان | إدارة الموقع" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MediaStudio,
});
