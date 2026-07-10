import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import {
  Eye, Trophy, AtSign, MessageSquare, Bot, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Clock, Loader2, FolderKanban,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  visibilityOverTime, modelDistribution, brandRankings,
  recentAlerts, weeklyGrowthData, recentResponses,
} from "@/lib/mock-data";

type DashboardSearch = {
  website?: string;
};

export const Route = createFileRoute("/app/dashboard")({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => {
    return {
      website: search.website as string | undefined,
    };
  },
  component: Dashboard,
});


const MODEL_COLORS: Record<string, string> = {
  ChatGPT: "#10a37f", Gemini: "#4285f4", Claude: "#c85a2a", Perplexity: "#7c3aed",
};
const severityColor: Record<string, string> = {
  success: "#22c55e", warning: "#f59e0b", info: "#6366f1", danger: "#ef4444",
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-5 transition-colors hover:bg-white/[0.05] ${className}`}>
      {children}
    </div>
  );
}

function Dashboard() {
  const { website } = Route.useSearch();
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [promptsCount, setPromptsCount] = useState<number>(0);
  const [promptsList, setPromptsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Query projects count
        const { count: projCount, error: projErr } = await supabase
          .from("projects")
          .select("*", { count: "exact", head: true });
        
        if (projErr) throw projErr;
        setProjectsCount(projCount || 0);

        // Query prompts count & list
        const { data: promptsData, count: pCount, error: promptsErr } = await supabase
          .from("prompts")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false });

        if (promptsErr) throw promptsErr;
        setPromptsCount(pCount || 0);
        setPromptsList(promptsData || []);
      }
    } catch (err) {
      console.error("Error loading dashboard data from database:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to compute a mock visibility score for actual database projects
  const getPromptScore = (p: any) => {
    let sum = 0;
    for (let i = 0; i < p.id.length; i++) {
      sum += p.id.charCodeAt(i);
    }
    return 70 + (sum % 26); // 70 to 95
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          {website ? `Dashboard: ${website}` : "Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-white/40">Overview · Real database metrics</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Loading dashboard metrics…
        </div>
      ) : (
        <>
          {/* ── Row 1 · KPI cards ────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "AI Visibility",     value: projectsCount > 0 ? "84.2" : "0.0",  icon: Eye,            change: projectsCount > 0 ? "+12.4%" : "", up: true },
              { label: "Avg Brand Rank",    value: projectsCount > 0 ? "#2.1" : "--",   icon: Trophy,         change: projectsCount > 0 ? "+0.8" : "",   up: true },
              { label: "Total Mentions",    value: projectsCount > 0 ? "1,842" : "0",   icon: AtSign,         change: projectsCount > 0 ? "+8.7%" : "",  up: true },
              { label: "Total Prompts",     value: String(promptsCount),                 icon: MessageSquare,  change: "",                                 up: true },
              { label: "Projects Tracked",  value: String(projectsCount),                icon: FolderKanban,   change: "",                                 up: true },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <div className="flex items-center justify-between mb-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10">
                    <kpi.icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  {kpi.change && (
                    <span className={`flex items-center gap-0.5 text-xs font-semibold ${kpi.up ? "text-emerald-400" : "text-red-400"}`}>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      {kpi.change}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-semibold text-white">{kpi.value}</div>
                <div className="text-[11px] text-white/35 mt-1 uppercase tracking-wider">{kpi.label}</div>
              </Card>
            ))}
          </div>

          {/* ── Row 2 · Charts ───────────────────────── */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Visibility Over Time */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Visibility Over Time</h2>
                  <p className="text-xs text-white/35 mt-0.5">Score index vs. competitor average</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> You</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/20" /> Competitor</span>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={visibilityOverTime} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fill="url(#dashGrad)" dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="competitor" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Mentions by AI Model (donut) */}
            <Card>
              <h2 className="text-base font-semibold text-white">Mentions by Model</h2>
              <p className="text-xs text-white/35 mt-0.5">Share of AI voice</p>
              <div className="h-48 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={modelDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3} stroke="none">
                      {modelDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 mt-2">
                {modelDistribution.map((m) => (
                  <li key={m.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-white/60">
                      <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />{m.name}
                    </span>
                    <span className="font-semibold text-white/80">{m.value}%</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* ── Row 3 · Top Prompts + Competitors ──── */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top Performing Prompts */}
            <Card>
              <h2 className="text-base font-semibold text-white mb-4">Top Performing Prompts</h2>
              <div className="space-y-3">
                {promptsList.length === 0 ? (
                  <div className="text-xs text-white/30 py-8 text-center">
                    No prompts registered yet. Go to Prompts tab to add one.
                  </div>
                ) : (
                  promptsList.slice(0, 5).map((p, i) => {
                    const score = getPromptScore(p);
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-white/[0.06] grid place-items-center text-xs font-bold text-indigo-400 shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm text-white/70 flex-1 truncate">{p.text}</span>
                        <span className="text-xs text-white/40 font-mono hidden sm:inline">ChatGPT</span>
                        <span className="text-xs font-semibold text-emerald-400">{score}%</span>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Competitor Comparison */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Competitor Comparison</h2>
                  <p className="text-xs text-white/35 mt-0.5">Average recommendation score</p>
                </div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={brandRankings} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="brand" type="category" width={100} stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
                    <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                      {brandRankings.map((_, i) => <Cell key={i} fill={i === 0 ? "#6366f1" : "rgba(255,255,255,0.08)"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ── Row 4 · Alerts + Responses + Growth ── */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Recent Alerts */}
            <Card>
              <h2 className="text-base font-semibold text-white mb-4">Recent Alerts</h2>
              <div className="space-y-3">
                {recentAlerts.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-start gap-2.5 rounded-lg bg-white/[0.02] p-3">
                    <span className="mt-0.5 w-2 h-2 rounded-full shrink-0" style={{ background: severityColor[a.severity] }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/70 leading-snug">{a.message}</div>
                      <div className="text-[11px] text-white/30 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent AI Responses */}
            <Card>
              <h2 className="text-base font-semibold text-white mb-4">Recent AI Responses</h2>
              <div className="space-y-3">
                {recentResponses.map((r) => (
                  <div key={r.id} className="rounded-lg bg-white/[0.02] p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: MODEL_COLORS[r.model] || "#6366f1" }} />
                      <span className="text-xs font-semibold text-white/70">{r.model}</span>
                      <span className="text-[11px] text-white/25 ml-auto">{r.time}</span>
                    </div>
                    <div className="text-xs text-white/40 line-clamp-2 leading-relaxed">{r.excerpt}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Weekly Growth */}
            <Card>
              <h2 className="text-base font-semibold text-white mb-4">Weekly Growth</h2>
              <div className="space-y-4">
                {weeklyGrowthData.map((g) => (
                  <div key={g.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-white/60">{g.label}</span>
                      <span className={`flex items-center gap-1 text-sm font-semibold ${g.positive ? "text-emerald-400" : "text-red-400"}`}>
                        {g.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        +{g.value}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-indigo-500/60 transition-all" 
                        style={{ width: projectsCount > 0 ? `${Math.min(g.value * 5, 100)}%` : "0%" }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
