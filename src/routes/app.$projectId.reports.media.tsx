import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Printer, FileText, Link as LinkIcon, ExternalLink, TrendingUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from "recharts";

export const Route = createFileRoute("/app/$projectId/reports/media")({
  component: MediaReport,
});

const MODEL_COLORS: Record<string, string> = {
  chatgpt: "#10a37f", gemini: "#4285f4", claude: "#c85a2a", perplexity: "#7c3aed",
};

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch (e) {
    return url;
  }
}

function MediaReport() {
  const { projectId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMediaData();
  }, [projectId]);

  const fetchMediaData = async () => {
    try {
      setLoading(true);
      
      // Get project details for domain
      const { data: project } = await supabase
        .from("projects")
        .select("website")
        .eq("id", projectId)
        .single();
        
      if (!project) throw new Error("Project not found");
      const projectDomain = getDomain(project.website || "");

      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
      
      const { data: runs, error } = await supabase
        .from("prompt_runs")
        .select(`
          id, model, created_at,
          citations,
          prompts!inner(project_id)
        `)
        .eq("prompts.project_id", projectId)
        .gte("created_at", thirtyDaysAgo);

      if (error) throw error;

      const allRuns = (runs as any[]) || [];
      
      let totalCitations = 0;
      let ownedCitations = 0;
      let earnedCitations = 0;
      
      const ownedPages: Record<string, { count: number; models: Set<string>; title: string }> = {};
      const byDate: Record<string, { owned: number; earned: number }> = {};

      allRuns.forEach(r => {
        const day = r.created_at.slice(0, 10);
        if (!byDate[day]) byDate[day] = { owned: 0, earned: 0 };
        
        if (r.citations && Array.isArray(r.citations)) {
          r.citations.forEach((cite: any) => {
            if (!cite.url) return;
            totalCitations++;
            
            const isOwned = cite.url.includes(projectDomain);
            if (isOwned) {
              ownedCitations++;
              byDate[day].owned++;
              
              if (!ownedPages[cite.url]) {
                ownedPages[cite.url] = { count: 0, models: new Set(), title: cite.title || cite.url };
              }
              ownedPages[cite.url].count++;
              ownedPages[cite.url].models.add(r.model);
            } else {
              earnedCitations++;
              byDate[day].earned++;
            }
          });
        }
      });

      // Pie Chart
      const pieData = [
        { name: "Owned Media (Your Site)", value: ownedCitations, color: "#6366f1" },
        { name: "Earned Media (3rd Party)", value: earnedCitations, color: "#475569" },
      ];

      // Trend Chart
      const trendData = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({
          date: date.slice(5),
          "Owned Citations": stats.owned,
          "Earned Citations": stats.earned,
        }));

      // Top Pages
      const topPages = Object.entries(ownedPages)
        .map(([url, stats]) => ({
          url,
          title: stats.title,
          count: stats.count,
          models: Array.from(stats.models)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // top 10

      setData({
        projectDomain,
        totalCitations,
        ownedCitations,
        earnedCitations,
        pieData,
        trendData,
        topPages,
        totalRuns: allRuns.length
      });

    } catch (err: any) {
      toast.error("Failed to load media data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/50 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Analyzing citations...
      </div>
    );
  }

  if (!data || data.totalCitations === 0) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 grid place-items-center mx-auto mb-5">
          <LinkIcon className="w-7 h-7 text-indigo-400" />
        </div>
        <h3 className="text-white font-medium">No Citations Found</h3>
        <p className="text-white/50 text-sm mt-2">
          AI models haven't cited any sources in their responses for your tracked prompts yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            Owned Media Performance
          </h1>
          <p className="mt-1 text-sm text-white/40">Track how often AI models directly cite your domain (`{data.projectDomain}`).</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08] border border-white/[0.05] transition-colors print:hidden"
        >
          <Printer className="w-4 h-4" /> Print PDF
        </button>
      </div>

      <div ref={printRef} className="space-y-6 print:m-0">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center">
            <h3 className="text-sm font-medium text-white/50 mb-2">Total Citations</h3>
            <div className="text-4xl font-bold text-white my-2">{data.totalCitations}</div>
            <div className="text-xs text-white/40">Across all AI responses (30d)</div>
          </div>
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 text-center">
            <h3 className="text-sm font-medium text-indigo-300/70 mb-2">Owned Media Citations</h3>
            <div className="text-4xl font-bold text-indigo-400 my-2">{data.ownedCitations}</div>
            <div className="text-xs text-indigo-300/50">Direct links to your domain</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center">
            <h3 className="text-sm font-medium text-white/50 mb-2">Owned Media Share</h3>
            <div className="text-4xl font-bold text-white my-2">
              {Math.round((data.ownedCitations / Math.max(data.totalCitations, 1)) * 100)}%
            </div>
            <div className="text-xs text-white/40">Of all citations</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution Pie */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="text-sm font-medium text-white/70 mb-4">Citations Source Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.pieData.map((entry: any, index: number) => (
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
            <div className="flex justify-center gap-6 mt-2">
              {data.pieData.map((d: any) => (
                <div key={d.name} className="flex items-center gap-2 text-xs text-white/60">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </div>

          {/* Trend Chart */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="text-sm font-medium text-white/70 mb-6">Citations Over Time (30 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1c", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="Owned Citations" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Earned Citations" stroke="#475569" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Pages Table */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-white/70">Top Cited Owned Pages</h3>
            <span className="text-xs text-white/40">{data.topPages.length} Pages Found</span>
          </div>
          
          {data.topPages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/5 text-white/40">
                    <th className="pb-3 font-medium">Page URL</th>
                    <th className="pb-3 font-medium">Citations</th>
                    <th className="pb-3 font-medium">Citing Models</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.topPages.map((page: any, idx: number) => (
                    <tr key={idx} className="text-white/80 hover:bg-white/[0.01]">
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="text-white truncate max-w-[400px]" title={page.title}>{page.title}</span>
                          <a href={page.url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1 text-xs mt-0.5 truncate max-w-[400px]">
                            {page.url} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center justify-center bg-white/5 rounded-full px-2.5 py-0.5 text-white font-medium">
                          {page.count}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {page.models.map((model: string) => (
                            <span 
                              key={model}
                              className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: `${MODEL_COLORS[model] || '#888'}20`, color: MODEL_COLORS[model] || '#888' }}
                            >
                              {model}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
              <FileText className="w-6 h-6 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/50">No owned pages cited yet.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
