import { supabase } from "@/integrations/supabase/client";

export async function generateProjectInsights(projectId: string, userId: string) {
  try {
    // 1. Fetch recent runs (past 14 days)
    const since = new Date(Date.now() - 14 * 86400 * 1000).toISOString();
    const { data: runs } = await (supabase as any)
      .from("prompt_runs")
      .select("*, prompts!inner(project_id)")
      .eq("prompts.project_id", projectId)
      .gte("created_at", since);

    if (!runs || runs.length === 0) return;

    const totalRuns = runs.length;
    const mentionedRuns = runs.filter((r: any) => r.is_mentioned);
    const visibilityRate = totalRuns > 0 ? (mentionedRuns.length / totalRuns) * 100 : 0;

    // Clear old unactioned insights to avoid duplicate spam
    await (supabase as any)
      .from("ai_insights")
      .delete()
      .eq("project_id", projectId)
      .eq("is_actioned", false);

    // 2. Generate overall Visibility Summary Insight
    await (supabase as any).from("ai_insights").insert({
      project_id: projectId,
      user_id: userId,
      insight_type: "summary",
      title: "AI Search Share of Voice Summary",
      body: `Your brand visibility across ChatGPT, Gemini, Claude, and Perplexity is currently at ${visibilityRate.toFixed(1)}% over the last 14 days based on ${totalRuns} scans.`,
      priority: "medium"
    });

    // 3. Risk Detection: Check for recent rank drops
    const rankDrops = runs.filter((r: any) => r.is_mentioned && r.rank !== null && r.rank > 3);
    if (rankDrops.length > 0) {
      await (supabase as any).from("ai_insights").insert({
        project_id: projectId,
        user_id: userId,
        insight_type: "risk",
        title: "High Ranking Drops Detected",
        body: `Your brand fell out of the top 3 recommendations in ${rankDrops.length} recent queries. Immediate content optimization is suggested to reclaim visibility.`,
        priority: "high"
      });
    }

    // 4. Competitor Share of Voice snap
    const { data: competitors } = await (supabase as any)
      .from("competitors")
      .select("*")
      .eq("project_id", projectId);

    if (competitors && competitors.length > 0) {
      for (const comp of competitors) {
        // Count mentions of competitor
        const compDomain = comp.domain?.toLowerCase();
        const compMentions = runs.filter((r: any) => 
          r.response_text.toLowerCase().includes(comp.name.toLowerCase()) || 
          (compDomain && r.response_text.toLowerCase().includes(compDomain))
        ).length;

        const sov = totalRuns > 0 ? (compMentions / totalRuns) * 100 : 0;

        await (supabase as any).from("competitor_snapshots").insert({
          competitor_id: comp.id,
          project_id: projectId,
          visibility_score: sov,
          mention_count: compMentions,
          sov_percent: parseFloat(sov.toFixed(1))
        });
      }
    }

    // 5. Generate content optimizer recommendations
    const unmentioned = runs.filter((r: any) => !r.is_mentioned);
    if (unmentioned.length > 0) {
      // Clear old content suggestions
      await (supabase as any)
        .from("content_suggestions")
        .delete()
        .eq("project_id", projectId)
        .eq("is_implemented", false);

      // Create one key entity gap suggestion
      const targetRun = unmentioned[0];
      await (supabase as any).from("content_suggestions").insert({
        project_id: projectId,
        prompt_run_id: targetRun.id,
        suggestion_type: "content_gap",
        title: "Optimize for missing brand context",
        action: `Integrate semantic keywords and clear comparisons matching the search context of prompt: "${targetRun.prompts?.text || "queries"}" to be indexed.`,
        impact: "high"
      });
    }

  } catch (err) {
    console.error("Error generating insights:", err);
  }
}
