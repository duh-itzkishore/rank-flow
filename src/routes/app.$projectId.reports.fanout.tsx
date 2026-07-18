import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LayoutDashboard, ChevronRight, GitMerge, Search, Filter } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$projectId/reports/fanout")({
  component: FanoutReport,
});

const MODEL_COLORS: Record<string, string> = {
  chatgpt: "#10a37f", gemini: "#4285f4", claude: "#c85a2a", perplexity: "#7c3aed",
};

// Simple heuristic to extract list items or bullet points from markdown response
function extractSubQueries(text: string, brand: string): { text: string; hasBrand: boolean }[] {
  if (!text) return [];
  const lines = text.split('\\n');
  const items: { text: string; hasBrand: boolean }[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Look for markdown lists: "- ", "* ", "1. "
    if (trimmed.match(/^[-*]\\s+/) || trimmed.match(/^\\d+\\.\\s+/)) {
      const cleanText = trimmed.replace(/^[-*]\\s+/, '').replace(/^\\d+\\.\\s+/, '').replace(/\\*\\*/g, '');
      if (cleanText.length > 10 && cleanText.length < 150) {
        const hasBrand = cleanText.toLowerCase().includes(brand.toLowerCase());
        items.push({ text: cleanText, hasBrand });
      }
    }
  }
  
  // Fallback if no lists found: split by sentences
  if (items.length === 0) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    sentences.slice(0, 5).forEach(s => {
      const clean = s.trim();
      if (clean.length > 20) {
        items.push({ text: clean, hasBrand: clean.toLowerCase().includes(brand.toLowerCase()) });
      }
    });
  }
  
  return items.slice(0, 6); // Max 6 sub-queries to keep UI clean
}

function FanoutReport() {
  const { projectId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [projectBrand, setProjectBrand] = useState("");
  const [prompts, setPrompts] = useState<any[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: project } = await supabase
        .from("projects")
        .select("brand")
        .eq("id", projectId)
        .single();
        
      const brand = project?.brand || "";
      setProjectBrand(brand);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
      
      const { data: dbPrompts, error } = await supabase
        .from("prompts")
        .select(`
          id, text,
          prompt_runs (
            id, model, response_text, is_mentioned, created_at
          )
        `)
        .eq("project_id", projectId)
        .gte("prompt_runs.created_at", thirtyDaysAgo);

      if (error) throw error;
      
      const validPrompts = (dbPrompts || []).filter(p => p.prompt_runs && p.prompt_runs.length > 0);
      setPrompts(validPrompts);
      if (validPrompts.length > 0) {
        setSelectedPromptId(validPrompts[0].id);
      }
      
    } catch (err: any) {
      toast.error("Failed to load fan out data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/50 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Processing query expansions...
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 grid place-items-center mx-auto mb-5">
          <GitMerge className="w-7 h-7 text-indigo-400" />
        </div>
        <h3 className="text-white font-medium">No Prompts Analyzed</h3>
        <p className="text-white/50 text-sm mt-2">
          Run some prompt tracking to see how AI models expand your queries.
        </p>
      </div>
    );
  }

  const activePrompt = prompts.find(p => p.id === selectedPromptId);
  const filteredRuns = activePrompt?.prompt_runs?.filter((r: any) => selectedModel === "all" || r.model === selectedModel) || [];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            Query Fan Out
          </h1>
          <p className="mt-1 text-sm text-white/40">Visualize how AI models break down your prompts into sub-queries and topics.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Col: Prompt Selection */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
              <Search className="w-4 h-4" /> Select Base Prompt
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {prompts.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPromptId(p.id)}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-all ${
                    selectedPromptId === p.id 
                      ? "bg-indigo-600/20 border border-indigo-500/30 text-white" 
                      : "bg-white/[0.02] border border-white/5 text-white/60 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="line-clamp-2">{p.text}</div>
                  <div className="text-[10px] text-white/40 mt-2 flex gap-2">
                    <span>{p.prompt_runs.length} runs</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Fan Out Visualization */}
        <div className="w-full lg:w-2/3">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 min-h-[600px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-medium text-white/70">Expansion Graph</h3>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-white/40" />
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent text-sm text-white/80 border-none outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="all" className="bg-[#1a1a1c]">All Models</option>
                  {Object.keys(MODEL_COLORS).map(m => (
                    <option key={m} value={m} className="bg-[#1a1a1c]">{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredRuns.length === 0 ? (
              <div className="text-center py-20 text-white/40 text-sm">No data for this model.</div>
            ) : (
              <div className="space-y-12">
                {filteredRuns.map((run: any) => {
                  const subQueries = extractSubQueries(run.response_text, projectBrand);
                  return (
                    <div key={run.id} className="relative">
                      {/* Model Badge */}
                      <div className="absolute -left-3 top-0 bottom-0 w-0.5" style={{ backgroundColor: MODEL_COLORS[run.model] || '#888' }} />
                      
                      <div className="pl-4">
                        <div className="flex items-center gap-2 mb-4">
                          <span 
                            className="text-xs uppercase font-bold px-2 py-1 rounded"
                            style={{ backgroundColor: `${MODEL_COLORS[run.model] || '#888'}20`, color: MODEL_COLORS[run.model] || '#888' }}
                          >
                            {run.model}
                          </span>
                          <span className="text-xs text-white/30">{new Date(run.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-6 md:items-stretch">
                          {/* Parent Node */}
                          <div className="md:w-1/3 flex items-center">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/80 shadow-lg w-full relative z-10">
                              {activePrompt?.text}
                            </div>
                          </div>
                          
                          {/* Connector lines (CSS magic for desktop) */}
                          <div className="hidden md:flex w-12 items-center justify-center relative">
                            <GitMerge className="w-5 h-5 text-white/20 rotate-90" />
                          </div>

                          {/* Child Nodes */}
                          <div className="md:w-2/3 flex flex-col gap-3">
                            {subQueries.length > 0 ? (
                              subQueries.map((sq, idx) => (
                                <div 
                                  key={idx} 
                                  className={`rounded-lg p-3 text-sm border flex items-start gap-3 transition-colors ${
                                    sq.hasBrand 
                                      ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-100" 
                                      : "bg-white/[0.02] border-white/5 text-white/60"
                                  }`}
                                >
                                  <ChevronRight className={`w-4 h-4 shrink-0 mt-0.5 ${sq.hasBrand ? "text-indigo-400" : "text-white/20"}`} />
                                  <div>{sq.text}</div>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-white/30 italic p-2">Could not extract distinct sub-queries.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
