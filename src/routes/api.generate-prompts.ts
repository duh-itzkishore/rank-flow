import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/generate-prompts")({
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

          // Fetch project brand
          const { data: project, error: projErr } = await supabase
            .from("projects")
            .select("brand, website")
            .eq("id", projectId)
            .single();

          if (projErr || !project) {
            return new Response(JSON.stringify({ success: false, error: "Project not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" }
            });
          }

          const brand = project.brand || "Your Brand";

          // Simulate an AI generation for People Also Ask / Research prompts
          // In production, this would call OpenAI/Claude to generate relevant questions
          // based on the brand's industry and website.
          const suggestedPrompts = [
            `What are the best alternatives to ${brand}?`,
            `How does ${brand} compare to its top competitors?`,
            `What are the pros and cons of using ${brand}?`,
            `Is ${brand} worth the price?`,
            `Honest review of ${brand}`,
            `Top tools for this industry including ${brand}`,
            `What features does ${brand} have?`,
            `Pricing plans for ${brand}`,
            `How to integrate ${brand} into my workflow?`,
            `Which is better: ${brand} or Competitor X?`,
          ];

          // Introduce a slight artificial delay to simulate API call
          await new Promise(r => setTimeout(r, 1500));

          return new Response(JSON.stringify({ success: true, prompts: suggestedPrompts }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });

        } catch (err: any) {
          console.error("API Generate Prompts error:", err);
          return new Response(JSON.stringify({ success: false, error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
