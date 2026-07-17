import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2, Search, ChevronDown, Download, Globe, ExternalLink, Filter,
  Link2, CheckCircle2, AlertCircle, Play, Sparkles, SlidersHorizontal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$projectId/citations")({
  component: Citations,
});

/* ─── Helpers ──────────────────────────────────────────────────────────── */
function CitationRateCircle({ pct }: { pct: number }) {
  const r = 9, circ = 2 * Math.PI * r;
  const fill = circ * (pct / 100);
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="20" height="20" viewBox="0 0 24 24" className="-rotate-90">
        <circle cx="12" cy="12" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" fill="none" />
        <circle
          cx="12" cy="12" r={r}
          stroke={pct >= 50 ? "#6366f1" : pct >= 25 ? "#f59e0b" : "#ef4444"}
          strokeWidth="2.5" fill="none"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[12px] font-semibold text-white/80">{pct}%</span>
    </span>
  );
}

function FilterPill({ label, icon: Icon }: { label: string; icon?: any }) {
  return (
    <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.07] hover:text-white/80 transition-colors whitespace-nowrap">
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {label}
      <ChevronDown className="w-3 h-3 opacity-50 ml-0.5" />
    </button>
  );
}

interface DomainCitation {
  domain: string;
  citationRate: number;
  uniqueUrls: number;
  totalCitations: number;
  chatgptCount: number;
  geminiCount: number;
  claudeCount: number;
  perplexityCount: number;
  relationship: "You" | "Competitor" | "Editorial";
  brandBuilder: boolean;
  urlsList: string[];
}

