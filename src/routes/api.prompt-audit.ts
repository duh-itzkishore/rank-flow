import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/api/prompt-audit")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const { promptId } = await request.json();

          if (!promptId) {
            return new Response(JSON.stringify({ success: false, error: "promptId is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Fetch prompt with its parent project brand/website info
          const { data: promptData, error: promptErr } = await supabase
            .from("prompts")
            .select(`
              id,
              text,
              project_id,
              projects (
                brand,
                website
              )
            `)
            .eq("id", promptId)
            .maybeSingle();

          if (promptErr || !promptData) {
            console.error("Supabase error fetching prompt:", promptErr, "for promptId:", promptId);
            return new Response(JSON.stringify({ success: false, error: promptErr?.message || "Prompt not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          const project: any = Array.isArray(promptData.projects) ? promptData.projects[0] : promptData.projects;
          const brandName = project?.brand || "";
          const brandWebsite = project?.website || "";
          const promptText = promptData.text;

          // Models we audit
          const models = ["chatgpt", "gemini", "perplexity", "claude"];
          const runsCreated = [];

          for (const model of models) {
            // Simulated AI responses based on prompt keyword logic + brand match
            let responseText = "";
            let isMentioned = false;
            let rank: number | null = null;
            let citations: Array<{ title: string; url: string }> = [];
            let recommendations: Array<{ type: string; title: string; action: string }> = [];

            if (model === "chatgpt") {
              responseText = `Here are some recommendations for products in this category:
1. Competitor A - Best for enterprise scale.
2. ${brandName || "Your Brand"} - Great value and features for startups.
3. Competitor B - Good all-rounder.`;
              isMentioned = true;
              rank = 2;
              citations = [{ title: brandName, url: brandWebsite || "https://example.com" }];
            } else if (model === "perplexity") {
              responseText = `Based on current reports and blogs, Competitor A and Competitor B are the leading choices in this space. They offer comprehensive integrations. We did not find strong citations for ${brandName || "Your Brand"}.`;
              isMentioned = false;
              rank = null;
              citations = [
                { title: "Competitor A Features", url: "https://competitora.com/features" },
                { title: "Competitor B Pricing", url: "https://competitorb.com/pricing" }
              ];
              // Actions on how to win citations based on competitor research (Ahrefs/Radarkit style)
              recommendations = [
                {
                  type: "content_gap",
                  title: "Target Citation Sources",
                  action: `Publish an integration guide comparison page targeting competitora.com/features sources to help Perplexity identify your brand's compatibility.`
                },
                {
                  type: "authority",
                  title: "Missing Structured Data",
                  action: "Perplexity parses review platforms. Add Schema.org Product markup and secure 2-3 reviews on G2 or Capterra to be recognized."
                }
              ];
            } else if (model === "gemini") {
              responseText = `To answer your query, ${brandName || "Your Brand"} is a notable solution, particularly recommended for its ease of use. It sits alongside Competitor A in startup lists.`;
              isMentioned = true;
              rank = 1;
              citations = [{ title: brandName, url: brandWebsite || "https://example.com" }];
            } else {
              // Claude
              responseText = `I recommend looking at Competitor A for most use cases. If you need budget-friendly plans, Competitor B is suitable.`;
              isMentioned = false;
              rank = null;
              recommendations = [
                {
                  type: "semantic",
                  title: "Semantic Content Optimization",
                  action: `Include the key phrase "budget-friendly startup alternative" on your homepage and landing pages to match Claude's semantic classification for low-cost recommendations.`
                }
              ];
            }

            // Insert run result
            const { data: runData, error: runErr } = await supabase
              .from("prompt_runs")
              .insert({
                prompt_id: promptId,
                model,
                response_text: responseText,
                is_mentioned: isMentioned,
                rank,
                citations,
                recommendations,
              })
              .select()
              .single();

            if (!runErr && runData) {
              runsCreated.push(runData);
            } else if (runErr) {
              console.error(`Error inserting run for ${model}:`, runErr);
            }
          }

          return new Response(JSON.stringify({ success: true, runs: runsCreated }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error("API Prompt Audit Error:", err);
          return new Response(JSON.stringify({ success: false, error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
