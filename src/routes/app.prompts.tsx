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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUserAndData();
  }, []);

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

        // Fetch prompts
        const { data: promptsData, error: promptsErr } = await supabase
          .from("prompts")
          .select(`
            id,
            text,
            status,
            project_id,
            created_at,
            projects (
              name
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
      const { error } = await supabase
        .from("prompts")
        .insert({
          text: text.trim(),
          project_id: selectedProjectId,
          status,
          user_id: userId,
        });

      if (error) throw error;

      toast.success("Prompt tracked successfully!");
      setIsModalOpen(false);
      setText("");
      fetchUserAndData(); // Refresh list
    } catch (err: any) {
      console.error("Error creating prompt:", err);
      toast.error(err.message || "Failed to save prompt");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to compute a mock mention count for database entries
  const getPromptMentions = (p: any) => {
    let sum = 0;
    for (let i = 0; i < p.id.length; i++) {
      sum += p.id.charCodeAt(i);
    }
    return 10 + (sum % 190); // 10 to 200
  };

  // Helper to compute a mock avg rank for database entries
  const getPromptRank = (p: any) => {
    let sum = 0;
    for (let i = 0; i < p.id.length; i++) {
      sum += p.id.charCodeAt(i);
    }
    return (1.2 + (sum % 38) / 10).toFixed(1); // 1.2 to 4.9
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
                <th className="text-left px-6 py-3">Models</th>
                <th className="text-left px-6 py-3">Mentions</th>
                <th className="text-left px-6 py-3">Avg Rank</th>
                <th className="text-left px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((p) => {
                const projectObj: any = p.projects;
                const projectName = projectObj ? projectObj.name : "Unlinked";
                const mentions = getPromptMentions(p);
                const rank = getPromptRank(p);

                return (
                  <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white/80">{p.text}</td>
                    <td className="px-6 py-4 text-sm text-indigo-400 font-semibold">{projectName}</td>
                    <td className="px-6 py-4 text-sm text-white/50">4</td>
                    <td className="px-6 py-4 text-sm text-white/50">{mentions}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-white/70">#{rank}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background: p.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
                          color: p.status === "active" ? "#22c55e" : "#f59e0b",
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.status === "active" ? "#22c55e" : "#f59e0b" }} />
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
