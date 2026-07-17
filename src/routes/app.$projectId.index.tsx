import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import {
  Calendar, ChevronDown, Globe, Loader2, SlidersHorizontal, Tag, Target, Bot, MapPin,
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

/* ─── Seed-stable random from a string ───────────────────────────────── */
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function fakePercent(id: string, offset: number) {
  return 5 + ((hash(id + offset) % 25));
}

/* ─── Mock chart generators (will be replaced by real DB queries) ─────── */
function genSovOverTime(models: string[]) {
  const days = ["20 May", "25 May", "30 May", "4 Jun", "8 Jun", "12 Jun", "17 Jun"];
  return days.map((d) => {
    const obj: any = { date: d };
    models.forEach((m) => { obj[m] = 10 + Math.floor(Math.random() * 30); });
    return obj;
  });
}
function genCitationsOverTime() {
  return Array.from({ length: 14 }, (_, i) => ({
    date: `Day ${i + 1}`,
    nike: 20 + Math.floor(Math.random() * 60),
    adidas: 15 + Math.floor(Math.random() * 50),
    asics: 10 + Math.floor(Math.random() * 40),
    hoka: 5 + Math.floor(Math.random() * 30),
    onrunning: 10 + Math.floor(Math.random() * 35),
  }));
}

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
  const [topDomains, setTopDomains] = useState<any[]>([]);
  const [topCitations, setTopCitations] = useState<any[]>([]);

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

      // ── Generate SoV data (based on real competitors from DB) ──────────
      setSovData(genSovOverTime(compNames));

      const total = compNames.reduce((sum, _, i) => sum + fakePercent(projectId, i), 0);
      const breakdown = compNames.map((name, i) => ({
        name,
        value: fakePercent(projectId, i),
        pct: ((fakePercent(projectId, i) / total) * 100).toFixed(2),
        color: BRAND_COLORS[i % BRAND_COLORS.length],
      }));
      setSovBreakdown(breakdown);

      // ── Citations ─────────────────────────────────────────────────────
      setCitationsData(genCitationsOverTime());

      // ── Top cited domains from mentions ───────────────────────────────
      const { data: mentionRows } = await (supabase as any)
        .from("mentions")
        .select("source_url, source_domain")
        .eq("project_id", projectId)
        .limit(200);

      if (mentionRows && mentionRows.length > 0) {
        const domainCount: Record<string, number> = {};
        mentionRows.forEach((m: any) => {
          const domain = m.source_domain || (m.source_url ? new URL(m.source_url).hostname : null);
          if (domain) domainCount[domain] = (domainCount[domain] || 0) + 1;
        });
        const sorted = Object.entries(domainCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([domain, count], i) => ({ rank: i + 1, domain, citations: count }));
        setTopCitations(sorted);
        setTopDomains(sorted.map(d => d.domain));
      } else {
        // Fallback demo data if no real mentions yet
        setTopCitations([
          { rank: 1, domain: "nike.com", citations: 1517 },
          { rank: 2, domain: "geerjunkie.com", citations: 1159 },
          { rank: 3, domain: "reddit.com", citations: 1135 },
          { rank: 4, domain: "outdoorgearlab.com", citations: 1120 },
          { rank: 5, domain: "nytimes.com", citations: 1117 },
        ]);
        setTopDomains(["nike.com", "geerjunkie.com", "reddit.com", "outdoorgearlab.com", "nytimes.com"]);
      }
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

  const brandName = project?.brand || project?.name || "Your Brand";

  // Donut slices
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
                    <Tooltip contentStyle={CustomTooltipStyle} formatter={(v: any) => [`${v}`, "score"]} />
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
          <SectionCard title="Citations" tooltip="Citation volume across time">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={citationsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CustomTooltipStyle} />
                  {["nike", "adidas", "asics", "hoka", "onrunning"].map((k, i) => (
                    <Line key={k} type="monotone" dataKey={k} stroke={BRAND_COLORS[i]} strokeWidth={1.5} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {["nike", "adidas", "asics", "hoka", "onrunning"].map((k, i) => (
                <span key={k} className="flex items-center gap-1.5 text-[10px] text-white/50">
                  <span className="w-2 h-2 rounded-full" style={{ background: BRAND_COLORS[i] }} />
                  {k}
                </span>
              ))}
            </div>
          </SectionCard>

          {/* Top Cited Domains (line chart) */}
          <SectionCard title="Top Cited Domains" tooltip="Most cited sources in AI responses">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={citationsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={CustomTooltipStyle} />
                  {topCitations.map((d, i) => (
                    <Line key={d.domain} type="monotone" dataKey="nike" name={d.domain}
                      stroke={BRAND_COLORS[i % BRAND_COLORS.length]} strokeWidth={1.5} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {topCitations.map((d, i) => (
                <span key={d.domain} className="flex items-center gap-1.5 text-[10px] text-white/50">
                  <span className="w-2 h-2 rounded-full" style={{ background: BRAND_COLORS[i % BRAND_COLORS.length] }} />
                  {d.domain}
                </span>
              ))}
            </div>
          </SectionCard>

          {/* Top Citations Table */}
          <SectionCard title="Top Citations" tooltip="Domains most frequently cited when brands are mentioned">
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
                        <Globe className="w-3 h-3 text-white/30 shrink-0" />
                        {row.domain}
                      </span>
                    </td>
                    <td className="py-2 text-right font-semibold text-white/80">{row.citations.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
