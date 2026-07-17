import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Sparkles, AlertCircle, TrendingUp, CheckCircle, Lightbulb, Globe, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandResearch } from "@/modules/Research & Strategy/BrandResearch";
import { KeywordExplorer } from "@/modules/Research & Strategy/KeywordExplorer";

export const Route = createFileRoute("/app/$projectId/insights")({
  component: AIInsights,
});

function AIInsights() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("insights");

  useEffect(() => {
    async function loadProjects() {
      try {
        const { data } = await supabase.from("projects").select("*").order("name");
        if (data && data.length > 0) {
          setProjects(data);
          setSelectedProjectId(data[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading projects", err);
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadInsights(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadInsights = async (projId: string) => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("ai_insights")
        .select("*")
        .eq("project_id", projId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInsights(data || []);
    } catch (err: any) {
      toast.error("Failed to load insights: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompileInsights = async () => {
    if (!selectedProjectId) return;
    try {
      setCompiling(true);
      const res = await fetch("/api/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Insights successfully generated!");
        loadInsights(selectedProjectId);
      } else {
        toast.error(data.error || "Failed to generate insights");
      }
    } catch (err: any) {
      toast.error("Error generating insights: " + String(err));
    } finally {
      setCompiling(false);
    }
  };

  const handleActionInsight = async (insightId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("ai_insights")
        .update({ is_actioned: true })
        .eq("id", insightId);

      if (error) throw error;
      setInsights(insights.map(i => i.id === insightId ? { ...i, is_actioned: true } : i));
      toast.success("Insight marked as actioned!");
    } catch (err: any) {
      toast.error("Failed to update insight: " + err.message);
    }
  };

  if (projects.length === 0 && !loading) {
    return (
      <div className="text-center py-20 text-white/50">
        Please create a project first before viewing AI Insights.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" /> AI Insights & Research
          </h1>
          <p className="mt-1 text-sm text-white/40">Actionable recommendations, Brand DNA modeling, and Keyword research</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#1a1a1c] text-white">{p.name}</option>
            ))}
          </select>
          {activeTab === "insights" && (
            <button
              onClick={handleCompileInsights}
              disabled={compiling}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {compiling && <Loader2 className="w-4 h-4 animate-spin" />}
              Analyze & Compile
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] p-1 w-fit">
        {[
          { key: "insights", label: "Insights Engine", icon: Lightbulb },
          { key: "brand", label: "Brand DNA Extractor", icon: Globe },
          { key: "keywords", label: "Keyword Explorer", icon: Search },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-indigo-600 text-white"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "insights" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-white/40 text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              Analyzing data points…
            </div>
          ) : insights.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center max-w-md mx-auto">
              <Lightbulb className="w-8 h-8 text-white/20 mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-white">No insights compiled yet</h3>
              <p className="mt-1 text-xs text-white/40">
                Click "Analyze & Compile" to scan recent audit results and generate actionable recommendations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((ins) => {
                const isSummary = ins.insight_type === "summary";
                const isRisk = ins.insight_type === "risk";
                
                return (
                  <div 
                    key={ins.id} 
                    className={`rounded-2xl border p-5 flex items-start gap-4 transition-colors ${
                      ins.is_actioned 
                        ? "bg-white/[0.01] border-white/5 opacity-50" 
                        : isRisk 
                          ? "bg-red-950/10 border-red-900/20" 
                          : isSummary 
                            ? "bg-indigo-950/10 border-indigo-900/20"
                            : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isRisk ? (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      ) : isSummary ? (
                        <TrendingUp className="w-5 h-5 text-indigo-400" />
                      ) : (
                        <Lightbulb className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{ins.title}</h3>
                        {ins.priority && !ins.is_actioned && (
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            ins.priority === "critical" || ins.priority === "high"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-white/5 text-white/40"
                          }`}>
                            {ins.priority}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-white/60 leading-relaxed">{ins.body}</p>
                    </div>
                    {!ins.is_actioned && !isSummary && (
                      <button 
                        onClick={() => handleActionInsight(ins.id)}
                        className="shrink-0 text-xs bg-white/5 hover:bg-white/10 text-white/70 px-3 py-1.5 rounded-lg border border-white/5 font-semibold flex items-center gap-1 transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Actioned
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "brand" && (
        <BrandResearch 
          projectId={selectedProjectId} 
          websiteUrl={projects.find(p => p.id === selectedProjectId)?.website || ""} 
          onGenerationComplete={() => loadInsights(selectedProjectId)}
        />
      )}

      {activeTab === "keywords" && (
        <KeywordExplorer 
          projectId={selectedProjectId} 
        />
      )}
    </div>
  );
}
