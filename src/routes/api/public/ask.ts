import { createFileRoute } from "@tanstack/react-router";
import { handleProjectQuestion } from "@/lib/project-qa.server";

export const Route = createFileRoute("/api/public/ask")({
  server: { handlers: { POST: ({ request }) => handleProjectQuestion(request) } },
});
