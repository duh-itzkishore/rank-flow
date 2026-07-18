import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Printer, Smile, Meh, Frown } from "lucide-react";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from "recharts";

export const Route = createFileRoute("/app/$projectId/reports/sentiment")({
  component: SentimentReport,
});

const MODEL_COLORS: Record<string, string> = {
  chatgpt: "#10a37f", gemini: "#4285f4", claude: "#c85a2a", perplexity: "#7c3aed",
};

function SentimentReport() {
  const { projectId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSentimentData();
  }, [projectId]);

  const fetchSentimentData = async () => {
    try {
      setLoading(true);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();

      const { data: runs, error } = await supabase
        .from("prompt_runs")
        .select(`
          id, model, created_at,
          sentiment_score,
          prompts!inner(project_id)
        `)
        .eq("prompts.project_id", projectId)
        .gte("created_at", thirtyDaysAgo);

      if (error) throw error;

      const allRuns = (runs as any[]) || [];
      
      let posCount = 0;
      let neuCount = 0;
      let negCount = 0;

      const byModel: Record<string, { totalScore: number; count: number }> = {};
      const byDate: Record<string, Record<string, { totalScore: number; count: number }>> = {};

      allRuns.forEach(r => {
        const score = r.sentiment_score ?? 0;
        if (score > 0.1) posCount++;
        else if (score < -0.1) negCount++;
        else neuCount++;

        // Model aggregate
        if (!byModel[r.model]) byModel[r.model] = { totalScore: 0, count: 0 };
        byModel[r.model].totalScore += score;
        byModel[r.model].count++;

        // Date trend
        const day = r.created_at.slice(0, 10);
        if (!byDate[day]) byDate[day] = {};
        if (!byDate[day][r.model]) byDate[day][r.model] = { totalScore: 0, count: 0 };
        byDate[day][r.model].totalScore += score;
        byDate[day][r.model].count++;
      });

      // Pie distribution
      const total = posCount + neuCount + negCount;
      const distribution = [
        { name: "Positive", value: posCount, color: "#10b981" },
        { name: "Neutral", value: neuCount, color: "#6b7280" },
        { name: "Negative", value: negCount, color: "#ef4444" },
      ].filter(d => d.value > 0);

      // Model average comparison
      const modelComparison = Object.entries(byModel).map(([model, stats]) => ({
        model,
        score: stats.totalScore / Math.max(stats.count, 1),
        fill: MODEL_COLORS[model] || "#888888",
      }));

      // Trend data
      const trendData = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, models]) => {
          const row: any = { date: date.slice(5) }; // MM-DD
          Object.entries(models).forEach(([model, stats]) => {
            row[model] = stats.totalScore / Math.max(stats.count, 1);
          });
          return row;
        });

      setData({
        total,
        posCount,
        neuCount,
        negCount,
        distribution,
        modelComparison,
        trendData,
      });

    } catch (err: any) {
      toast.error("Failed to load sentiment data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/50 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Analyzing brand sentiment...
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 grid place-items-center mx-auto mb-5">
          <Smile className="w-7 h-7 text-indigo-400" />
        </div>
        <h3 className="text-white font-medium">No Sentiment Data</h3>
        <p className="text-white/50 text-sm mt-2">
          Run some prompt tracking to collect and analyze sentiment profiles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            Sentiment Analysis
          </h1>
          <p className="mt-1 text-sm text-white/40">Analyze brand perception and sentiment across AI model responses.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08] border border-white/[0.05] transition-colors print:hidden"
        >
          <Printer className="w-4 h-4" /> Print PDF
        </button>
      </div>

      <div ref={printRef} className="space-y-6 print:m-0">
        
        {/* Sentiment Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center">
            <h3 className="text-sm font-medium text-white/50 mb-2">Total Monitored Runs</h3>
            <div className="text-4xl font-bold text-white my-2">{data.total}</div>
            <div className="text-xs text-white/40">Last 30 days</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-6 text-center flex flex-col items-center justify-center">
            <Smile className="w-6 h-6 text-emerald-400 mb-2" />
            <span className="text-sm font-medium text-emerald-300/80">Positive Responses</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{data.posCount}</div>
          </div>
          <div className="rounded-2xl border border-gray-500/10 bg-gray-500/5 p-6 text-center flex flex-col items-center justify-center">
            <Meh className="w-6 h-6 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-300/80">Neutral Responses</span>
            <div className="text-2xl font-bold text-gray-400 mt-1">{data.neuCount}</div>
          </div>
          <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6 text-center flex flex-col items-center justify-center">
            <Frown className="w-6 h-6 text-red-400 mb-2" />
            <span className="text-sm font-medium text-red-300/80">Negative Responses</span>
            <div className="text-2xl font-bold text-red-400 mt-1">{data.negCount}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sentiment Distribution Pie */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 lg:col-span-1">
            <h3 className="text-sm font-medium text-white/70 mb-4">Sentiment Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.distribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1c", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {data.distribution.map((d: any) => (
                <div key={d.name} className="flex items-center gap-2 text-xs text-white/60">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </div>

          {/* Model Comparison Bar */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 lg:col-span-2">
            <h3 className="text-sm font-medium text-white/70 mb-6">Average Sentiment by Model</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.modelComparison} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} domain={[-1, 1]} />
                  <YAxis dataKey="model" type="category" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: "#1a1a1c", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(val: number) => val.toFixed(2)}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {data.modelComparison.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sentiment Trend */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-sm font-medium text-white/70 mb-6">Sentiment Trend by Model (30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} domain={[-1, 1]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1c", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                {Object.keys(MODEL_COLORS).map(model => (
                  <Line
                    key={model}
                    type="monotone"
                    dataKey={model}
                    name={model.charAt(0).toUpperCase() + model.slice(1)}
                    stroke={MODEL_COLORS[model]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
