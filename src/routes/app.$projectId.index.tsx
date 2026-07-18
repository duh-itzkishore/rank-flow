import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import {
  Calendar, ChevronDown, Globe, Loader2, SlidersHorizontal, Tag, Target, Bot, MapPin,
  Eye, MessageSquare, TrendingUp, AlertTriangle, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/$projectId/")({
  component: ProjectOverview,
});

/* ─── Colour Palette ──────────────────────────────────────────────────── */
const BRAND_COLORS = [
  "#6366f1", "#3b82f6", "#ec4899", "#f59e0b",
  "#10b981", "#ef4444", "#a78bfa", "#14b8a6",
];

/* ─── Helper UI components ────────────────────────────────────────────── */
function FilterPill({ label, icon: Icon }: { label: string; icon?: any }) {
  return (
    <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.07] hover:text-white/80 transition-colors">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
      <ChevronDown className="w-3 h-3 opacity-50 ml-0.5" />
    </button>
  );
}

function SectionCard({ title, tooltip, children, className = "" }: {
  title: string; tooltip?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 ${className}`}>
      <h3 className="text-[13px] font-semibold text-white/80 mb-4 flex items-center gap-1.5">
        {title}
        {tooltip && (
          <span className="text-white/25 text-[10px] cursor-help" title={tooltip}>ⓘ</span>
        )}
      </h3>
      {children}
    </div>
  );
}

const CustomTooltipStyle = {
  background: "#1e1e24",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  fontSize: 11,
  color: "#fff",
  padding: "8px 12px",
};

/* ─── Main component ──────────────────────────────────────────────────── */
function ProjectOverview() {
  const { projectId } = useParams({ from: "/app/$projectId/" });
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [sovData, setSovData] = useState<any[]>([]);
  const [sovBreakdown, setSovBreakdown] = useState<any[]>([]);
  const [citationsData, setCitationsData] = useState<any[]>([]);
  const [topDomainsData, setTopDomainsData] = useState<any[]>([]);
  const [topDomains, setTopDomains] = useState<any[]>([]);
  const [topCitations, setTopCitations] = useState<any[]>([]);

  // KPI States
  const [totalScans, setTotalScans] = useState(0);
  const [aiVisibility, setAiVisibility] = useState(0);
  const [avgSentiment, setAvgSentiment] = useState<number | null>(null);
  const [hallucinationRate, setHallucinationRate] = useState(0);

  useEffect(() => {
    load();
  }, [projectId]);

  async function load() {
    setLoading(true);
    try {
      // ── Fetch project info ─────────────────────────────────────────────
      const { data: proj } = await (supabase as any)
        .from("projects")
        .select("id, name, brand, domain, org_id")
        .eq("id", projectId)
        .single();
      setProject(proj);

      // ── Fetch competitors for this project ─────────────────────────────
      const { data: compRows } = await (supabase as any)
        .from("competitors")
        .select("name, domain")
        .eq("project_id", projectId)
        .limit(6);

      const compNames: string[] = [
        proj?.brand || "You",
        ...((compRows || []).map((c: any) => c.name || c.domain)),
      ];
      setCompetitors(compNames);

      // ── Fetch real prompt runs for the project ────────────────────────
      const { data: runs, error: runsError } = await (supabase as any)
        .from("prompt_runs")
        .select(`
          id, model, is_mentioned, rank, response_text,
          created_at, citations, sentiment_score, confidence_score,
          hallucination_detected, raw_response,
          prompts!inner(text, project_id)
        `)
        .eq("prompts.project_id", projectId)
        .order("created_at", { ascending: true });

      if (runsError) throw runsError;

      const runsList = runs || [];

      // Calculate KPI Stats
      setTotalScans(runsList.length);

      const mentionedRuns = runsList.filter((r: any) => r.is_mentioned);
      setAiVisibility(runsList.length > 0 ? Math.round((mentionedRuns.length / runsList.length) * 100) : 0);

      const sentimentRuns = runsList.filter((r: any) => r.sentiment_score !== null && r.sentiment_score !== undefined);
      if (sentimentRuns.length > 0) {
        const sumSentiment = sentimentRuns.reduce((sum: number, r: any) => sum + (r.sentiment_score || 0), 0);
        setAvgSentiment(parseFloat((sumSentiment / sentimentRuns.length).toFixed(2)));
      } else {
        setAvgSentiment(null);
      }

      const hallucinatedRuns = runsList.filter((r: any) => r.hallucination_detected);
      setHallucinationRate(runsList.length > 0 ? Math.round((hallucinatedRuns.length / runsList.length) * 100) : 0);

      if (runsList.length === 0) {
        setSovData([]);
        setSovBreakdown([]);
        setCitationsData([]);
        setTopCitations([]);
        setTopDomains([]);
        setTopDomainsData([]);
        return;
      }

      // Generate SoV Over Time
      const byDate: Record<string, Record<string, number>> = {};
      const dateList: string[] = [];

      runsList.forEach((r: any) => {
        const dateStr = new Date(r.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short" });
        if (!byDate[dateStr]) {
          byDate[dateStr] = {};
          dateList.push(dateStr);
        }

        compNames.forEach(name => {
          if (!byDate[dateStr][name]) byDate[dateStr][name] = 0;

          let mentioned = false;
          if (name === proj?.brand) {
            mentioned = r.is_mentioned;
          } else {
            const rawResp: any = r.raw_response;
            const compFromRaw = rawResp?.competitors?.find((c: any) => c.name === name);
            if (compFromRaw) {
              mentioned = compFromRaw.mentioned;
            } else {
              mentioned = new RegExp(`\\b${name}\\b`, 'i').test(r.response_text || '');
            }
          }
          if (mentioned) {
            byDate[dateStr][name]++;
          }
        });
      });

      const processedSovData = dateList.map(date => {
        const obj: any = { date };
        let dayTotal = 0;
        compNames.forEach(name => {
          dayTotal += byDate[date][name] || 0;
        });
        compNames.forEach(name => {
          const count = byDate[date][name] || 0;
          obj[name] = dayTotal > 0 ? Math.round((count / dayTotal) * 100) : 0;
        });
        return obj;
      });
      setSovData(processedSovData);

      // Current SoV Breakdown & Donut
      const brandMentionsCount: Record<string, number> = {};
      let totalBrandMentions = 0;
      compNames.forEach(name => {
        brandMentionsCount[name] = 0;
      });

      runsList.forEach((r: any) => {
        compNames.forEach(name => {
          let mentioned = false;
          if (name === proj?.brand) {
            mentioned = r.is_mentioned;
          } else {
            const rawResp: any = r.raw_response;
            const compFromRaw = rawResp?.competitors?.find((c: any) => c.name === name);
            if (compFromRaw) {
              mentioned = compFromRaw.mentioned;
            } else {
              mentioned = new RegExp(`\\b${name}\\b`, 'i').test(r.response_text || '');
            }
          }
          if (mentioned) {
            brandMentionsCount[name]++;
            totalBrandMentions++;
          }
        });
      });

      const breakdown = compNames.map((name, i) => {
        const count = brandMentionsCount[name] || 0;
        const pct = totalBrandMentions > 0 ? ((count / totalBrandMentions) * 100).toFixed(1) : "0.0";
        return {
          name,
          value: count,
          pct,
          color: BRAND_COLORS[i % BRAND_COLORS.length],
        };
      });
      setSovBreakdown(breakdown);

      // Generate Citations Over Time
      const citationTrend: Record<string, Record<string, number>> = {};
      runsList.forEach((r: any) => {
        const dateStr = new Date(r.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short" });
        if (!citationTrend[dateStr]) {
          citationTrend[dateStr] = {};
        }

        compNames.forEach(name => {
          if (!citationTrend[dateStr][name]) citationTrend[dateStr][name] = 0;

          let mentioned = false;
          if (name === proj?.brand) {
            mentioned = r.is_mentioned;
          } else {
            const rawResp: any = r.raw_response;
            const compFromRaw = rawResp?.competitors?.find((c: any) => c.name === name);
            if (compFromRaw) {
              mentioned = compFromRaw.mentioned;
            } else {
              mentioned = new RegExp(`\\b${name}\\b`, 'i').test(r.response_text || '');
            }
          }

          if (mentioned && Array.isArray(r.citations)) {
            citationTrend[dateStr][name] += r.citations.length;
          }
        });
      });

      const processedCitationsData = dateList.map(date => {
        const obj: any = { date };
        compNames.forEach(name => {
          obj[name] = citationTrend[date][name] || 0;
        });
        return obj;
      });
      setCitationsData(processedCitationsData);

      // Citations / Top Cited Domains
      const domainCount: Record<string, number> = {};
      runsList.forEach((r: any) => {
        if (Array.isArray(r.citations)) {
          r.citations.forEach((c: any) => {
            if (c.url) {
              try {
                const domain = new URL(c.url).hostname.replace("www.", "");
                domainCount[domain] = (domainCount[domain] || 0) + 1;
              } catch (e) {
                // ignore
              }
            }
          });
        }
      });

      const sortedDomains = Object.entries(domainCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([domain, count], i) => ({
          rank: i + 1,
          domain,
          citations: count
        }));

      setTopCitations(sortedDomains);
      setTopDomains(sortedDomains.map(d => d.domain));

      // Top Cited Domains over time
      const domainTrend: Record<string, Record<string, number>> = {};
      runsList.forEach((r: any) => {
        const dateStr = new Date(r.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short" });
        if (!domainTrend[dateStr]) {
          domainTrend[dateStr] = {};
        }

        sortedDomains.forEach(d => {
          if (!domainTrend[dateStr][d.domain]) domainTrend[dateStr][d.domain] = 0;

          if (Array.isArray(r.citations)) {
            const hasCitationsForDomain = r.citations.some((c: any) => c.url && c.url.includes(d.domain));
            if (hasCitationsForDomain) {
              domainTrend[dateStr][d.domain]++;
            }
          }
        });
      });

      const processedDomainTrendData = dateList.map(date => {
        const obj: any = { date };
        sortedDomains.forEach(d => {
          obj[d.domain] = domainTrend[date][d.domain] || 0;
        });
        return obj;
      });
      setTopDomainsData(processedDomainTrendData);

    } catch (err) {
      console.error("ProjectOverview load error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/40 gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        Loading overview…
      </div>
    );
  }

  if (totalScans === 0) {
    return (
      <div className="mx-auto max-w-xl text-center space-y-6 py-24 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mx-auto">
          <Bot className="w-8 h-8 text-indigo-400 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">No scans run yet</h2>
          <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed">
            Get started by adding and running prompts to track your brand visibility, Share of Voice, and citations.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/app/$projectId/prompts"
            params={{ projectId }}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors inline-flex items-center gap-1.5"
          >
            Create Prompt Audits <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/app/$projectId/seo-audit"
            params={{ projectId }}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/[0.08] transition-colors"
          >
            AEO Technical Check
          </Link>
        </div>
      </div>
    );
  }

  const brandName = project?.brand || project?.name || "Your Brand";
  const donutData = sovBreakdown;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
        <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mr-1 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
        </span>
        <FilterPill label="Last 30 days" icon={Calendar} />
        <FilterPill label={`Competitors · ${competitors.length - 1}`} icon={Target} />
        <FilterPill label="All Models" icon={Bot} />
        <FilterPill label="Tags" icon={Tag} />
        <FilterPill label="Query Type" />
        <FilterPill label="Brand Focus" />
        <FilterPill label="United States" icon={MapPin} />
      </div>

      {/* ── KPI Stats Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "AI Visibility Score",
            value: `${aiVisibility}%`,
            desc: "Mention rate across AI scans",
            icon: Eye,
            color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
          },
          {
            label: "AI Mentions Scanned",
            value: totalScans,
            desc: "Total model responses analyzed",
            icon: MessageSquare,
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          },
          {
            label: "Average Sentiment",
            value: avgSentiment !== null ? (avgSentiment > 0 ? `+${avgSentiment}` : avgSentiment) : "—",
            desc: "Scale from -1.0 to +1.0",
            icon: TrendingUp,
            color: "text-pink-400 bg-pink-500/10 border-pink-500/20"
          },
          {
            label: "Hallucination Rate",
            value: `${hallucinationRate}%`,
            desc: "Low-confidence model outputs",
            icon: AlertTriangle,
            color: hallucinationRate > 20
              ? "text-red-400 bg-red-500/10 border-red-500/20"
              : "text-amber-400 bg-amber-500/10 border-amber-500/20"
          }
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 flex items-start gap-4">
            <div className={`p-2.5 rounded-xl border shrink-0 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold block leading-none">{stat.label}</span>
              <span className="text-2xl font-bold text-white block leading-none pt-1">{stat.value}</span>
              <span className="text-[10px] text-white/40 block pt-1">{stat.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 – Share of Voice
      ══════════════════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-1.5">
          Share of Voice
          <span className="text-white/20 text-[10px] cursor-help" title="How often your brand appears vs competitors in AI responses">ⓘ</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px_300px] gap-4">
          {/* Share of Voice Over Time (stacked area) */}
          <SectionCard title="Share of Voice Over Time" tooltip="Brand mention share across all tracked AI models">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sovData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={CustomTooltipStyle} />
                  {competitors.map((c, i) => (
                    <Area
                      key={c}
                      type="monotone"
                      dataKey={c}
                      stackId="1"
                      stroke={BRAND_COLORS[i % BRAND_COLORS.length]}
                      fill={BRAND_COLORS[i % BRAND_COLORS.length]}
                      fillOpacity={0.75}
                      strokeWidth={0}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {competitors.map((c, i) => (
                <span key={c} className="flex items-center gap-1.5 text-[10px] text-white/50">
                  <span className="w-2 h-2 rounded-full" style={{ background: BRAND_COLORS[i % BRAND_COLORS.length] }} />
                  {c === competitors[0] ? `${c} (You)` : c}
                </span>
              ))}
            </div>
          </SectionCard>

          {/* Donut */}
          <SectionCard title="Share of Voice" tooltip="Current brand share of voice (donut view)">
            <div className="flex flex-col items-center">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {donutData.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CustomTooltipStyle} formatter={(v: any) => [`${v}`, "mentions"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                {donutData.map((d) => (
                  <span key={d.name} className="flex items-center gap-1 text-[10px] text-white/50">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    {d.name === competitors[0] ? `${d.name} (You)` : d.name}
                  </span>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Breakdown Table */}
          <SectionCard title="Share of Voice Breakdown" tooltip="Ranked list of brands by share">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-white/30 border-b border-white/[0.06]">
                  <th className="text-left pb-2 font-medium w-8">Ranking</th>
                  <th className="text-left pb-2 font-medium">Brand</th>
                  <th className="text-right pb-2 font-medium">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {[...sovBreakdown]
                  .sort((a, b) => parseFloat(b.pct) - parseFloat(a.pct))
                  .map((row, i) => (
                  <tr key={row.name} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-2 text-white/40">{i + 1}</td>
                    <td className="py-2">
                      <span className="flex items-center gap-2 text-white/70">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: row.color }} />
                        {row.name === competitors[0] ? `${row.name} (You)` : row.name}
                      </span>
                    </td>
                    <td className="py-2 text-right font-semibold text-white/80">{row.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 – Citations
      ══════════════════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-1.5">
          Citations
          <span className="text-white/20 text-[10px] cursor-help" title="Sources cited in AI responses mentioning your brand">ⓘ</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_300px] gap-4">
          {/* Citations over time */}
          <SectionCard title="Citations volume over time" tooltip="Total citations detected across all prompt runs">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={citationsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CustomTooltipStyle} />
                  {competitors.map((k, i) => (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      name={k === competitors[0] ? `${k} (You)` : k}
                      stroke={BRAND_COLORS[i % BRAND_COLORS.length]}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {competitors.map((k, i) => (
                <span key={k} className="flex items-center gap-1.5 text-[10px] text-white/50">
                  <span className="w-2 h-2 rounded-full" style={{ background: BRAND_COLORS[i % BRAND_COLORS.length] }} />
                  {k === competitors[0] ? `${k} (You)` : k}
                </span>
              ))}
            </div>
          </SectionCard>

          {/* Top Cited Domains (line chart) */}
          <SectionCard title="Top Cited Domains" tooltip="Most cited sources in AI responses over time">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={topDomainsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CustomTooltipStyle} />
                  {topCitations.map((d, i) => (
                    <Line key={d.domain} type="monotone" dataKey={d.domain} name={d.domain}
                      stroke={BRAND_COLORS[i % BRAND_COLORS.length]} strokeWidth={1.5} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          {/* Top Citations Table */}
          <SectionCard title="Top Citations" tooltip="Domains most frequently cited when brands are mentioned">
            {topCitations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-44 text-white/30 text-xs italic">
                No citations scanned yet
              </div>
            ) : (
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-white/30 border-b border-white/[0.06]">
                    <th className="text-left pb-2 font-medium w-8">Ranking</th>
                    <th className="text-left pb-2 font-medium">Domain</th>
                    <th className="text-right pb-2 font-medium">Citations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {topCitations.map((row) => (
                    <tr key={row.domain} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-2 text-white/40">{row.rank}</td>
                      <td className="py-2">
                        <span className="flex items-center gap-2 text-white/70">
                          <Globe className="w-3.5 h-3.5 text-white/30 shrink-0" />
                          {row.domain}
                        </span>
                      </td>
                      <td className="py-2 text-right font-semibold text-white/80">{row.citations.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
