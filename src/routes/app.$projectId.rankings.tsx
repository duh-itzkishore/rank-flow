import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, Loader2, RefreshCw, Download, Filter, ChevronDown, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$projectId/rankings")({
  component: Rankings,
});

const MODEL_COLORS: Record<string, string> = {
  chatgpt: "#10a37f",
  gemini: "#4285f4",
  claude: "#c85a2a",
  perplexity: "#7c3aed",
};

const MODEL_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
  perplexity: "Perplexity",
};

// Extract top semantic entities that seem to drive ranking from AI response text
function extractEntities(responseText: string, brandName: string): string[] {
  if (!responseText) return [];
  const entityPatterns = [
    /SOC2?\s*compliance/i,
    /24\/7\s*support/i,
    /enterprise/i,
    /open[- ]source/i,
    /free\s*tier/i,
    /API[s]?\s*integration/i,
    /easy\s*to\s*use/i,
    /budget[- ]friendly/i,
    /startup/i,
    /scalab/i,
    /security/i,
    /Python\s*integration/i,
    /Kubernetes/i,
    /compliance/i,
    /pricing/i,
    /self[- ]hosted/i,
    /cloud/i,
    /real[- ]time/i,
    /automation/i,
    /analytics/i,
  ];
  const found: string[] = [];
  for (const pattern of entityPatterns) {
    const match = responseText.match(pattern);
    if (match) {
      found.push(match[0].replace(/\s+/g, " ").trim());
    }
    if (found.length >= 3) break;
  }
  return found;
}

function rankColor(r: number | null) {
  if (r === 1) return { text: "text-yellow-400", bg: "bg-yellow-400/10", label: "#fbbf24" };
  if (r === 2) return { text: "text-slate-300", bg: "bg-slate-400/10", label: "#94a3b8" };
  if (r === 3) return { text: "text-amber-600", bg: "bg-amber-600/10", label: "#b45309" };
  if (r === null) return { text: "text-white/20", bg: "bg-white/5", label: "rgba(255,255,255,0.2)" };
  return { text: "text-white/50", bg: "bg-white/[0.04]", label: "rgba(255,255,255,0.4)" };
}

type PromptRow = {
  id: string;
  text: string;
  project_name: string;
  brand: string;
  runs: {
    model: string;
    rank: number | null;
    is_mentioned: boolean;
    response_text: string;
    citations: any[];
  }[];
};

