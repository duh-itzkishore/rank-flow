import { createFileRoute } from "@tanstack/react-router";
import { ContentArchitecture } from "@/modules/Planning & Creation/ContentArchitecture";

export const Route = createFileRoute("/app/$projectId/content")({
  component: ContentOptimizerRoute,
});

function ContentOptimizerRoute() {
  const { projectId } = Route.useParams();

  return (
    <div className="pb-20">
      <ContentArchitecture projectId={projectId} />
    </div>
  );
}
