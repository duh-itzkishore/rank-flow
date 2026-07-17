import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2, Plus, Check, Search, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$projectId/tools/research")({
  component: PromptResearch,
});

function PromptResearch() {
  const { projectId } = useParams({ from: "/app/$projectId/tools/research" });
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [trackedPrompts, setTrackedPrompts] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId })
      });
      const data = await res.json();
      if (data.success) {
        setPrompts(data.prompts);
        toast.success("Generated new prompt ideas!");
      } else {
        toast.error(data.error || "Failed to generate prompts");
      }
    } catch (err: any) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (promptText: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        return;
      }
      
      const { error } = await supabase
        .from("prompts")
        .insert({
          text: promptText,
          project_id: projectId,
          user_id: user.id,
          status: "active"
        });
      
      if (error) throw error;
      
      setTrackedPrompts(prev => {
        const next = new Set(prev);
        next.add(promptText);
        return next;
      });
      toast.success("Added to tracked prompts!");
    } catch (err: any) {
      toast.error(err.message || "Failed to track prompt");
    }
  };

  const filtered = prompts.filter(p => p.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            Prompt Research <Sparkles className="w-4 h-4 text-amber-400" />
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Discover what people are asking AI about your brand and industry.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Ideas
        </button>
      </div>

      {prompts.length > 0 ? (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter ideas..."
                className="h-9 rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/40 w-64"
              />
            </div>
            <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.07] transition-colors">
              <Download className="w-3.5 h-3.5" /> Export List
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((p, idx) => {
              const isTracked = trackedPrompts.has(p);
              return (
                <div key={idx} className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors">
                  <p className="text-sm text-white/80 leading-snug pt-0.5">{p}</p>
                  <button
                    onClick={() => handleTrack(p)}
                    disabled={isTracked}
                    className={`shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                      isTracked 
                        ? "bg-emerald-500/15 text-emerald-400" 
                        : "bg-white/[0.06] text-white hover:bg-white/10"
                    }`}
                  >
                    {isTracked ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {isTracked ? "Tracked" : "Track"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-16 text-center">
          <Sparkles className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-white mb-2">No research generated yet</h3>
          <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed mb-6">
            Click "Generate Ideas" to let our AI analyze your brand and industry to suggest high-impact prompts you should be tracking for brand visibility.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Prompt Ideas
          </button>
        </div>
      )}
    </div>
  );
}
