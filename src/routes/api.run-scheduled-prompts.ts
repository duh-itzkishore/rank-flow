import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/api/run-scheduled-prompts")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const origin = new URL(request.url).origin;

          // Fetch active schedules due for audit
          const { data: schedules, error: schedErr } = await (supabase as any)
            .from("prompt_schedules")
            .select("*, prompts(text)")
            .eq("is_active", true)
            .lte("next_run_at", new Date().toISOString());

          if (schedErr) throw schedErr;
          if (!schedules || schedules.length === 0) {
            return new Response(JSON.stringify({ success: true, message: "No scheduled prompts due" }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          }

          const results = [];
          for (const sched of schedules) {
            try {
              // Trigger audit request
              const auditRes = await fetch(`${origin}/api/prompt-audit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ promptId: sched.prompt_id })
              });
              const auditData = await auditRes.json();
              
              // Calculate next run time
              const intervalDays = sched.frequency === "daily" ? 1 : 7;
              const nextRun = new Date(Date.now() + intervalDays * 86400 * 1000).toISOString();

              // Update schedule record
              await (supabase as any)
                .from("prompt_schedules")
                .update({
                  last_run_at: new Date().toISOString(),
                  next_run_at: nextRun
                })
                .eq("id", sched.id);

              results.push({ promptId: sched.prompt_id, success: auditData.success });
            } catch (err: any) {
              console.error(`Failed running scheduled audit for prompt ${sched.prompt_id}:`, err);
              results.push({ promptId: sched.prompt_id, success: false, error: String(err) });
            }
          }

          return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });

        } catch (err: any) {
          console.error("Cron Job Error:", err);
          return new Response(JSON.stringify({ success: false, error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
