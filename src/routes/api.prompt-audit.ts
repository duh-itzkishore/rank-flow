import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";
import { queryAIModel } from "@/server-fns/ai-gateway";

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

          // Fetch prompt with its parent project brand/website info and org_id
          const { data: promptData, error: promptErr } = await supabase
            .from("prompts")
            .select(`
              id,
              text,
              project_id,
              user_id,
              projects (
                brand,
                website,
                org_id
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
          const orgId = project?.org_id;
          const promptText = promptData.text;
          const userId = (promptData as any).user_id;
          const projectId = promptData.project_id;

          // Fetch API Keys configured for this workspace
          let apiKeys: Record<string, string> = {};
          let hasCreditLimits = false;
          let currentUsedCredits = 0;
          let maxCredits = 1000;

          if (orgId) {
            // Check Credit Limits
            const { data: orgData, error: orgErr } = await (supabase as any)
              .from("organizations")
              .select("monthly_prompt_credits, used_prompt_credits")
              .eq("id", orgId)
              .maybeSingle();

            if (!orgErr && orgData && orgData.monthly_prompt_credits !== undefined) {
              hasCreditLimits = true;
              currentUsedCredits = orgData.used_prompt_credits || 0;
              maxCredits = orgData.monthly_prompt_credits || 1000;

              if (currentUsedCredits >= maxCredits) {
                return new Response(JSON.stringify({ 
                  success: false, 
                  error: "Monthly prompt execution limit reached. Please upgrade your plan." 
                }), {
                  status: 403,
                  headers: { "Content-Type": "application/json" },
                });
              }
            }
          }

          if (projectId) {
            const { data: keyConfigs } = await (supabase as any)
              .from("api_key_configs")
              .select("*")
              .eq("project_id", projectId);
            
            if (keyConfigs) {
              keyConfigs.forEach((c: any) => {
                apiKeys[c.provider] = c.encrypted_key; // In prod, this would be decrypted here
              });
            }
          }

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

          // Fetch competitors for the project
          const { data: competitors } = await (supabase as any)
            .from("competitors")
            .select("name, domain")
            .eq("project_id", projectId);
          const competitorNames = (competitors || []).map((c: any) => c.name);

          // Build dynamic model list — always include core models, add free models if keys are configured
          const coreModels = ["chatgpt", "gemini", "perplexity", "claude"];
          const freeModels = ["groq", "openrouter"];
          // Include free models if their key is configured
          const models = [
            ...coreModels,
            ...freeModels.filter((m) => !!apiKeys[m]),
          ];

          // Run gateways in parallel
          const auditPromises = models.map(async (model) => {
            const providerIdMap: Record<string, string> = {
              chatgpt:    "openai",
              claude:     "anthropic",
              gemini:     "gemini",
              perplexity: "perplexity",
              groq:       "groq",
              openrouter: "openrouter",
            };
            const providerKey = apiKeys[providerIdMap[model]] || null;

            try {
              const result = await queryAIModel(model, promptText, brandName, providerKey, competitorNames);
              return { model, result, success: true };
            } catch (err) {
              console.error(`Error querying model ${model}:`, err);
              return { model, error: String(err), success: false };
            }
          });

          const auditResultsSettled = await Promise.allSettled(auditPromises);
          const auditResults = auditResultsSettled.map(r => r.status === 'fulfilled' ? r.value : { model: 'unknown', error: r.reason, success: false });
          
          const runsCreated = [];
          const alertsToCreate: any[] = [];

          for (const res of auditResults) {
            if (!res.success || !(res as any).result) continue;
            const model = res.model;
            const result = (res as any).result;

            // Insert run result with V2 metrics (cast to any for newly added columns)
            const { data: runData, error: runErr } = await (supabase as any)
              .from("prompt_runs")
              .insert({
                prompt_id: promptId,
                model,
                response_text: result.responseText,
                is_mentioned: result.isMentioned,
                rank: result.rank,
                citations: result.citations,
                recommendations: result.recommendations,
                sentiment_score: result.sentimentScore,
                confidence_score: result.confidenceScore,
                tokens_used: result.tokensUsed,
                latency_ms: result.latencyMs,
                raw_response: result.rawResponse || { note: "Logged raw API payload" }
              })
              .select()
              .single();

            if (!runErr && runData) {
              runsCreated.push(runData);

              // Alert generation logic
              const prev = prevByModel[model];

              // 1. Rank Drop alert
              if (prev && prev.is_mentioned && prev.rank !== null && result.isMentioned && result.rank !== null && result.rank > prev.rank) {
                alertsToCreate.push({
                  user_id: userId,
                  project_id: projectId,
                  prompt_run_id: runData.id,
                  type: "rank_drop",
                  severity: "warning",
                  message: `⬇ Rank drop on ${model.charAt(0).toUpperCase() + model.slice(1)}: "${promptText}" moved from #${prev.rank} → #${result.rank}. Action required.`,
                  metadata: { model, old_rank: prev.rank, new_rank: result.rank, prompt: promptText },
                });
              }

              // 2. Rank Gain alert
              if (prev && prev.is_mentioned && prev.rank !== null && result.isMentioned && result.rank !== null && result.rank < prev.rank) {
                alertsToCreate.push({
                  user_id: userId,
                  project_id: projectId,
                  prompt_run_id: runData.id,
                  type: "rank_gain",
                  severity: "success",
                  message: `⬆ Rank improved on ${model.charAt(0).toUpperCase() + model.slice(1)}: "${promptText}" moved from #${prev.rank} → #${result.rank}.`,
                  metadata: { model, old_rank: prev.rank, new_rank: result.rank, prompt: promptText },
                });
              }

              // 3. Citation Lost alert
              if (prev && prev.is_mentioned && !result.isMentioned) {
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

              // 4. Hallucination alert hook
              if (result.confidenceScore !== undefined && result.confidenceScore < 0.65) {
                await (supabase as any)
                  .from("prompt_runs")
                  .update({
                    hallucination_detected: true,
                    hallucination_details: { pattern: "low_confidence", excerpt: result.responseText.slice(0, 100) + "...", severity: "high" }
                  })
                  .eq("id", runData.id);

                alertsToCreate.push({
                  user_id: userId,
                  project_id: projectId,
                  prompt_run_id: runData.id,
                  type: "hallucination",
                  severity: "danger",
                  message: `⚠️ Potential hallucination detected on ${model.charAt(0).toUpperCase() + model.slice(1)} for: "${promptText}". Confidence score: ${result.confidenceScore}`,
                  metadata: { model, prompt: promptText, confidence: result.confidenceScore },
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

          // Increment credits if successfully ran models
          if (hasCreditLimits && runsCreated.length > 0) {
            await (supabase as any)
              .from("organizations")
              .update({ used_prompt_credits: currentUsedCredits + 1 })
              .eq("id", orgId);
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
