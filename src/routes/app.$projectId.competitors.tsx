import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Plus, Loader2, X, Target, ChevronDown, Zap, ExternalLink, Trash2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$projectId/competitors")({
  component: Competitors,
});

type Competitor = {
  id: string;
  name: string;
  domain: string | null;
  project_id: string;
  mention_count: number;
  mentioned_in_run_ids: string[];
  sample_citations: { title: string; url: string }[];
};

function generatePlaybook(competitor: Competitor, brandName: string) {
  return [
    {
      step: 1,
      title: "Identify Citation Sources",
      action: `Audit the URLs where ${competitor.name} is cited. Look for G2, Capterra, Reddit threads, and listicle blog posts that mention them. These are the exact domains you need to target.`,
      icon: "🔍",
    },
    {
      step: 2,
      title: "Content Gap Brief",
      action: `Analyze ${competitor.name}'s top cited pages vs your ${brandName} landing page. Identify missing semantic entities (e.g., SOC2, pricing tables, FAQs, case studies) and add them to your content.`,
      icon: "📝",
    },
    {
      step: 3,
      title: "Surround-Sound PR",
      action: `Secure a mention or review on the 3–5 third-party domains where ${competitor.name} dominates. Reach out to those editorial sites with a guest post, comparison article, or product review pitch.`,
      icon: "📡",
    },
    {
      step: 4,
      title: "Schema Markup",
      action: `Add Organization, Product, and FAQ schema markup to your site. This gives AI models structured data to cite ${brandName} with confidence instead of ${competitor.name}.`,
      icon: "⚙️",
    },
  ];
}

