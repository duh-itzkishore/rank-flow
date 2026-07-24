import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutGrid, Plus, Loader2, CheckSquare, Square, Trash, Check } from "lucide-react";
import { toast } from "sonner";

interface ContentArchitectureProps {
  projectId: string;
}

export function ContentArchitecture({ projectId }: ContentArchitectureProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // New Page State
  const [title, setTitle] = useState("");
  const [action, setAction] = useState("");
  const [type, setType] = useState("page_analysis");
  const [impact, setImpact] = useState("medium");

  useEffect(() => {
    if (projectId) {
      fetchSuggestions();
    }
  }, [projectId]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("content_suggestions")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load content architecture");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !action.trim()) {
      toast.error("Title and Action/Description are required");
      return;
    }

    setAdding(true);
    try {
      const { error } = await (supabase as any)
        .from("content_suggestions")
        .insert({
          project_id: projectId,
          title: title.trim(),
          action: action.trim(),
          suggestion_type: type,
          impact: impact,
          is_implemented: false
        });

      if (error) throw error;

      toast.success("Page added to content architecture!");
      setTitle("");
      setAction("");
      fetchSuggestions();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add page");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleImplement = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from("content_suggestions")
        .update({ is_implemented: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      
      setSuggestions(suggestions.map(s => s.id === id ? { ...s, is_implemented: !currentStatus } : s));
      toast.success(currentStatus ? "Page marked as planned" : "Page marked as implemented!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = supabase ? await (supabase as any).from("content_suggestions").delete().eq("id", id) : { error: new Error() };
      if (error) throw error;
      setSuggestions(suggestions.filter(s => s.id !== id));
      toast.success("Page plan deleted");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete page suggestion");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Add Page Planner Form */}
      <div className="lg:col-span-1 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 h-fit">
        <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-indigo-400" />
          Plan New Page
        </h2>
        <p className="text-xs text-white/40 mb-6">
          Map keywords and GEO prompt questions to specific new page templates.
        </p>

        <form onSubmit={handleAddPage} className="space-y-4">
          <div>
            <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Page Title</label>
            <input
              type="text"
              placeholder="e.g. Decentralized Robotics Guide"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">GEO Target / Action</label>
            <textarea
              placeholder="e.g. Target GEO Prompt: 'How does decentralized robotics work?' Include a detailed comparison table."
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors h-24 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Page Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40"
              >
                <option value="page_analysis" className="bg-[#1a1a1c]">Page Analysis</option>
                <option value="missing_entity" className="bg-[#1a1a1c]">Missing Entity</option>
                <option value="schema_optimization" className="bg-[#1a1a1c]">Schema Opt</option>
                <option value="content_gap" className="bg-[#1a1a1c]">Content Gap</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Impact</label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40"
              >
                <option value="high" className="bg-[#1a1a1c]">High</option>
                <option value="medium" className="bg-[#1a1a1c]">Medium</option>
                <option value="low" className="bg-[#1a1a1c]">Low</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={adding}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add to Architecture
          </button>
        </form>
      </div>

      {/* Pages List */}
      <div className="lg:col-span-2 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
        <h2 className="text-base font-semibold text-white mb-4">Planned Content Architecture</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/40 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            Loading planned pages…
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-20 text-white/40 text-xs">
            No pages planned for this project yet. Use the form on the left to plan a page.
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 flex justify-between items-start gap-4 transition-colors ${
                  item.is_implemented
                    ? "bg-white/[0.01] border-white/5 opacity-55"
                    : "bg-[#18181a] border-white/[0.06] hover:bg-white/[0.01]"
                }`}
              >
                <button
                  onClick={() => handleToggleImplement(item.id, item.is_implemented)}
                  className="shrink-0 mt-0.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {item.is_implemented ? (
                    <CheckSquare className="w-5 h-5 text-indigo-500" />
                  ) : (
                    <Square className="w-5 h-5 text-white/20" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-semibold text-white ${item.is_implemented ? "line-through text-white/40" : ""}`}>
                      {item.title}
                    </h4>
                    <span className="text-[9px] uppercase font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded">
                      {item.suggestion_type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">{item.action}</p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                    item.impact === "high" ? "bg-red-500/10 text-red-400" :
                    item.impact === "medium" ? "bg-amber-500/10 text-amber-400" :
                    "bg-white/5 text-white/40"
                  }`}>
                    {item.impact} Impact
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-white/20 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
