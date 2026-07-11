import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/api/llms-txt/$projectId")({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { projectId: string } }) => {
        const { projectId } = params;

        if (!projectId) {
          return new Response("Project ID is required", { status: 400 });
        }

        try {
          // Fetch the dynamic configuration for this project
          const { data, error } = await (supabase as any)
            .from("llms_txt_configs")
            .select("content")
            .eq("project_id", projectId)
            .single();

          if (error || !data) {
            return new Response("# Not Found\n\nNo llms.txt configuration found for this project.", { 
              status: 404,
              headers: { "Content-Type": "text/plain" }
            });
          }

          return new Response(data.content, {
            status: 200,
            headers: {
              "Content-Type": "text/plain",
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch (err) {
          console.error("Error serving llms.txt:", err);
          return new Response("# Error\n\nInternal Server Error", { status: 500 });
        }
      },
    },
  },
});