function Rankings() {
  const [rows, setRows] = useState<PromptRow[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const MODELS = ["chatgpt", "gemini", "claude", "perplexity"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch projects
      const { data: projData } = await supabase
        .from("projects")
        .select("id, name, brand")
        .order("name");
      setProjects(projData || []);

      // Fetch prompts with latest run per model
      const { data: promptsData, error } = await supabase
        .from("prompts")
        .select(`
          id,
          text,
          projects ( name, brand ),
          prompt_runs (
            id,
            model,
            rank,
            is_mentioned,
            response_text,
            citations,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // For each prompt, get the latest run per model
      const mapped: PromptRow[] = (promptsData || []).map((p: any) => {
        const projectObj = Array.isArray(p.projects) ? p.projects[0] : p.projects;
        const allRuns = p.prompt_runs || [];

        // Latest run per model
        const latestPerModel: Record<string, any> = {};
        for (const model of MODELS) {
          const modelRuns = allRuns
            .filter((r: any) => r.model === model)
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          if (modelRuns.length > 0) latestPerModel[model] = modelRuns[0];
        }

        return {
          id: p.id,
          text: p.text,
          project_name: projectObj?.name || "Unlinked",
          brand: projectObj?.brand || "",
          runs: MODELS.map((model) => latestPerModel[model] || {
            model,
            rank: null,
            is_mentioned: false,
            response_text: "",
            citations: [],
          }),
        };
      });

      setRows(mapped);
    } catch (err: any) {
      toast.error("Failed to load rankings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = selectedProject === "all"
    ? rows
    : rows.filter((r) => {
        const proj = projects.find((p) => p.id === selectedProject);
        return proj && r.project_name === proj.name;
      });

  // Compute share of voice per model across all filtered prompts
  const sovByModel = MODELS.map((model) => {
    const total = filteredRows.length;
    const mentioned = filteredRows.filter((r) =>
      r.runs.find((run) => run.model === model)?.is_mentioned
    ).length;
    return { model, pct: total > 0 ? Math.round((mentioned / total) * 100) : 0 };
  });

  const exportCSV = () => {
    const headers = ["Prompt", "Project", "ChatGPT Rank", "Gemini Rank", "Claude Rank", "Perplexity Rank"];
    const csvRows = filteredRows.map((r) => {
      const getRank = (model: string) => {
        const run = r.runs.find((run) => run.model === model);
        return run?.is_mentioned ? (run.rank ? `#${run.rank}` : "Mentioned") : "—";
      };
      return [
        `"${r.text}"`,
        `"${r.project_name}"`,
        getRank("chatgpt"),
        getRank("gemini"),
        getRank("claude"),
        getRank("perplexity"),
      ].join(",");
    });
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rankflow-rankings.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Rankings</h1>
          <p className="mt-1 text-sm text-white/40">Brand positions across prompts & AI engines · Entity importance scoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 ring-1 ring-white/10 px-3.5 py-2 text-sm font-medium text-white/60 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 ring-1 ring-white/10 px-3.5 py-2 text-sm font-medium text-white/60 hover:bg-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* SoV Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        {sovByModel.map(({ model, pct }) => (
          <div key={model} className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: MODEL_COLORS[model] }} />
              <span className="text-xs font-semibold text-white/60">{MODEL_LABELS[model]}</span>
            </div>
            <div className="text-2xl font-bold text-white">{pct}%</div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">Share of Voice</div>
            <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: MODEL_COLORS[model] }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-white/30" />
        <span className="text-xs text-white/30 font-semibold uppercase tracking-wider">Project:</span>
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
        <span className="ml-auto text-xs text-white/30">{filteredRows.length} prompts</span>
      </div>

      {/* Rankings Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Loading rankings from database…
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
          <Trophy className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-white">No ranking data yet</h3>
          <p className="mt-1 text-xs text-white/45 leading-relaxed max-w-xs mx-auto">
            Go to Prompts and run an audit to see your brand rankings across AI engines.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-white/30 font-semibold">
                <th className="text-left px-6 py-3">Prompt</th>
                {MODELS.map((m) => (
                  <th key={m} className="text-center px-4 py-3">
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: MODEL_COLORS[m] }} />
                      {MODEL_LABELS[m]}
                    </span>
                  </th>
                ))}
                <th className="text-center px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const isExpanded = expandedRow === row.id;
                return (
                  <>
                    <tr
                      key={row.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white/80 max-w-xs truncate">{row.text}</div>
                        <div className="text-[10px] text-white/30 mt-0.5">{row.project_name}</div>
                      </td>

                      {row.runs.map((run) => {
                        const colors = rankColor(run.is_mentioned ? run.rank : null);
                        return (
                          <td key={run.model} className="px-4 py-4 text-center">
                            {run.is_mentioned ? (
                              <span
                                className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm ${colors.bg} ${colors.text} ring-1 ring-white/5`}
                              >
                                {run.rank ? `#${run.rank}` : "✓"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.03] text-white/20 text-xs ring-1 ring-white/5">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}

                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mx-auto transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          Why
                          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Entity Scoring Row */}
                    {isExpanded && (
                      <tr key={`${row.id}-expanded`} className="border-b border-white/5 bg-white/[0.01]">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-3">
                            <div className="text-[10px] text-amber-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3" />
                              Entity Importance Scoring — Why each AI ranked your brand
                            </div>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                              {row.runs.map((run) => {
                                const entities = extractEntities(run.response_text, row.brand);
                                return (
                                  <div
                                    key={run.model}
                                    className="rounded-xl bg-black/20 border border-white/5 p-3 space-y-2"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ background: MODEL_COLORS[run.model] }}
                                      />
                                      <span className="text-[11px] font-semibold text-white/70">
                                        {MODEL_LABELS[run.model]}
                                      </span>
                                    </div>
                                    {run.is_mentioned ? (
                                      entities.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {entities.map((e, i) => (
                                            <span
                                              key={i}
                                              className="text-[9px] bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20 px-1.5 py-0.5 rounded-full"
                                            >
                                              {e}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-[10px] text-white/30 italic">Brand mentioned · entities not detected</p>
                                      )
                                    ) : (
                                      <p className="text-[10px] text-red-400/70 italic">Not cited by this model</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
