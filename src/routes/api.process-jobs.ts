import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";
import { queryAIModel } from "@/server-fns/ai-gateway";

// @ts-ignore - Temporary route tree generation sync
export const Route = createFileRoute("/api/process-jobs")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          // Optional API key protection for background worker endpoint
          
          // Fetch up to 10 pending/queued jobs
          const { data: jobs, error: fetchErr } = await (supabase as any)
            .from("prompt_jobs")
            .select("id, prompt_id, model, retry_count")
            .eq("status", "queued")
            .limit(10);

          if (fetchErr || !jobs || jobs.length === 0) {
            return new Response(JSON.stringify({ success: true, processed: 0, message: "No queued jobs to process." }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          const processedResults = [];

          for (const job of jobs) {
            // Mark job as processing
            await (supabase as any)
              .from("prompt_jobs")
              .update({ status: "processing", started_at: new Date().toISOString() })
              .eq("id", job.id);

            // Fetch prompt details
            const { data: promptData } = await supabase
              .from("prompts")
              .select("id, text, project_id, user_id, projects(brand, website, org_id)")
              .eq("id", job.prompt_id)
              .maybeSingle();

            if (!promptData) {
              await (supabase as any)
                .from("prompt_jobs")
                .update({ status: "failed", error: "Prompt not found" })
                .eq("id", job.id);
              continue;
            }

            const project: any = Array.isArray(promptData.projects) ? promptData.projects[0] : promptData.projects;
            const brandName = project?.brand || "";
            const promptText = promptData.text;

            // Fetch competitors
            const { data: competitors } = await (supabase as any)
              .from("competitors")
              .select("name")
              .eq("project_id", promptData.project_id);
            const competitorNames = (competitors || []).map((c: any) => c.name);

            try {
              const result = await queryAIModel(job.model, promptText, brandName, null, competitorNames);
              
              // Insert into prompt_runs
              const { data: runData } = await (supabase as any)
                .from("prompt_runs")
                .insert({
                  prompt_id: job.prompt_id,
                  model: job.model,
                  response_text: result.responseText,
                  is_mentioned: result.isMentioned,
                  rank: result.rank,
                  citations: result.citations,
                  recommendations: result.recommendations,
                  sentiment_score: result.sentimentScore,
                  confidence_score: result.confidenceScore,
                  tokens_used: result.tokensUsed,
                  latency_ms: result.latencyMs,
                  raw_response: result.rawResponse,
                })
                .select()
                .single();

              // Mark job completed
              await (supabase as any)
                .from("prompt_jobs")
                .update({ status: "completed", completed_at: new Date().toISOString() })
                .eq("id", job.id);

              processedResults.push({ jobId: job.id, success: true, runId: runData?.id });
            } catch (err: any) {
              const nextRetry = (job.retry_count || 0) + 1;
              const status = nextRetry >= 3 ? "failed" : "queued";
              await (supabase as any)
                .from("prompt_jobs")
                .update({
                  status,
                  retry_count: nextRetry,
                  error: String(err),
                })
                .eq("id", job.id);

              processedResults.push({ jobId: job.id, success: false, error: String(err) });
            }
          }

          return new Response(JSON.stringify({ success: true, processed: processedResults.length, details: processedResults }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error("Process Jobs Worker Error:", err);
          return new Response(JSON.stringify({ success: false, error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
