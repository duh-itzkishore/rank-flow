import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { generateProjectInsights } from "@/server-fns/insights-engine";

export const Route = createFileRoute("/api/generate-insights")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const { projectId } = await request.json();

          if (!projectId) {
            return new Response(JSON.stringify({ success: false, error: "projectId is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }

          // Fetch project owner id
          const { data: project, error: projErr } = await supabase
            .from("projects")
            .select("user_id")
            .eq("id", projectId)
            .single();

          if (projErr || !project) {
            return new Response(JSON.stringify({ success: false, error: "Project not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" }
            });
          }

          await generateProjectInsights(projectId, project.user_id);

          return new Response(JSON.stringify({ success: true, message: "Insights compiled successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });

        } catch (err: any) {
          console.error("API Generate Insights error:", err);
          return new Response(JSON.stringify({ success: false, error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