function Competitors() {
  const [activeTab, setActiveTab] = useState<"overview" | "gap" | "sov" | "sentiment">("overview");
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [userId, setUserId] = useState<string | null>(null);

  // Stats / Gap Data states
  const [gapPrompts, setGapPrompts] = useState<any[]>([]);
  const [sovData, setSovData] = useState<any[]>([]);
  const [sentimentData, setSentimentData] = useState<any[]>([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Playbook drawer
  const [playbookComp, setPlaybookComp] = useState<Competitor | null>(null);
  const [playbookBrand, setPlaybookBrand] = useState("");

  useEffect(() => {
    fetchData();
  }, [selectedProject]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Fetch projects
      const { data: projData } = await supabase
        .from("projects")
        .select("id, name, brand")
        .order("name");
      setProjects(projData || []);
      
      const currentProjId = selectedProject === "all" ? (projData?.[0]?.id || "") : selectedProject;
      if (projData && projData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projData[0].id);
      }

      // Fetch competitors
      const compQuery = (supabase as any).from("competitors").select("id, name, domain, project_id");
      if (selectedProject !== "all") {
        compQuery.eq("project_id", selectedProject);
      }
      const { data: compData, error: compErr } = await compQuery.order("created_at", { ascending: false });
      if (compErr) throw compErr;

      // Fetch prompt runs
      const runsQuery = (supabase as any).from("prompt_runs").select("id, response_text, citations, is_mentioned, model, sentiment_score, prompts!inner(text, project_id)");
      if (selectedProject !== "all") {
        runsQuery.eq("prompts.project_id", selectedProject);
      }
      const { data: runs } = await runsQuery;

      // Enrich competitors
      const enriched: Competitor[] = (compData || []).map((c: any) => {
        const matchingRuns = (runs || []).filter((r: any) =>
          r.response_text?.toLowerCase().includes(c.name.toLowerCase())
        );
        const allCitations: { title: string; url: string }[] = [];
        for (const r of matchingRuns) {
          if (Array.isArray(r.citations)) {
            allCitations.push(...(r.citations as any[]).slice(0, 2));
          }
        }
        return {
          id: c.id,
          name: c.name,
          domain: c.domain,
          project_id: c.project_id,
          mention_count: matchingRuns.length,
          mentioned_in_run_ids: matchingRuns.map((r: any) => r.id),
          sample_citations: allCitations.slice(0, 3),
        };
      });
      setCompetitors(enriched);

      // 1. GAP ANALYSIS: Find runs where competitor is mentioned but we are NOT
      const gapList: any[] = [];
      if (runs) {
        runs.forEach((r: any) => {
          if (!r.is_mentioned) {
            // Find which competitors are mentioned in this run
            const mentionedComps = enriched.filter(c => 
              c.project_id === r.prompts?.project_id && 
              r.response_text.toLowerCase().includes(c.name.toLowerCase())
            );
            if (mentionedComps.length > 0) {
              gapList.push({
                promptText: r.prompts?.text,
                competitors: mentionedComps.map(c => c.name).join(", "),
                model: r.model
              });
            }
          }
        });
      }
      setGapPrompts(gapList.slice(0, 10));

      // 2. SOV calculation
      const chartColors = ["#6366f1", "#10a37f", "#4285f4", "#c85a2a", "#7c3aed"];
      const totalRunsCount = runs?.length || 1;
      const sov = enriched.map((c, i) => ({
        name: c.name,
        value: Math.round((c.mention_count / totalRunsCount) * 100),
        color: chartColors[i % chartColors.length]
      }));
      setSovData(sov);

      // 3. Sentiment Comparison (mock/heuristics for comp sentiment based on positive context)
      const sent = enriched.map(c => {
        const compRuns = (runs || []).filter((r: any) => r.response_text.toLowerCase().includes(c.name.toLowerCase()));
        const compAvgSent = compRuns.length > 0
          ? compRuns.reduce((acc: any, r: any) => acc + (r.sentiment_score || 0), 0) / compRuns.length
          : 0;
        
        // Find our brand sentiment in same project runs
        const ourRuns = (runs || []).filter((r: any) => r.is_mentioned);
        const ourAvgSent = ourRuns.length > 0
          ? ourRuns.reduce((acc: any, r: any) => acc + (r.sentiment_score || 0), 0) / ourRuns.length
          : 0;

        return {
          name: c.name,
          competitorSentiment: parseFloat(compAvgSent.toFixed(2)),
          ourSentiment: parseFloat(ourAvgSent.toFixed(2))
        };
      });
      setSentimentData(sent);

    } catch (err: any) {
      toast.error("Failed to load competitor data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedProjectId || !userId) return;
    try {
      setSubmitting(true);
      const { error } = await (supabase as any).from("competitors").insert({
        name: name.trim(),
        domain: domain.trim() || null,
        project_id: selectedProjectId,
        user_id: userId,
      });
      if (error) throw error;
      toast.success("Competitor added!");
      setName(""); setDomain("");
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from("competitors").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removed"); fetchData(); }
  };

  const openPlaybook = (comp: Competitor) => {
    const proj = projects.find((p) => p.id === comp.project_id);
    setPlaybookBrand(proj?.brand || "Your Brand");
    setPlaybookComp(comp);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Competitor Intelligence</h1>
          <p className="mt-1 text-sm text-white/40">Track competitor visibility, spot gaps, and customize dislodgement playbooks</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="appearance-none rounded-lg bg-white/[0.04] border border-white/5 pl-3 pr-8 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
            >
              <option value="all" className="bg-[#1e1e21]">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#1e1e21]">{p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
          <button
            onClick={() => {
              if (projects.length === 0) { toast.error("Create a project first"); return; }
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Competitor
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {[
          { key: "overview", label: "Overview" },
          { key: "gap", label: "Gap Analysis" },
          { key: "sov", label: "Share of Voice (SOV)" },
          { key: "sentiment", label: "Sentiment Comparison" }
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === t.key 
                ? "border-indigo-500 text-white" 
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Loading competitor intelligence…
        </div>
      ) : (
        <>
          {activeTab === "overview" && (
            <div className="space-y-6">
              {competitors.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
                  <Target className="w-10 h-10 text-white/20 mx-auto mb-4" />
                  <h3 className="text-sm font-semibold text-white">No competitors tracked</h3>
                  <p className="mt-1 text-xs text-white/45 max-w-xs mx-auto leading-relaxed">
                    Add competitors to benchmark your AI visibility and get automated dislodgement strategies.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {competitors.map((c) => {
                    const proj = projects.find((p) => p.id === c.project_id);
                    return (
                      <div key={c.id} className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-5 hover:bg-white/[0.05] transition-colors group">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-sm font-semibold text-white">{c.name}</div>
                            {c.domain && (
                              <a
                                href={`https://${c.domain}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-white/30 hover:text-indigo-400 transition-colors flex items-center gap-1 mt-0.5"
                              >
                                {c.domain} <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {proj && <div className="text-[10px] text-indigo-400/70 mt-0.5">{proj.name}</div>}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="p-1 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                          <div>
                            <div className="text-xl font-bold text-white">{c.mention_count}</div>
                            <div className="text-[9px] text-white/30 uppercase tracking-wider">AI Mentions Detected</div>
                          </div>
                        </div>

                        <button
                          onClick={() => openPlaybook(c)}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/15 transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Dislodgement Playbook
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "gap" && (
            <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 space-y-4">
              <h2 className="text-base font-semibold text-white">Competitor Visibility Gaps</h2>
              <p className="text-xs text-white/35">These are prompts where competitors are featured but your brand is currently absent.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 pb-2">
                      <th className="py-2">Prompt</th>
                      <th className="py-2">Featured Competitor(s)</th>
                      <th className="py-2">AI Engine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {gapPrompts.map((g, i) => (
                      <tr key={i} className="text-white/70">
                        <td className="py-3 font-medium text-indigo-400">{g.promptText}</td>
                        <td className="py-3">{g.competitors}</td>
                        <td className="py-3 capitalize">{g.model}</td>
                      </tr>
                    ))}
                    {gapPrompts.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-white/30">No visibility gaps detected. Good job!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "sov" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">Share of Voice %</h2>
                  <p className="text-xs text-white/35 mt-0.5">Competitor share of total AI mentions across all prompt scans</p>
                </div>
                <div className="h-56 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sovData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} stroke="none">
                        {sovData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-2 mt-4">
                  {sovData.map((s, idx) => (
                    <li key={idx} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-white/60">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />{s.name}
                      </span>
                      <span className="font-bold text-white">{s.value}% SOV</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
                <h2 className="text-base font-semibold text-white">Quick Summary</h2>
                <p className="text-xs text-white/35 mt-1 leading-relaxed">
                  Share of Voice is key to understanding brand visibility inside LLM search crawlers. Optimize content to mention your brand as a preferred choice for the competitor's high-ranking domains.
                </p>
              </div>
            </div>
          )}

          {activeTab === "sentiment" && (
            <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 space-y-4">
              <h2 className="text-base font-semibold text-white">Sentiment Benchmark</h2>
              <p className="text-xs text-white/35">Benchmark brand sentiment against competitor mentions (-1 to +1 scale).</p>
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sentimentData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
                    <Legend />
                    <Bar dataKey="ourSentiment" name="Our Sentiment" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="competitorSentiment" name="Competitor Sentiment" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Dislodgement Playbook Drawer ────── */}
      {playbookComp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#141416] border-l border-white/10 h-full p-6 shadow-2xl overflow-y-auto flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h2 className="text-base font-semibold text-white">Dislodgement Playbook</h2>
                </div>
                <p className="text-xs text-white/40 mt-0.5">
                  How to replace <span className="text-red-400 font-semibold">{playbookComp.name}</span> in AI citations
                </p>
              </div>
              <button
                onClick={() => setPlaybookComp(null)}
                className="text-white/40 hover:text-white/70 transition-colors p-1 rounded-lg bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Competitor stats */}
            <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4">
              <div className="text-xs text-red-400 font-semibold mb-2 uppercase tracking-wider">Competitor Intel</div>
              <div className="text-2xl font-bold text-white">{playbookComp.mention_count}×</div>
              <div className="text-[10px] text-white/30 mt-0.5 uppercase tracking-wider">Detected in AI responses</div>
              {playbookComp.sample_citations.length > 0 && (
                <div className="mt-3">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Known citation sources:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {playbookComp.sample_citations.map((c, i) => (
                      <a
                        key={i}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-red-400/80 bg-red-500/5 border border-red-500/15 px-2 py-0.5 rounded-full hover:text-red-300 transition-colors"
                      >
                        {c.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Playbook Steps */}
            <div>
              <div className="text-[10px] text-amber-400 uppercase tracking-wider font-bold mb-3">
                4-Step Action Plan to Steal This Citation
              </div>
              <div className="space-y-3">
                {generatePlaybook(playbookComp, playbookBrand).map((step) => (
                  <div key={step.step} className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{step.icon}</span>
                      <span className="text-xs font-bold text-white">{step.title}</span>
                      <span className="ml-auto text-[9px] font-bold text-white/20 bg-white/5 px-1.5 py-0.5 rounded-full">
                        STEP {step.step}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">{step.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Competitor Modal ────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#1e1e21] border border-white/5 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-base font-semibold text-white mb-4">Track Competitor</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#1e1e21]">{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Competitor Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Otterly AI"
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Domain (Optional)</label>
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. otterly.ai"
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg bg-white/5 text-white/60 ring-1 ring-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Add Competitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
