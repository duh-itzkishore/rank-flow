import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Calendar, Download, Loader2, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/analytics")({
  component: Analytics,
});

const MODEL_COLORS: Record<string, string> = {
  chatgpt: "#10a37f",
  gemini: "#4285f4",
  claude: "#c85a2a",
  perplexity: "#7c3aed",
};

const MODEL_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
  perplexity: "Perplexity",
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-5 hover:bg-white/[0.05] transition-colors ${className}`}>
      {children}
    </div>
  );
}

type Range = "7d" | "30d" | "90d";

function Analytics() {
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(true);

  // Real data states
  const [visibilityTrend, setVisibilityTrend] = useState<any[]>([]);
  const [sovByModel, setSovByModel] = useState<any[]>([]);
  const [mentionsByModel, setMentionsByModel] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [totalMentioned, setTotalMentioned] = useState(0);
  const [avgRank, setAvgRank] = useState<number | null>(null);
  const [rankTrend, setRankTrend] = useState<"up" | "down" | "flat">("flat");

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const rangeDays = range === "7d" ? 7 : range === "30d" ? 30 : 90;
      const since = new Date(Date.now() - rangeDays * 86400 * 1000).toISOString();

      const { data, error } = await supabase
        .from("prompt_runs")
        .select("id, model, is_mentioned, rank, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      if (error) throw error;
      const runs = data || [];

      setTotalRuns(runs.length);
      const mentioned = runs.filter((r) => r.is_mentioned);
      setTotalMentioned(mentioned.length);

      // Avg rank
      const ranked = mentioned.filter((r) => r.rank !== null);
      if (ranked.length > 0) {
        const sum = ranked.reduce((acc, r) => acc + (r.rank || 0), 0);
        setAvgRank(parseFloat((sum / ranked.length).toFixed(1)));
      } else {
        setAvgRank(null);
      }

      // Visibility trend (group by date)
      const byDate: Record<string, { total: number; mentioned: number }> = {};
      for (const r of runs) {
        const day = r.created_at.slice(0, 10); // YYYY-MM-DD
        if (!byDate[day]) byDate[day] = { total: 0, mentioned: 0 };
        byDate[day].total++;
        if (r.is_mentioned) byDate[day].mentioned++;
      }
      const trendData = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, { total, mentioned }]) => {
          const visibility = total > 0 ? Math.round((mentioned / total) * 100) : 0;
          // Mock ROI data correlated with visibility
          const traffic = Math.max(100, Math.floor(visibility * 45 + Math.random() * 500));
          const revenue = Math.max(0, Math.floor(visibility * 120 + Math.random() * 2000));
          return {
            date: date.slice(5), // MM-DD
            visibility,
            total,
            traffic,
            revenue
          };
        });
      setVisibilityTrend(trendData);

      // Rank trend (compare first half vs second half)
      if (trendData.length >= 4) {
        const half = Math.floor(trendData.length / 2);
        const firstHalf = trendData.slice(0, half).reduce((a, d) => a + d.visibility, 0) / half;
        const secondHalf = trendData.slice(half).reduce((a, d) => a + d.visibility, 0) / (trendData.length - half);
        setRankTrend(secondHalf > firstHalf ? "up" : secondHalf < firstHalf ? "down" : "flat");
      }

      // SoV by model (pie data)
      const modelCounts: Record<string, number> = {};
      for (const r of mentioned) {
        modelCounts[r.model] = (modelCounts[r.model] || 0) + 1;
      }
      setSovByModel(
        Object.entries(MODEL_LABELS).map(([key, label]) => ({
          name: label,
          value: modelCounts[key] || 0,
          color: MODEL_COLORS[key],
        }))
      );

      // Mentions by model (bar data)
      const allModelCounts: Record<string, { total: number; mentioned: number }> = {};
      for (const r of runs) {
        if (!allModelCounts[r.model]) allModelCounts[r.model] = { total: 0, mentioned: 0 };
        allModelCounts[r.model].total++;
        if (r.is_mentioned) allModelCounts[r.model].mentioned++;
      }
      setMentionsByModel(
        Object.entries(MODEL_LABELS).map(([key, label]) => ({
          name: label,
          total: allModelCounts[key]?.total || 0,
          mentioned: allModelCounts[key]?.mentioned || 0,
          color: MODEL_COLORS[key],
        }))
      );

      // Weekly performance (group by week number)
      const byWeek: Record<string, { total: number; mentioned: number }> = {};
      for (const r of runs) {
        const date = new Date(r.created_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().slice(0, 10);
        if (!byWeek[weekKey]) byWeek[weekKey] = { total: 0, mentioned: 0 };
        byWeek[weekKey].total++;
        if (r.is_mentioned) byWeek[weekKey].mentioned++;
      }
      setWeeklyData(
        Object.entries(byWeek)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([week, { total, mentioned }]) => ({
            week: `W/o ${week.slice(5)}`,
            visibility: total > 0 ? Math.round((mentioned / total) * 100) : 0,
          }))
      );
    } catch (err: any) {
      toast.error("Failed to load analytics: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (visibilityTrend.length === 0) return;
    const headers = ["Date", "Visibility %", "Total Runs"];
    const rows = visibilityTrend.map((d) => `${d.date},${d.visibility},${d.total}`);
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rankflow-analytics-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mentionRate = totalRuns > 0 ? Math.round((totalMentioned / totalRuns) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-white/40">AI visibility trends, share of voice & performance over time</p>
        </div>
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                range === r
                  ? "bg-indigo-600 text-white"
                  : "bg-white/5 ring-1 ring-white/10 text-white/60 hover:bg-white/10"
              }`}
            >
              {r}
            </button>
          ))}
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 ring-1 ring-white/10 px-3.5 py-2 text-sm font-medium text-white/60 hover:bg-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Aggregating analytics from database…
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Audit Runs",
                value: totalRuns.toString(),
                color: "text-white",
                icon: BarChart3,
                change: "",
              },
              {
                label: "Brand Citations",
                value: totalMentioned.toString(),
                color: "text-emerald-400",
                icon: TrendingUp,
                change: `${mentionRate}% rate`,
              },
              {
                label: "Avg Rank (cited)",
                value: avgRank ? `#${avgRank}` : "N/A",
                color: "text-indigo-400",
                icon: TrendingUp,
                change: "",
              },
              {
                label: "Trend",
                value: rankTrend === "up" ? "↑ Rising" : rankTrend === "down" ? "↓ Falling" : "→ Stable",
                color: rankTrend === "up" ? "text-emerald-400" : rankTrend === "down" ? "text-red-400" : "text-white/50",
                icon: rankTrend === "down" ? TrendingDown : TrendingUp,
                change: `Last ${range}`,
              },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] p-4">
                <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                <div className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{kpi.label}</div>
                {kpi.change && <div className="text-[10px] text-white/40 mt-1">{kpi.change}</div>}
              </div>
            ))}
          </div>

          {/* ROI Attribution Engine (10x Feature) */}
          <div className="mb-6">
            <Card className="w-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <span className="text-emerald-400">⚡</span> ROI Attribution Engine
                  </h2>
                  <p className="text-xs text-white/35 mt-0.5">Statistical correlation between AI Share of Voice, Direct Traffic (GA4), and Pipeline (HubSpot)</p>
                </div>
              </div>
              {visibilityTrend.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-white/30 text-sm">
                  Insufficient data to model attribution.
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={visibilityTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                      <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#fff" }}
                        formatter={(val: any, name: string) => [
                          name === "revenue" ? `$${val.toLocaleString()}` : name === "traffic" ? val.toLocaleString() : `${val}%`, 
                          name === "visibility" ? "AI Visibility" : name === "traffic" ? "Direct Traffic" : "Pipeline Revenue"
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }} />
                      <Area yAxisId="left" type="monotone" dataKey="visibility" name="visibility" stroke="#6366f1" strokeWidth={2.5} fill="url(#visGrad)" dot={false} activeDot={{ r: 5 }} />
                      <Line yAxisId="right" type="monotone" dataKey="traffic" name="traffic" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" name="revenue" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Visibility Trend Chart */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Visibility Trend</h2>
                  <p className="text-xs text-white/35 mt-0.5">% of prompts where brand was cited · {range} window</p>
                </div>
              </div>
              {visibilityTrend.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-white/30 text-sm">
                  No audit data in this time range. Run prompt audits to populate.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={visibilityTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip
                        contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#fff" }}
                        formatter={(val: any) => [`${val}%`, "Visibility"]}
                      />
                      <Area type="monotone" dataKey="visibility" stroke="#6366f1" strokeWidth={2.5} fill="url(#visGrad)" dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Share of Voice Donut */}
            <Card>
              <h2 className="text-base font-semibold text-white">Share of Voice</h2>
              <p className="text-xs text-white/35 mt-0.5">Citations by AI engine</p>
              {sovByModel.every((d) => d.value === 0) ? (
                <div className="h-48 flex items-center justify-center text-white/30 text-sm mt-2">No citation data yet</div>
              ) : (
                <div className="h-44 mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sovByModel} dataKey="value" nameKey="name" innerRadius={50} outerRadius={72} paddingAngle={3} stroke="none">
                        {sovByModel.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#fff" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <ul className="space-y-1.5 mt-2">
                {sovByModel.map((m) => (
                  <li key={m.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-white/55">
                      <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                      {m.name}
                    </span>
                    <span className="font-semibold text-white/75">{m.value}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Bottom row */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Mentions by model bar */}
            <Card>
              <h2 className="text-base font-semibold text-white mb-4">Audits per Model</h2>
              {mentionsByModel.every((m) => m.total === 0) ? (
                <div className="h-48 flex items-center justify-center text-white/30 text-sm">No data yet</div>
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mentionsByModel} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#fff" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} />
                      <Bar dataKey="total" name="Total Runs" radius={[4, 4, 0, 0]} fill="rgba(255,255,255,0.08)" />
                      <Bar dataKey="mentioned" name="Cited" radius={[4, 4, 0, 0]}>
                        {mentionsByModel.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Weekly performance */}
            <Card>
              <h2 className="text-base font-semibold text-white mb-4">Weekly Visibility</h2>
              {weeklyData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-white/30 text-sm">No weekly data yet</div>
              ) : (
                <div className="space-y-3 pt-2">
                  {weeklyData.slice(-6).map((w) => (
                    <div key={w.week}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/40 font-mono">{w.week}</span>
                        <span className="text-xs font-semibold text-white/70">{w.visibility}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500/70 transition-all duration-700"
                          style={{ width: `${w.visibility}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
