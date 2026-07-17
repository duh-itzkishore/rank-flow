import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Plus, Loader2, X, AlertCircle, Search, ChevronDown, Download,
  Columns3, Flag, Tag, Filter, Play, Globe, ArrowUpRight, ArrowDownRight, ArrowLeft, Sparkles,
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$projectId/prompts")({
  component: Prompts,
});

/* ─── Helpers ──────────────────────────────────────────────────────────── */
function MentionRateCircle({ pct }: { pct: number }) {
  const r = 9, circ = 2 * Math.PI * r;
  const fill = circ * (pct / 100);
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="22" height="22" viewBox="0 0 24 24" className="-rotate-90">
        <circle cx="12" cy="12" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" fill="none" />
        <circle
          cx="12" cy="12" r={r}
          stroke={pct >= 80 ? "#6366f1" : pct >= 50 ? "#f59e0b" : "#ef4444"}
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

/* ─── Main component ───────────────────────────────────────────────────── */
function Prompts() {
  const { projectId } = useParams({ from: "/app/$projectId/prompts" });
  const navigate = useNavigate();

  const [prompts, setPrompts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"tracked" | "suggested">("tracked");

  // Suggested Prompts State
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [text, setText] = useState("");
  const [frequency, setFrequency] = useState("manual");
  const [submitting, setSubmitting] = useState(false);

  // Audit
  const [auditingPromptId, setAuditingPromptId] = useState<string | null>(null);

  // Drawer
  const [selectedPrompt, setSelectedPrompt] = useState<any | null>(null);
  const [promptRuns, setPromptRuns] = useState<any[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);

  useEffect(() => { fetchData(); }, [projectId]);

  /* ── Data fetching ─────────────────────────────────────────────────── */
  async function fetchData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: proj } = await (supabase as any)
        .from("projects").select("id,name,brand").order("name");
      setProjects(proj || []);

      const { data: ps } = await (supabase as any)
        .from("prompts")
        .select(`id,text,status,created_at,project_id,
          prompt_runs(id,model,is_mentioned,rank,created_at)`)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      setPrompts(ps || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load prompts");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !text.trim()) return;
    setSubmitting(true);
    try {
      const { data: newP, error } = await (supabase as any)
        .from("prompts")
        .insert({ text: text.trim(), project_id: projectId, status: "active", user_id: userId })
        .select().single();
      if (error) throw error;
      if (frequency !== "manual" && newP) {
        const nextRun = new Date(Date.now() + (frequency === "daily" ? 86400 : 604800) * 1000).toISOString();
        await (supabase as any).from("prompt_schedules")
          .insert({ prompt_id: newP.id, user_id: userId, frequency, next_run_at: nextRun });
      }
      toast.success("Prompt tracked!");
      setIsModalOpen(false);
      setText(""); setFrequency("manual");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save prompt");
    } finally {
      setSubmitting(false);
    }
  }

  async function runAudit(promptId: string) {
    setAuditingPromptId(promptId);
    try {
      const res = await fetch("/api/prompt-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId }),
      });
      const d = await res.json();
      if (d.success) { toast.success("Audit complete!"); fetchData(); }
      else toast.error(d.error || "Audit failed");
    } catch (err: any) {
      toast.error(String(err));
    } finally {
      setAuditingPromptId(null);
    }
  }

  async function openDrawer(prompt: any) {
    setSelectedPrompt(prompt);
    setLoadingRuns(true);
    try {
      const { data } = await supabase.from("prompt_runs")
        .select("*").eq("prompt_id", prompt.id)
        .order("created_at", { ascending: false });
      setPromptRuns(data || []);
    } catch { setPromptRuns([]); }
    finally { setLoadingRuns(false); }
  }

  async function loadSuggestions() {
    if (suggestedPrompts.length > 0) return;
    setLoadingSuggestions(true);
    try {
      const res = await fetch("/api/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuggestedPrompts(data.prompts || []);
      } else {
        toast.error(data.error || "Failed to load suggestions");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  }

  useEffect(() => {
    if (activeTab === "suggested") {
      loadSuggestions();
    }
  }, [activeTab]);

  async function trackSuggestedPrompt(promptText: string) {
    if (!userId) return;
    try {
      const { data: newP, error } = await (supabase as any)
        .from("prompts")
        .insert({ text: promptText, project_id: projectId, status: "active", user_id: userId })
        .select().single();
      if (error) throw error;
      
      toast.success("Prompt tracked!");
      setSuggestedPrompts(prev => prev.filter(p => p !== promptText));
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to track prompt");
    }
  }

  /* ─── Derived values ─────────────────────────────────────────────── */
  function mentionRate(p: any) {
    const runs = p.prompt_runs || [];
    if (!runs.length) return 0;
    return Math.round((runs.filter((r: any) => r.is_mentioned).length / runs.length) * 100);
  }
  function lastMention(p: any) {
    const mentioned = (p.prompt_runs || []).filter((r: any) => r.is_mentioned);
    if (!mentioned.length) return "-";
    const d = new Date(mentioned[0].created_at);
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  }
  function citCount(p: any) {
    const runs = p.prompt_runs || [];
    return runs.filter((r: any) => r.is_mentioned).length;
  }
  function avgRank(p: any) {
    const ranked = (p.prompt_runs || []).filter((r: any) => r.is_mentioned && r.rank);
    if (!ranked.length) return null;
    return (ranked.reduce((s: number, r: any) => s + r.rank, 0) / ranked.length).toFixed(1);
  }

  const filtered = prompts.filter(p =>
    p.text.toLowerCase().includes(search.toLowerCase())
  );

  const project = projects.find(p => p.id === projectId);

  /* ─── Render ─────────────────────────────────────────────────────── */
  if (selectedPrompt) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedPrompt(null)}
              className="rounded-lg bg-white/5 p-2 text-white/40 hover:text-white/70 transition-colors"
              aria-label="Back to prompts"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-white/30">Prompt</span>
                <span className="text-white/20 text-[10px]">#{selectedPrompt.id.slice(0, 6)}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-semibold text-white leading-snug">{selectedPrompt.text}</h2>
                <span className="flex items-center gap-1 cursor-pointer rounded bg-orange-500/10 px-2 py-0.5 text-[9px] font-bold text-orange-400 uppercase tracking-wider border border-orange-500/20">
                  Commercial <ChevronDown className="w-2.5 h-2.5" />
                </span>
                <span className="flex items-center gap-1 cursor-pointer rounded bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold text-indigo-400 uppercase tracking-wider border border-indigo-500/20">
                  Own Brand <ChevronDown className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/15">
              <Sparkles className="w-3.5 h-3.5" /> Create Content
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex items-center gap-3 border-b border-white/[0.07] pb-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              placeholder="Search responses..."
              className="h-8 rounded-lg border border-white/10 bg-white/[0.04] pl-8 pr-3 text-xs text-white placeholder-white/30 outline-none focus:border-indigo-500/40 transition-colors w-52"
            />
          </div>
          <FilterPill label="Last 30 days" />
          <FilterPill label="All Models (4)" />
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-white/[0.07] rounded-xl overflow-hidden border border-white/[0.07]">
          {[
            { label: "Responses", value: String(selectedPrompt.prompt_runs?.length || 0) },
            { label: "Country", value: "🇺🇸 USA" },
            { label: "Language", value: "English" },
            { label: "Last Execution", value: lastMention(selectedPrompt) !== "-" ? lastMention(selectedPrompt) : "17 Jul 2026" },
            { label: "Creation Date", value: new Date(selectedPrompt.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
          ].map(kpi => (
            <div key={kpi.label} className="bg-[#1a1a1c] px-4 py-3.5">
              <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">{kpi.label}</div>
              <div className="text-xs font-semibold text-white/80">{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Sparkline Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Brand Mentions */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col justify-between h-[110px]">
            <div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Brand Mentions</div>
              <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-2">
                {citCount(selectedPrompt)}
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> +1 vs 30 days ago
                </span>
              </div>
            </div>
            <div className="w-full h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[1, 2, 1, 3, 2, 4, 3].map((v, i) => ({ v, i }))}>
                  <defs>
                    <linearGradient id="grad-blue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={1.5} fill="url(#grad-blue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Mention Rate */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col justify-between h-[110px]">
            <div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Mention Rate</div>
              <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-2">
                {mentionRate(selectedPrompt)}%
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                  0.0% vs 30 days ago
                </span>
              </div>
            </div>
            <div className="w-full h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[50, 60, 50, 70, 60, 80, 70].map((v, i) => ({ v, i }))}>
                  <defs>
                    <linearGradient id="grad-green" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} fill="url(#grad-green)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 3: Citations */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col justify-between h-[110px]">
            <div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Citations</div>
              <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-2">
                {citCount(selectedPrompt) * 2}
                <span className="text-[10px] text-red-400 font-semibold flex items-center">
                  <ArrowDownRight className="w-3 h-3" /> -1 vs 30 days ago
                </span>
              </div>
            </div>
            <div className="w-full h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[2, 4, 3, 5, 2, 6, 4].map((v, i) => ({ v, i }))}>
                  <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 4: Position */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col justify-between h-[110px]">
            <div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Position</div>
              <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-2">
                {avgRank(selectedPrompt) || "—"}
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> +0.9 vs 30 days ago
                </span>
              </div>
            </div>
            <div className="w-full h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[3, 2, 2.5, 1.8, 2.2, 1.5, 1.5].map((v, i) => ({ v, i }))}>
                  <Line type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          {/* Tabs */}
          <div className="flex gap-1 px-5 pt-3 border-b border-white/[0.07] bg-white/[0.01]">
            <button className="px-4 py-2 text-xs font-semibold border-b-2 -mb-px border-indigo-500 text-indigo-400 transition-colors">
              Responses
            </button>
            <button className="px-4 py-2 text-xs font-medium border-b-2 border-transparent text-white/40 hover:text-white/70 -mb-px">
              By Page
            </button>
          </div>

          {/* Responses list */}
          {loadingRuns ? (
            <div className="flex items-center justify-center py-12 text-white/30 text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              Loading responses…
            </div>
          ) : promptRuns.length === 0 ? (
            <div className="text-center py-16 text-white/30 text-sm">
              No responses yet. Click <strong className="text-white/50">Run</strong> to audit this prompt.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="text-white/30 font-semibold uppercase tracking-wider text-[9px] border-b border-white/[0.07] bg-white/[0.005]">
                    <th className="text-left py-3 px-4 w-[280px]">Response</th>
                    <th className="text-left py-3 px-3">Model</th>
                    <th className="text-left py-3 px-3">Status</th>
                    <th className="text-left py-3 px-3">Brand Sentiment</th>
                    <th className="text-left py-3 px-3">Mention Position</th>
                    <th className="text-left py-3 px-3">Top Mentions</th>
                    <th className="text-left py-3 px-3">Citation Position</th>
                    <th className="text-left py-3 px-3">Top Citations</th>
                    <th className="text-left py-3 px-3">Execution Date</th>
                  </tr>
                </thead>
                <tbody>
                  {promptRuns.map(run => {
                    // Map model strings to formatted labels + icons
                    const modelMap: Record<string, { label: string, color: string }> = {
                      chatgpt: { label: "ChatGPT", color: "text-orange-400" },
                      claude: { label: "Claude", color: "text-amber-500" },
                      gemini: { label: "Gemini", color: "text-blue-400" },
                      perplexity: { label: "Perplexity", color: "text-teal-400" },
                      groq: { label: "Groq", color: "text-red-400" },
                      openrouter: { label: "OpenRouter", color: "text-indigo-400" },
                    };
                    const modelMeta = modelMap[run.model.toLowerCase()] || { label: run.model, color: "text-white/70" };

                    return (
                      <tr key={run.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 max-w-[280px]">
                          <span className="text-white/80 line-clamp-2 leading-snug">
                            {run.response_text}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium">
                          <span className={`${modelMeta.color} flex items-center gap-1.5`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {modelMeta.label}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            run.is_mentioned
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {run.is_mentioned ? "Success" : "Not Found"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            run.is_mentioned 
                              ? "bg-emerald-500/10 text-emerald-400" 
                              : "bg-white/[0.04] text-white/50"
                          }`}>
                            {run.is_mentioned ? "Very Positive" : "Neutral"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {run.rank ? (
                            <span className="rounded bg-indigo-500/10 text-indigo-400 px-2 py-0.5 text-[9.5px] font-bold border border-indigo-500/20">
                              Position {run.rank}
                            </span>
                          ) : (
                            <span className="text-white/20">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            {run.is_mentioned ? (
                              <>
                                <span className="w-5 h-5 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[8px] font-bold text-white uppercase" title="Nike">N</span>
                                <span className="w-5 h-5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-[8px] text-white/40 uppercase" title="Adidas">A</span>
                                <span className="w-5 h-5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-[8px] text-white/40 uppercase" title="Hoka">H</span>
                              </>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {run.rank ? (
                            <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[9.5px] font-bold border border-emerald-500/20">
                              Position {run.rank + 1}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            {run.is_mentioned ? (
                              <>
                                <span className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[8px] font-bold text-orange-400 uppercase" title="Reddit">R</span>
                                <span className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[8px] font-bold text-blue-400 uppercase" title="Wikipedia">W</span>
                              </>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-white/40 whitespace-nowrap">
                          {new Date(run.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          Prompts
          <span className="text-white/20 text-sm cursor-help" title="Prompts tracked for this project">ⓘ</span>
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Prompts
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        </button>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-white/[0.07]">
        {[
          { key: "tracked", label: "Tracked Prompts" },
          { key: "suggested", label: "Suggested" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-2 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-white/50">
          {filtered.length}
        </span>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Filters
        </span>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="h-8 rounded-lg border border-white/10 bg-white/[0.04] pl-8 pr-3 text-xs text-white placeholder-white/30 outline-none focus:border-indigo-500/40 transition-colors w-52"
          />
        </div>
        <FilterPill label="Last 30 days" />
        <FilterPill label="United States" icon={Globe} />
        <FilterPill label="English" />
        <FilterPill label="Tags" icon={Tag} />
        <FilterPill label="Query Type" />
        <FilterPill label="Brand Focus" />

        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.07] transition-colors">
            <Columns3 className="w-3.5 h-3.5" /> Columns
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.07] transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ── Sub-header ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white/80">
          {activeTab === "tracked" ? "Tracked Prompts" : "Suggested Prompts"}
        </h2>
        <p className="text-xs text-white/40 mt-0.5">
          {activeTab === "tracked" 
            ? "All prompts tracked for your project with visibility and citation metrics"
            : "AI-generated prompts based on your brand to help discover visibility opportunities"}
        </p>
      </div>

      {/* ── Content Area ─────────────────────────────────────────────────────── */}
      {activeTab === "suggested" ? (
        loadingSuggestions ? (
          <div className="flex items-center justify-center py-16 text-white/40 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            Generating AI suggestions…
          </div>
        ) : suggestedPrompts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
            <AlertCircle className="w-10 h-10 text-white/20 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-white">No suggestions available</h3>
            <p className="mt-1 text-xs text-white/40 max-w-sm mx-auto leading-relaxed">
              We couldn't generate new suggestions right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedPrompts.map((suggestion, idx) => (
              <div key={idx} className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white/90 leading-snug">{suggestion}</h3>
                    <p className="text-xs text-white/40 mt-1">High potential for brand visibility discovery.</p>
                  </div>
                </div>
                <button
                  onClick={() => trackSuggestedPrompt(suggestion)}
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Track
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
      /* ── Table ─────────────────────────────────────────────────────── */
      loading ? (
        <div className="flex items-center justify-center py-16 text-white/40 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Loading prompts…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
          <AlertCircle className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-white">No prompts tracked yet</h3>
          <p className="mt-1 text-xs text-white/40 max-w-sm mx-auto leading-relaxed">
            Track your first prompt to monitor how AI models respond to queries about your brand.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Prompt
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.07] text-white/30 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 pl-4 pr-2 w-8">
                  <input type="checkbox" className="accent-indigo-500 w-3.5 h-3.5 cursor-pointer" />
                </th>
                <th className="text-left py-3 px-3">Prompt</th>
                <th className="text-left py-3 px-3">Country</th>
                <th className="text-right py-3 px-3">Responses</th>
                <th className="text-right py-3 px-3">Mentions</th>
                <th className="text-left py-3 px-3">
                  Mention Rate
                  <span className="ml-0.5 cursor-help opacity-60" title="% of responses where your brand was mentioned">ⓘ</span>
                </th>
                <th className="text-left py-3 px-3">Last Mentions</th>
                <th className="text-right py-3 px-3">
                  Citations
                  <span className="ml-0.5 cursor-help opacity-60" title="Total citations across all responses">ⓘ</span>
                </th>
                <th className="text-left py-3 px-3">
                  Mentions Change
                  <span className="ml-0.5 cursor-help opacity-60" title="Change vs previous period">ⓘ</span>
                </th>
                <th className="text-left py-3 px-3">Tags</th>
                <th className="text-left py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const rate = mentionRate(p);
                const cit = citCount(p);
                const rank = avgRank(p);
                const totalRuns = p.prompt_runs?.length || 0;
                const prevRate = Math.max(0, rate - Math.floor(Math.random() * 15));
                const diff = rate - prevRate;

                return (
                  <tr
                    key={p.id}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors cursor-pointer"
                    onClick={() => openDrawer(p)}
                  >
                    <td className="py-3 pl-4 pr-2" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="accent-indigo-500 w-3.5 h-3.5 cursor-pointer" />
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <span className="text-white/80 hover:text-indigo-300 transition-colors leading-snug line-clamp-2">
                        {p.text}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white/50">
                      <span className="flex items-center gap-1.5">
                        <span className="text-base">🇺🇸</span> USA
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-white/60">{totalRuns}</td>
                    <td className="py-3 px-3 text-right text-white/60">{cit}</td>
                    <td className="py-3 px-3">
                      <MentionRateCircle pct={rate} />
                    </td>
                    <td className="py-3 px-3 text-white/40 whitespace-nowrap">{lastMention(p)}</td>
                    <td className="py-3 px-3 text-right text-white/60">{cit}</td>
                    <td className="py-3 px-3">
                      {diff !== 0 && (
                        <span className={`flex items-center gap-0.5 font-semibold text-[11px] ${diff > 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {diff > 0
                            ? <ArrowUpRight className="w-3 h-3" />
                            : <ArrowDownRight className="w-3 h-3" />}
                          {Math.abs(diff)} ({diff > 0 ? "+" : ""}{diff}%)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded-full bg-indigo-500/15 text-indigo-400 px-2 py-0.5 text-[10px] font-semibold">
                        Brand
                      </span>
                    </td>
                    <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => runAudit(p.id)}
                        disabled={auditingPromptId === p.id}
                        className="flex items-center gap-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 disabled:opacity-50 text-white px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
                      >
                        {auditingPromptId === p.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Play className="w-3 h-3" />}
                        Run
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )
      )}


      {/* ── Add Prompt Modal ─────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#1e1e21] border border-white/5 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-base font-semibold text-white mb-1">Track New Prompt</h2>
            <p className="text-xs text-white/40 mb-5">
              This prompt will be queried across ChatGPT, Gemini, Claude and Perplexity.
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">
                  Prompt Text
                </label>
                {/* Quick templates */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    `Best Nike shoe for marathon racing`,
                    `Nike vs Adidas running shoes: which is better?`,
                    `Are Nike running shoes worth the price?`,
                    `Is the Nike Pegasus good for daily running?`,
                  ].map((tpl, i) => (
                    <button key={i} type="button" onClick={() => setText(tpl)}
                      className="text-[9px] bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20 hover:ring-indigo-400/50 rounded-full px-2.5 py-1 transition-all cursor-pointer">
                      {tpl}
                    </button>
                  ))}
                </div>
                <input
                  value={text} onChange={e => setText(e.target.value)}
                  placeholder="e.g. What is the best Nike shoe for marathon racing?"
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">
                  Audit Schedule
                </label>
                <select value={frequency} onChange={e => setFrequency(e.target.value)}
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors">
                  <option value="manual" className="bg-[#1e1e21]">Manual Only</option>
                  <option value="daily" className="bg-[#1e1e21]">Daily Auto-Run</option>
                  <option value="weekly" className="bg-[#1e1e21]">Weekly Auto-Run</option>
                </select>
              </div>
              <div className="pt-1 flex justify-end gap-2.5">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="rounded-lg bg-white/5 text-white/60 ring-1 ring-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer flex items-center gap-1.5">
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Track Prompt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
