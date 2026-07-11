import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Plus, Loader2, X, Target, ChevronDown, Zap, ExternalLink, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/competitors")({
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

// Dislodgement playbook steps based on competitor name
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
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [userId, setUserId] = useState<string | null>(null);

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
  }, []);

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
      if (projData && projData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projData[0].id);
      }

      // Fetch competitors
      const { data: compData, error: compErr } = await (supabase as any)
        .from("competitors")
        .select("id, name, domain, project_id")
        .order("created_at", { ascending: false });
      if (compErr) throw compErr;

      // Fetch all prompt_runs to count competitor mentions in response text
      const { data: runs } = await supabase
        .from("prompt_runs")
        .select("id, response_text, citations");

      // For each competitor, count how many runs mention their name
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
    } catch (err: any) {
      toast.error("Failed to load competitors: " + err.message);
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

  const filtered = selectedProject === "all"
    ? competitors
    : competitors.filter((c) => c.project_id === selectedProject);

  // Sort by mention count desc for chart
  const chartData = [...filtered]
    .sort((a, b) => b.mention_count - a.mention_count)
    .slice(0, 8)
    .map((c) => ({ name: c.name, mentions: c.mention_count }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Competitors</h1>
          <p className="mt-1 text-sm text-white/40">Track rivals · Get dislodgement playbooks to steal their AI citations</p>
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

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Loading competitors…
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
              <Target className="w-10 h-10 text-white/20 mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-white">No competitors tracked</h3>
              <p className="mt-1 text-xs text-white/45 max-w-xs mx-auto leading-relaxed">
                Add competitors to benchmark your AI visibility and get automated dislodgement strategies.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Competitor
              </button>
            </div>
          ) : (
            <>
              {/* Competitor Cards Grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => {
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
                        <div className="ml-auto">
                          {c.mention_count > 0 ? (
                            <TrendingUp className="w-5 h-5 text-red-400" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-white/20" />
                          )}
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

              {/* Comparison Chart */}
              {chartData.some((d) => d.mentions > 0) && (
                <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
                  <h2 className="text-base font-semibold text-white mb-1">AI Mention Frequency</h2>
                  <p className="text-xs text-white/35 mb-4">How often each competitor appears in AI responses across your prompt scans</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
                        <Bar dataKey="mentions" name="AI Mentions" radius={[4, 4, 0, 0]}>
                          {chartData.map((_, i) => (
                            <Cell key={i} fill={i === 0 ? "#ef4444" : "rgba(255,255,255,0.08)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
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
