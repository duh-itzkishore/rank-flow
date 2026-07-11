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
              user_id,
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
          const userId = (promptData as any).user_id;
          const projectId = promptData.project_id;

          // Fetch previous runs for this prompt to detect rank changes
          const { data: prevRuns } = await supabase
            .from("prompt_runs")
            .select("model, rank, is_mentioned")
            .eq("prompt_id", promptId)
            .order("created_at", { ascending: false })
            .limit(8);

          const prevByModel: Record<string, { rank: number | null; is_mentioned: boolean }> = {};
          for (const run of prevRuns || []) {
            if (!prevByModel[run.model]) {
              prevByModel[run.model] = { rank: run.rank, is_mentioned: run.is_mentioned };
            }
          }

          // Models we audit
          const models = ["chatgpt", "gemini", "perplexity", "claude"];
          const runsCreated = [];
          const alertsToCreate: any[] = [];

          for (const model of models) {
            // Simulated AI responses based on prompt keyword logic + brand match
            let responseText = "";
            let isMentioned = false;
            let rank: number | null = null;
            let citations: Array<{ title: string; url: string }> = [];
            let recommendations: Array<{ type: string; title: string; action: string }> = [];

            if (model === "chatgpt") {
              responseText = `Here are some recommendations for products in this category:\n1. Competitor A - Best for enterprise scale.\n2. ${brandName || "Your Brand"} - Great value and features for startups.\n3. Competitor B - Good all-rounder.`;
              isMentioned = true;
              rank = 2;
              citations = [{ title: brandName, url: brandWebsite || "https://example.com" }];
            } else if (model === "perplexity") {
              responseText = `Based on current reports and blogs, Competitor A and Competitor B are the leading choices in this space. They offer comprehensive integrations. We did not find strong citations for ${brandName || "Your Brand"}.`;
              isMentioned = false;
              rank = null;
              citations = [
                { title: "Competitor A Features", url: "https://competitora.com/features" },
                { title: "Competitor B Pricing", url: "https://competitorb.com/pricing" },
              ];
              recommendations = [
                {
                  type: "content_gap",
                  title: "Target Citation Sources",
                  action: `Publish an integration guide comparison page targeting competitora.com/features sources to help Perplexity identify your brand's compatibility.`,
                },
                {
                  type: "authority",
                  title: "Missing Structured Data",
                  action: "Perplexity parses review platforms. Add Schema.org Product markup and secure 2-3 reviews on G2 or Capterra to be recognized.",
                },
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
                  action: `Include the key phrase "budget-friendly startup alternative" on your homepage and landing pages to match Claude's semantic classification for low-cost recommendations.`,
                },
              ];
            }

            // Simulate multimodal media embeds (images/videos) randomly
            const media_embeds: any[] = [];
            if (isMentioned && Math.random() > 0.6) {
              if (model === "perplexity" || model === "gemini") {
                media_embeds.push({ type: "video", platform: "youtube", title: `${brandName} Overview` });
              }
              if (model === "chatgpt") {
                media_embeds.push({ type: "image", source: brandWebsite || "website", alt: `${brandName} dashboard screenshot` });
              }
            }

            // Insert run result
            const { data: runData, error: runErr } = await (supabase as any)
              .from("prompt_runs")
              .insert({
                prompt_id: promptId,
                model,
                response_text: responseText,
                is_mentioned: isMentioned,
                rank,
                citations,
                recommendations,
                media_embeds,
              })
              .select()
              .single();

            if (!runErr && runData) {
              runsCreated.push(runData);

              // ── Alert generation logic ──────────────────────────────────
              const prev = prevByModel[model];

              // 1. Rank Drop alert
              if (prev && prev.is_mentioned && prev.rank !== null && isMentioned && rank !== null && rank > prev.rank) {
                alertsToCreate.push({
                  user_id: userId,
                  project_id: projectId,
                  prompt_run_id: runData.id,
                  type: "rank_drop",
                  severity: "warning",
                  message: `⬇ Rank drop on ${model.charAt(0).toUpperCase() + model.slice(1)}: "${promptText}" moved from #${prev.rank} → #${rank}. Action required.`,
                  metadata: { model, old_rank: prev.rank, new_rank: rank, prompt: promptText },
                });
              }

              // 2. Rank Gain alert
              if (prev && prev.is_mentioned && prev.rank !== null && isMentioned && rank !== null && rank < prev.rank) {
                alertsToCreate.push({
                  user_id: userId,
                  project_id: projectId,
                  prompt_run_id: runData.id,
                  type: "rank_gain",
                  severity: "success",
                  message: `⬆ Rank improved on ${model.charAt(0).toUpperCase() + model.slice(1)}: "${promptText}" moved from #${prev.rank} → #${rank}.`,
                  metadata: { model, old_rank: prev.rank, new_rank: rank, prompt: promptText },
                });
              }

              // 3. Citation Lost alert (was mentioned, now not)
              if (prev && prev.is_mentioned && !isMentioned) {
                alertsToCreate.push({
                  user_id: userId,
                  project_id: projectId,
                  prompt_run_id: runData.id,
                  type: "citation_lost",
                  severity: "danger",
                  message: `🚨 ${brandName} was dropped from ${model.charAt(0).toUpperCase() + model.slice(1)} results for: "${promptText}". Immediate content action needed.`,
                  metadata: { model, prompt: promptText, brand: brandName },
                });
              }

              // 4. Hallucination detection
              const negativePatterns = [
                /lacks\s+\w+\s+feature/i,
                /does not (have|offer|support)/i,
                /no\s+(free|trial|api)/i,
                /shut\s*down/i,
                /discontinued/i,
              ];
              const brandMentioned = responseText.toLowerCase().includes((brandName || "").toLowerCase());
              const hasHallucination = brandMentioned && negativePatterns.some((p) => p.test(responseText));
              if (hasHallucination) {
                alertsToCreate.push({
                  user_id: userId,
                  project_id: projectId,
                  prompt_run_id: runData.id,
                  type: "hallucination",
                  severity: "danger",
                  message: `⚠ Possible hallucination detected on ${model.charAt(0).toUpperCase() + model.slice(1)}: AI may be making false claims about ${brandName}. Review and publish corrective content.`,
                  metadata: { model, prompt: promptText, brand: brandName },
                });
              }

              // 5. Competitor Surge (competitors mentioned but not brand)
              if (!isMentioned && citations.some((c) => !c.url.includes(brandWebsite || "your-domain"))) {
                alertsToCreate.push({
                  user_id: userId,
                  project_id: projectId,
                  prompt_run_id: runData.id,
                  type: "competitor_surge",
                  severity: "warning",
                  message: `📈 Competitor surge on ${model.charAt(0).toUpperCase() + model.slice(1)}: competitors cited for "${promptText}" while ${brandName} was not mentioned.`,
                  metadata: { model, prompt: promptText, citations },
                });
              }
            } else if (runErr) {
              console.error(`Error inserting run for ${model}:`, runErr);
            }
          }

          // Batch insert alerts
          if (alertsToCreate.length > 0 && userId) {
            const { error: alertErr } = await (supabase as any).from("alerts").insert(alertsToCreate);
            if (alertErr) {
              console.error("Error inserting alerts:", alertErr);
            }
          }

          return new Response(JSON.stringify({ success: true, runs: runsCreated, alertsGenerated: alertsToCreate.length }), {
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