function Citations() {
  const { projectId } = useParams({ from: "/app/$projectId/citations" });
  const [project, setProject] = useState<any>(null);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [citations, setCitations] = useState<DomainCitation[]>([]);
  const [totalRunsCount, setTotalRunsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"sources" | "domain" | "host" | "page">("sources");

  useEffect(() => {
    fetchData();
  }, [projectId]);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Fetch Project website
      const { data: proj } = await supabase
        .from("projects")
        .select("id, name, brand, website")
        .eq("id", projectId)
        .maybeSingle();
      setProject(proj);

      // 2. Fetch Competitors
      const { data: comp } = await (supabase as any)
        .from("competitors")
        .select("name, domain")
        .eq("project_id", projectId);
      setCompetitors(comp || []);

      // 3. Fetch prompts
      const { data: prompts } = await supabase
        .from("prompts")
        .select("id")
        .eq("project_id", projectId);

      if (!prompts || prompts.length === 0) {
        setCitations([]);
        setTotalRunsCount(0);
        return;
      }

      const promptIds = prompts.map(p => p.id);

      // 4. Fetch prompt runs (containing JSON citations)
      const { data: runs, error: runsErr } = await supabase
        .from("prompt_runs")
        .select("id, model, citations, created_at")
        .in("prompt_id", promptIds);

      if (runsErr) throw runsErr;

      const totalRuns = runs?.length || 0;
      setTotalRunsCount(totalRuns);

      if (totalRuns === 0) {
        setCitations([]);
        return;
      }

      // Helper to clean base domain
      const getBaseDomain = (urlStr: string) => {
        try {
          let host = new URL(urlStr).hostname.toLowerCase();
          return host.startsWith("www.") ? host.substring(4) : host;
        } catch {
          return urlStr.toLowerCase();
        }
      };

      // Extract details
      const domainMap: Record<string, {
        total: number;
        chatgpt: number;
        gemini: number;
        claude: number;
        perplexity: number;
        runsWithCitation: Set<string>;
        urls: Set<string>;
      }> = {};

      runs?.forEach(run => {
        const cits = Array.isArray(run.citations) ? run.citations : [];
        const model = run.model.toLowerCase();

        cits.forEach((c: any) => {
          if (!c.url) return;
          const domain = getBaseDomain(c.url);

          if (!domainMap[domain]) {
            domainMap[domain] = {
              total: 0,
              chatgpt: 0,
              gemini: 0,
              claude: 0,
              perplexity: 0,
              runsWithCitation: new Set(),
              urls: new Set(),
            };
          }

          const dData = domainMap[domain];
          dData.total += 1;
          dData.runsWithCitation.add(run.id);
          dData.urls.add(c.url);

          if (model.includes("chatgpt")) dData.chatgpt += 1;
          else if (model.includes("gemini")) dData.gemini += 1;
          else if (model.includes("claude")) dData.claude += 1;
          else if (model.includes("perplexity")) dData.perplexity += 1;
        });
      });

      // Format aggregated objects
      const projectWebsite = proj?.website ? getBaseDomain(proj.website) : "";
      const competitorDomains: string[] = (comp || []).map((c: any) => c.domain ? getBaseDomain(c.domain) : "").filter(Boolean);

      const list: DomainCitation[] = Object.entries(domainMap).map(([domain, data]) => {
        let relationship: "You" | "Competitor" | "Editorial" = "Editorial";
        if (projectWebsite && (domain.includes(projectWebsite) || projectWebsite.includes(domain))) {
          relationship = "You";
        } else if (competitorDomains.some(cd => domain.includes(cd) || cd.includes(domain))) {
          relationship = "Competitor";
        }

        const citationRate = Math.round((data.runsWithCitation.size / totalRuns) * 100);

        return {
          domain,
          citationRate,
          uniqueUrls: data.urls.size,
          totalCitations: data.total,
          chatgptCount: data.chatgpt,
          geminiCount: data.gemini,
          claudeCount: data.claude,
          perplexityCount: data.perplexity,
          relationship,
          brandBuilder: relationship === "Editorial" && citationRate >= 20,
          urlsList: Array.from(data.urls),
        };
      }).sort((a, b) => b.totalCitations - a.totalCitations);

      setCitations(list);
    } catch (err: any) {
      toast.error("Failed to load citations: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = citations.filter(c =>
    c.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            Citations
            <span className="text-white/20 text-sm cursor-help" title="Web sources that cite your brand or competitors in AI responses">ⓘ</span>
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            {citations.length} cited domains across {totalRunsCount} total audits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/[0.07] transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Citations", value: citations.reduce((sum, c) => sum + c.totalCitations, 0) },
          { label: "Unique Domains", value: citations.length },
          { label: "Owned Website Citations", value: citations.filter(c => c.relationship === "You").reduce((sum, c) => sum + c.totalCitations, 0) },
          { label: "Brand Builder Targets", value: citations.filter(c => c.brandBuilder).length },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">{kpi.label}</div>
            <div className="text-xl font-bold text-white mt-1">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* ── Master Filters Bar ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.07] pb-4">
        <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider flex items-center gap-1.5 mr-2">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
        </span>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search domains..."
            className="h-8 rounded-lg border border-white/10 bg-white/[0.04] pl-8 pr-3 text-xs text-white placeholder-white/30 outline-none focus:border-indigo-500/40 transition-colors w-52"
          />
        </div>
        <FilterPill label="Last 30 days" />
        <FilterPill label="Tags" />
        <FilterPill label="All Models" />
        <FilterPill label="United States" icon={Globe} />
        <FilterPill label="English" />
      </div>

      {/* ── View Overhaul Grid ───────────────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        {/* Table View Sub-Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-white/[0.07] bg-white/[0.01]">
          <div className="flex gap-1">
            {[
              { id: "sources", label: "Citation Sources" },
              { id: "domain", label: "By Domain" },
              { id: "host", label: "By Host" },
              { id: "page", label: "By Page" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeSubTab === tab.id
                    ? "bg-white/[0.07] text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <FilterPill label="All Types" />
            <FilterPill label="All Mentions" />
            <FilterPill label="All Sentiments" />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/40 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            Loading citations…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-b-xl p-16 text-center">
            <AlertCircle className="w-10 h-10 text-white/10 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-white">No citations discovered</h3>
            <p className="mt-1 text-xs text-white/40 max-w-sm mx-auto leading-relaxed">
              When models run and find references to your category, they will populate here. Try auditing prompts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="text-white/30 font-semibold uppercase tracking-wider text-[9px] border-b border-white/[0.07] bg-white/[0.005]">
                  <th className="text-left py-3.5 px-4 w-[240px]">Domain</th>
                  <th className="text-left py-3.5 px-3">Citation Rate</th>
                  <th className="text-right py-3.5 px-3">URLs</th>
                  <th className="text-right py-3.5 px-3">Total Citations</th>
                  <th className="text-center py-3.5 px-2 w-[70px]">ChatGPT</th>
                  <th className="text-center py-3.5 px-2 w-[70px]">Gemini</th>
                  <th className="text-center py-3.5 px-2 w-[70px]">Claude</th>
                  <th className="text-center py-3.5 px-2 w-[70px]">Perplexity</th>
                  <th className="text-center py-3.5 px-4">Brand Builder</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr
                    key={row.domain}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Domain + Type Badge */}
                    <td className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={`https://www.google.com/s2/favicons?sz=64&domain=${row.domain}`}
                          alt=""
                          className="w-4 h-4 rounded-sm bg-white/5 border border-white/10"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E";
                          }}
                        />
                        <span className="text-white/80 select-all hover:text-indigo-300 transition-colors truncate max-w-[140px]">
                          {row.domain}
                        </span>
                        {row.relationship === "You" && (
                          <span className="rounded bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 text-[8.5px] font-bold tracking-wide border border-indigo-500/20 uppercase shrink-0">
                            You
                          </span>
                        )}
                        {row.relationship === "Competitor" && (
                          <span className="rounded bg-orange-500/10 text-orange-400 px-1.5 py-0.5 text-[8.5px] font-bold tracking-wide border border-orange-500/20 uppercase shrink-0">
                            Competitor
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Citation Rate */}
                    <td className="py-3 px-3">
                      <CitationRateCircle pct={row.citationRate} />
                    </td>

                    {/* URLs Count */}
                    <td className="py-3 px-3 text-right text-white/70 font-semibold">{row.uniqueUrls}</td>

                    {/* Total Citations */}
                    <td className="py-3 px-3 text-right text-white/80 font-bold">{row.totalCitations}</td>

                    {/* Models Matrix */}
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        row.chatgptCount > 0 ? "bg-orange-500/10 text-orange-400" : "text-white/20"
                      }`}>
                        {row.chatgptCount || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        row.geminiCount > 0 ? "bg-blue-500/10 text-blue-400" : "text-white/20"
                      }`}>
                        {row.geminiCount || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        row.claudeCount > 0 ? "bg-amber-500/10 text-amber-400" : "text-white/20"
                      }`}>
                        {row.claudeCount || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        row.perplexityCount > 0 ? "bg-teal-500/10 text-teal-400" : "text-white/20"
                      }`}>
                        {row.perplexityCount || "—"}
                      </span>
                    </td>

                    {/* Brand Builder */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex rounded px-2 py-0.5 text-[9.5px] font-bold ${
                        row.brandBuilder
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-white/[0.04] text-white/30"
                      }`}>
                        {row.brandBuilder ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
