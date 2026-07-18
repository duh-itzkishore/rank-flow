import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Printer, ShieldCheck, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export const Route = createFileRoute("/app/$projectId/reports/reputation")({
  component: ReputationReport,
});

const MODEL_COLORS: Record<string, string> = {
  chatgpt: "#10a37f", gemini: "#4285f4", claude: "#c85a2a", perplexity: "#7c3aed",
};

function calculateReputationScore(runs: any[]) {
  if (runs.length === 0) return 0;
  const total = runs.length;
  const mentioned = runs.filter(r => r.is_mentioned);
  const mentionRate = mentioned.length / total;
  
  if (mentioned.length === 0) return 0;
  
  let positiveMentions = 0;
  let hallucinations = 0;
  
  mentioned.forEach(r => {
    if (r.sentiment_score && r.sentiment_score > 0) positiveMentions++;
    if (r.hallucination_detected) hallucinations++;
  });
  
  const positiveSentimentRate = positiveMentions / mentioned.length;
  const hallucinationRate = hallucinations / mentioned.length;
  
  // Composite score formula
  return Math.round((mentionRate * positiveSentimentRate * (1 - hallucinationRate)) * 100);
}

function ReputationReport() {
  const { projectId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReputationData();
  }, [projectId]);

  const fetchReputationData = async () => {
    try {
      setLoading(true);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
      
      const { data: runs, error } = await supabase
        .from("prompt_runs")
        .select(`
          id, model, created_at,
          is_mentioned, sentiment_score, hallucination_detected,
          prompts!inner(project_id)
        `)
        .eq("prompts.project_id", projectId)
        .gte("created_at", thirtyDaysAgo);

      if (error) throw error;

      const allRuns = (runs as any[]) || [];
      
      // Calculate Overall Score
      const overallScore = calculateReputationScore(allRuns);
      
      // Compare Current Week vs Last Week
      const oneWeekAgo = new Date(Date.now() - 7 * 86400 * 1000);
      const currentWeekRuns = allRuns.filter(r => new Date(r.created_at) >= oneWeekAgo);
      const pastWeekRuns = allRuns.filter(r => new Date(r.created_at) < oneWeekAgo && new Date(r.created_at) >= new Date(Date.now() - 14 * 86400 * 1000));
      
      const currentWeekScore = calculateReputationScore(currentWeekRuns);
      const pastWeekScore = calculateReputationScore(pastWeekRuns);
      const scoreChange = currentWeekScore - pastWeekScore;

      // Trend Data (grouped by day)
      const byDate: Record<string, any[]> = {};
      allRuns.forEach(r => {
        const day = r.created_at.slice(0, 10);
        if (!byDate[day]) byDate[day] = [];
        byDate[day].push(r);
      });
      
      const trendData = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, dayRuns]) => ({
          date: date.slice(5),
          reputation: calculateReputationScore(dayRuns),
        }));

      // Model Breakdown
      const byModel: Record<string, any[]> = {};
      allRuns.forEach(r => {
        if (!byModel[r.model]) byModel[r.model] = [];
        byModel[r.model].push(r);
      });
      
      const modelBreakdown = Object.entries(byModel)
        .map(([model, modelRuns]) => {
          const mentioned = modelRuns.filter(r => r.is_mentioned);
          const positive = mentioned.filter(r => r.sentiment_score && r.sentiment_score > 0).length;
          const hallucinations = mentioned.filter(r => r.hallucination_detected).length;
          return {
            model: model.charAt(0).toUpperCase() + model.slice(1),
            score: calculateReputationScore(modelRuns),
            mentionRate: Math.round((mentioned.length / modelRuns.length) * 100),
            positiveMentions: positive,
            hallucinations,
            color: MODEL_COLORS[model] || "#888"
          };
        })
        .sort((a, b) => b.score - a.score);

      // Signals
      const positiveSignals = modelBreakdown.filter(m => m.score > 50).map(m => `${m.model} shows strong positive sentiment and high visibility.`);
      const riskSignals = modelBreakdown.filter(m => m.hallucinations > 0).map(m => `${m.model} has ${m.hallucinations} detected hallucination(s).`);
      if (scoreChange < 0) {
        riskSignals.push(`Overall reputation score dropped by ${Math.abs(scoreChange)} points this week.`);
      }

      setData({
        overallScore,
        scoreChange,
        trendData,
        modelBreakdown,
        positiveSignals,
        riskSignals,
        totalAnalyzed: allRuns.length
      });

    } catch (err: any) {
      toast.error("Failed to load reputation data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/50 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Calculating reputation metrics...
      </div>
    );
  }

  if (!data || data.totalAnalyzed === 0) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 grid place-items-center mx-auto mb-5">
          <ShieldCheck className="w-7 h-7 text-indigo-400" />
        </div>
        <h3 className="text-white font-medium">No Reputation Data</h3>
        <p className="text-white/50 text-sm mt-2">
          Wait for AI models to start generating responses for your brand to calculate a reputation score.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            Reputation Monitor
          </h1>
          <p className="mt-1 text-sm text-white/40">Monitor your brand's AI-perceived reputation over time.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08] border border-white/[0.05] transition-colors print:hidden"
        >
          <Printer className="w-4 h-4" /> Print PDF
        </button>
      </div>

      <div ref={printRef} className="space-y-6 print:m-0">
        
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center">
            <h3 className="text-sm font-medium text-white/50 mb-2">Composite Reputation Score</h3>
            <div className="text-5xl font-bold text-indigo-400 my-2">{data.overallScore}</div>
            <div className="text-xs text-white/40">Out of 100 possible points</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center">
            <h3 className="text-sm font-medium text-white/50 mb-2">Weekly Momentum</h3>
            <div className="flex justify-center items-center gap-2 mt-4">
              {data.scoreChange > 0 ? (
                <TrendingUp className="w-10 h-10 text-emerald-400" />
              ) : data.scoreChange < 0 ? (
                <TrendingDown className="w-10 h-10 text-red-400" />
              ) : (
                <TrendingUp className="w-10 h-10 text-slate-400 opacity-50" />
              )}
              <div className={`text-4xl font-bold ${data.scoreChange > 0 ? "text-emerald-400" : data.scoreChange < 0 ? "text-red-400" : "text-slate-400"}`}>
                {data.scoreChange > 0 ? "+" : ""}{data.scoreChange}
              </div>
            </div>
            <div className="text-xs text-white/40 mt-3">Points vs. last week</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center">
            <h3 className="text-sm font-medium text-white/50 mb-4">Total Data Points</h3>
            <div className="text-4xl font-bold text-white mb-2">{data.totalAnalyzed}</div>
            <div className="text-xs text-white/40">Prompt runs analyzed (30 days)</div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-sm font-medium text-white/70 mb-6">Reputation Trend (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1c", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                />
                <Line
                  type="monotone"
                  dataKey="reputation"
                  name="Reputation Score"
                  stroke="#818cf8"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#818cf8", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Section: Signals & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="space-y-4">
            {/* Positive Signals */}
            <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-400">Positive Signals</h3>
              </div>
              {data.positiveSignals.length > 0 ? (
                <ul className="space-y-3">
                  {data.positiveSignals.map((sig: string, idx: number) => (
                    <li key={idx} className="text-sm text-emerald-100/70 flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">•</span> {sig}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-emerald-100/50">No strong positive signals detected currently.</p>
              )}
            </div>

            {/* Risk Signals */}
            <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-semibold text-red-400">Risk Signals</h3>
              </div>
              {data.riskSignals.length > 0 ? (
                <ul className="space-y-3">
                  {data.riskSignals.map((sig: string, idx: number) => (
                    <li key={idx} className="text-sm text-red-100/70 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span> {sig}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-red-100/50">No significant reputation risks detected.</p>
              )}
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 overflow-hidden">
            <h3 className="text-sm font-medium text-white/70 mb-4">AI Model Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/5 text-white/40">
                    <th className="pb-3 font-medium">Model</th>
                    <th className="pb-3 font-medium text-right">Rep Score</th>
                    <th className="pb-3 font-medium text-right">Visibility</th>
                    <th className="pb-3 font-medium text-right">Risks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.modelBreakdown.map((row: any) => (
                    <tr key={row.model} className="text-white/80">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                          {row.model}
                        </div>
                      </td>
                      <td className="py-3 text-right font-medium text-white">{row.score}</td>
                      <td className="py-3 text-right">{row.mentionRate}%</td>
                      <td className="py-3 text-right">
                        {row.hallucinations > 0 ? (
                          <span className="text-red-400 font-medium">{row.hallucinations} Hallucinations</span>
                        ) : (
                          <span className="text-emerald-400">Clear</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
