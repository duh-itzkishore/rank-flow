import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Filter, Loader2, X, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/prompts")({
  component: Prompts,
});

function Prompts() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [text, setText] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [status, setStatus] = useState("active");
  const [parentPromptId, setParentPromptId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState("manual");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUserAndData();
  }, []);



  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("User session not found.");
      return;
    }
    if (!text.trim()) {
      toast.error("Prompt text is required.");
      return;
    }
    if (!selectedProjectId) {
      toast.error("Please select a project first.");
      return;
    }

    try {
      setSubmitting(true);
      const { data: newPrompt, error } = await (supabase as any)
        .from("prompts")
        .insert({
          text: text.trim(),
          project_id: selectedProjectId,
          parent_prompt_id: parentPromptId,
          status,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;

      if (frequency !== "manual" && newPrompt) {
        const intervalDays = frequency === "daily" ? 1 : 7;
        const nextRun = new Date(Date.now() + intervalDays * 86400 * 1000).toISOString();

        await (supabase as any)
          .from("prompt_schedules")
          .insert({
            prompt_id: newPrompt.id,
            user_id: userId,
            frequency,
            next_run_at: nextRun
          });
      }

      toast.success("Prompt tracked successfully!");
      setIsModalOpen(false);
      setText("");
      setParentPromptId(null);
      setFrequency("manual");
      fetchUserAndData(); // Refresh list
    } catch (err: any) {
      console.error("Error creating prompt:", err);
      toast.error(err.message || "Failed to save prompt");
    } finally {
      setSubmitting(false);
    }
  };

  // Live audit execution
  const [auditingPromptId, setAuditingPromptId] = useState<string | null>(null);
  const [selectedPromptRuns, setSelectedPromptRuns] = useState<any[] | null>(null);
  const [activePromptText, setActivePromptText] = useState<string>("");

  const runPromptAudit = async (promptId: string) => {
    try {
      setAuditingPromptId(promptId);
      const res = await fetch("/api/prompt-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("AI search visibility audit completed!");
        fetchUserAndData();
      } else {
        toast.error(data.error || "Failed to audit prompt");
      }
    } catch (err: any) {
      toast.error(String(err));
    } finally {
      setAuditingPromptId(null);
    }
  };

  const loadPromptRuns = async (promptId: string, promptText: string) => {
    try {
      setActivePromptText(promptText);
      const { data, error } = await supabase
        .from("prompt_runs")
        .select("*")
        .eq("prompt_id", promptId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSelectedPromptRuns(data || []);
    } catch (err: any) {
      toast.error("Failed to load audit runs: " + err.message);
    }
  };

  // Fetch prompts with child prompt runs
  const fetchUserAndData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Fetch projects first (needed for the dropdown)
        const { data: projectsData, error: projErr } = await supabase
          .from("projects")
          .select("id, name, brand")
          .order("name");
        
        if (projErr) throw projErr;
        setProjects(projectsData || []);
        if (projectsData && projectsData.length > 0) {
          setSelectedProjectId(projectsData[0].id);
        }

        // Fetch prompts with child prompt runs
        const { data: promptsData, error: promptsErr } = await supabase
          .from("prompts")
          .select(`
            id,
            text,
            status,
            project_id,
            parent_prompt_id,
            created_at,
            projects (
              name
            ),
            prompt_runs (
              id,
              model,
              is_mentioned,
              rank
            )
          `)
          .order("created_at", { ascending: false });

        if (promptsErr) throw promptsErr;
        setPrompts(promptsData || []);
      }
    } catch (err: any) {
      console.error("Error loading prompts:", err);
      toast.error(err.message || "Failed to load prompts");
    } finally {
      setLoading(false);
    }
  };

  // Helper to compute a mention count for database entries
  const getPromptMentions = (p: any) => {
    const runs = p.prompt_runs || [];
    if (runs.length === 0) return 0;
    const mentions = runs.filter((r: any) => r.is_mentioned).length;
    return `${mentions}/${runs.length}`;
  };

  // Helper to compute avg rank
  const getPromptRank = (p: any) => {
    const runs = p.prompt_runs || [];
    const mentionedRuns = runs.filter((r: any) => r.is_mentioned && r.rank !== null);
    if (mentionedRuns.length === 0) return "N/A";
    const sum = mentionedRuns.reduce((acc: number, curr: any) => acc + curr.rank, 0);
    return (sum / mentionedRuns.length).toFixed(1);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 relative h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Prompts</h1>
          <p className="mt-1 text-sm text-white/40">Track how AI models respond to prompts about your brand</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 ring-1 ring-white/10 px-3.5 py-2 text-sm font-medium text-white/60 hover:bg-white/10 transition-colors cursor-pointer">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          <button
            onClick={() => {
              if (projects.length === 0) {
                toast.error("Please create a project first before creating a prompt.");
                return;
              }
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Prompt
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Loading prompts from database…
        </div>
      ) : prompts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center max-w-md mx-auto mt-10">
          <AlertCircle className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-white">No prompts found</h3>
          <p className="mt-1 text-xs text-white/45 leading-relaxed">
            Track your first search query prompt. It will be queried regularly across ChatGPT, Gemini, Claude, and Perplexity.
          </p>
          <button
            onClick={() => {
              if (projects.length === 0) {
                toast.error("Please create a project first before creating a prompt.");
                return;
              }
              setIsModalOpen(true);
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Track Prompt
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-white/30 font-semibold">
                <th className="text-left px-6 py-3">Prompt</th>
                <th className="text-left px-6 py-3">Project</th>
                <th className="text-left px-6 py-3">AI Engine Coverage</th>
                <th className="text-left px-6 py-3">Citations (SOV)</th>
                <th className="text-left px-6 py-3">Avg Rank</th>
                <th className="text-left px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((p) => {
                const projectObj: any = p.projects;
                const projectName = projectObj ? projectObj.name : "Unlinked";
                const mentions = getPromptMentions(p);
                const rank = getPromptRank(p);
                const totalRuns = p.prompt_runs?.length || 0;

                return (
                  <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white/90">
                        {p.parent_prompt_id ? (
                          <div className="flex items-center gap-1.5 text-indigo-400">
                            <span className="text-white/30 text-xs">↳</span> {p.text}
                          </div>
                        ) : (
                          <button
                            onClick={() => loadPromptRuns(p.id, p.text)}
                            className="text-left hover:text-indigo-400 font-medium transition-colors text-white cursor-pointer"
                          >
                            {p.text}
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-white/30 mt-1 flex items-center gap-2">
                        {p.parent_prompt_id && (
                          <span className="bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-semibold text-[9px] uppercase tracking-wider">Multi-Turn Follow-up</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-indigo-400 font-semibold">{projectName}</td>
                    <td className="px-6 py-4 text-sm text-white/50">{totalRuns} engines audited</td>
                    <td className="px-6 py-4 text-sm text-white/50">{mentions}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-white/70">
                        {rank === "N/A" ? "N/A" : `#${rank}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => loadPromptRuns(p.id, p.text)}
                          className="text-xs bg-white/5 hover:bg-white/10 text-white/80 px-2.5 py-1.5 rounded-lg ring-1 ring-white/10 transition-colors"
                        >
                          View Citations
                        </button>
                        <button
                          onClick={() => runPromptAudit(p.id)}
                          disabled={auditingPromptId === p.id}
                          className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-2.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"
                        >
                          {auditingPromptId === p.id && <Loader2 className="w-3 h-3 animate-spin" />}
                          Run Audit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Slide-out Citations/Recommendations Drawer ────────────────── */}
      {selectedPromptRuns && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl bg-[#141416] border-l border-white/10 h-full p-6 shadow-2xl overflow-y-auto flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">AI Citations & Content Playbook</h2>
                <p className="text-xs text-white/40 mt-0.5">Audit breakdown for: <span className="text-indigo-400 font-mono">"{activePromptText}"</span></p>
              </div>
              <button
                onClick={() => setSelectedPromptRuns(null)}
                className="text-white/40 hover:text-white/75 transition-colors p-1 rounded-lg bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedPromptRuns.length === 0 ? (
              <div className="text-center py-20 text-white/40 text-sm">
                No visibility scans have been run for this prompt yet. Click "Run Audit" to start scanning.
              </div>
            ) : (
              <div className="space-y-6">
                {selectedPromptRuns.map((run) => (
                  <div key={run.id} className="rounded-xl border border-white/5 bg-white/[0.01] p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold capitalize text-white">{run.model}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            run.is_mentioned
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {run.is_mentioned ? "Cited" : "Not Cited"}
                        </span>
                      </div>
                      {run.is_mentioned && run.rank && (
                        <span className="text-xs bg-white/5 px-2 py-1 rounded-md text-white/75 font-mono">Rank #{run.rank}</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">AI Generated Response Snippet</span>
                      <p className="text-xs text-white/60 bg-black/30 p-3 rounded-lg border border-white/[0.02] leading-relaxed italic">{run.response_text}</p>
                    </div>

                    {/* Cited sources */}
                    {run.citations && run.citations.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Cited Sources</span>
                        <div className="flex flex-wrap gap-2">
                          {run.citations.map((c: any, index: number) => (
                            <a
                              key={index}
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 px-2.5 py-1.5 rounded-lg border border-indigo-500/10 transition-colors"
                            >
                              {c.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations (The "How to Win") */}
                    {run.recommendations && run.recommendations.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] text-amber-400 uppercase tracking-wider font-bold block mb-1">AEO/GEO Content Playbook</span>
                        <div className="space-y-2">
                          {run.recommendations.map((rec: any, idx: number) => (
                            <div key={idx} className="bg-amber-500/[0.02] border border-amber-500/10 rounded-lg p-3 space-y-1">
                              <span className="text-xs font-semibold text-amber-300">{rec.title}</span>
                              <p className="text-xs text-white/50 leading-relaxed">{rec.action}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── New Prompt Modal overlay ────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#1e1e21] border border-white/5 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-base font-semibold text-white mb-4">Track New AI Prompt</h2>
            <form onSubmit={handleCreatePrompt} className="space-y-4">
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Project Campaign</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#1e1e21] text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Prompt Text</label>
                
                {/* Predefined prompt templates */}
                <div className="mb-3">
                  <div className="text-[9px] text-white/20 uppercase tracking-wider font-semibold mb-1">Predefined Templates</div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {[
                      `Best alternatives to ${projects.find((p) => p.id === selectedProjectId)?.brand || "Brand"}`,
                      `How does ${projects.find((p) => p.id === selectedProjectId)?.brand || "Brand"} compare to competitors?`,
                      `What are the reviews and ratings for ${projects.find((p) => p.id === selectedProjectId)?.brand || "Brand"}?`,
                      `Is ${projects.find((p) => p.id === selectedProjectId)?.brand || "Brand"} suitable for enterprise startups?`,
                    ].map((templateText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setText(templateText)}
                        className="text-[9px] bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20 hover:ring-indigo-400/50 rounded-full px-2.5 py-1 text-left transition-all cursor-pointer truncate max-w-full"
                      >
                        {templateText}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. Best CRM software for startups"
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Parent Prompt (Multi-Turn Journey)</label>
                <select
                  value={parentPromptId || ""}
                  onChange={(e) => setParentPromptId(e.target.value || null)}
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                >
                  <option value="" className="bg-[#1e1e21] text-white">None (Start new conversation)</option>
                  {prompts.filter(p => !p.parent_prompt_id).map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#1e1e21] text-white">
                      {p.text}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Audit Schedule</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                >
                  <option value="manual" className="bg-[#1e1e21] text-white">Manual Run Only</option>
                  <option value="daily" className="bg-[#1e1e21] text-white">Daily Auto Run</option>
                  <option value="weekly" className="bg-[#1e1e21] text-white">Weekly Auto Run</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                >
                  <option value="active" className="bg-[#1e1e21] text-white">Active</option>
                  <option value="paused" className="bg-[#1e1e21] text-white">Paused</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg bg-white/5 text-white/60 ring-1 ring-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer flex items-center gap-1.5"
                >
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
