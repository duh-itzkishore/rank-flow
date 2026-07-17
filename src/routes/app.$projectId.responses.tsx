import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2, Search, ChevronDown, Download, Columns3, Filter,
  Globe, Tag, ExternalLink, TrendingUp, TrendingDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$projectId/responses")({
  component: Responses,
});

const MODEL_COLORS: Record<string, string> = {
  chatgpt: "#10a37f", gemini: "#4285f4", claude: "#c85a2a",
  perplexity: "#7c3aed", default: "#6366f1",
};

function ModelBadge({ model }: { model: string }) {
  const color = MODEL_COLORS[model.toLowerCase()] || MODEL_COLORS.default;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize"
      style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {model}
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

function Responses() {
  const { projectId } = useParams({ from: "/app/$projectId/responses" });
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [mentionFilter, setMentionFilter] = useState<"all" | "mentioned" | "not">("all");
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => { fetchRuns(); }, [projectId]);

  async function fetchRuns() {
    setLoading(true);
    try {
      // Join prompt_runs → prompts filtered by project_id
      const { data } = await (supabase as any)
        .from("prompt_runs")
        .select(`
          id, model, is_mentioned, rank, response_text,
          created_at, sentiment, citations,
          prompts!inner(id, text, project_id)
        `)
        .eq("prompts.project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(200);
      setRuns(data || []);
    } catch (err: any) {
      toast.error("Failed to load responses: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const models = [...new Set(runs.map(r => r.model))];

  const filtered = runs.filter(r => {
    const matchSearch = r.prompts?.text?.toLowerCase().includes(search.toLowerCase())
      || r.response_text?.toLowerCase().includes(search.toLowerCase());
    const matchModel = modelFilter === "all" || r.model === modelFilter;
    const matchMention = mentionFilter === "all"
      || (mentionFilter === "mentioned" && r.is_mentioned)
      || (mentionFilter === "not" && !r.is_mentioned);
    return matchSearch && matchModel && matchMention;
  });

  const mentionedCount = runs.filter(r => r.is_mentioned).length;
  const mentionRate = runs.length ? Math.round((mentionedCount / runs.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            Responses
            <span className="text-white/20 text-sm cursor-help" title="AI-generated responses for your tracked prompts">ⓘ</span>
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            {runs.length} responses · {mentionedCount} mentions · {mentionRate}% mention rate
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60 hover:bg-white/[0.07] transition-colors">
            <Columns3 className="w-3.5 h-3.5" /> Columns
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60 hover:bg-white/[0.07] transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Responses", value: runs.length },
          { label: "Brand Mentioned", value: mentionedCount },
          { label: "Mention Rate", value: `${mentionRate}%` },
          { label: "AI Models", value: models.length },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">{k.label}</div>
            <div className="text-xl font-bold text-white">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Filters
        </span>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search responses..."
            className="h-8 rounded-lg border border-white/10 bg-white/[0.04] pl-8 pr-3 text-xs text-white placeholder-white/30 outline-none focus:border-indigo-500/40 w-52"
          />
        </div>

        {/* Model filter */}
        <select
          value={modelFilter}
          onChange={e => setModelFilter(e.target.value)}
          className="h-8 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs text-white/60 outline-none focus:border-indigo-500/40"
        >
          <option value="all" className="bg-[#1e1e21]">All Models</option>
          {models.map(m => <option key={m} value={m} className="bg-[#1e1e21] capitalize">{m}</option>)}
        </select>

        {/* Mention filter */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-1">
          {([["all", "All"], ["mentioned", "Mentioned"], ["not", "Not Cited"]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setMentionFilter(val)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                mentionFilter === val
                  ? "bg-indigo-600/80 text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <FilterPill label="Last 30 days" />
        <FilterPill label="United States" icon={Globe} />
        <FilterPill label="Tags" icon={Tag} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/40 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Loading responses…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-16 text-center">
          <p className="text-sm text-white/30">
            {runs.length === 0
              ? "No responses yet. Run an audit from the Prompts page to get started."
              : "No responses match your current filters."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.07] text-white/30 font-semibold uppercase tracking-wider text-[10px]">
                <th className="text-left py-3 px-4">Prompt</th>
                <th className="text-left py-3 px-3">Model</th>
                <th className="text-left py-3 px-3">Status</th>
                <th className="text-left py-3 px-3">Sentiment</th>
                <th className="text-left py-3 px-3">Mention Pos.</th>
                <th className="text-left py-3 px-3">Response Preview</th>
                <th className="text-left py-3 px-3">Date</th>
                <th className="text-left py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(run => (
                <tr
                  key={run.id}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors cursor-pointer"
                  onClick={() => setSelected(run)}
                >
                  <td className="py-3 px-4 max-w-[180px]">
                    <span className="text-white/70 line-clamp-2 leading-snug text-[11px]">
                      {run.prompts?.text}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <ModelBadge model={run.model} />
                  </td>
                  <td className="py-3 px-3">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      run.is_mentioned
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-red-500/15 text-red-400"
                    }`}>
                      {run.is_mentioned ? "Success" : "Not Found"}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[11px] font-semibold ${
                      run.sentiment === "positive" ? "text-emerald-400"
                        : run.sentiment === "negative" ? "text-red-400"
                        : "text-white/40"
                    }`}>
                      {run.sentiment
                        ? run.sentiment.charAt(0).toUpperCase() + run.sentiment.slice(1)
                        : run.is_mentioned ? "Positive" : "—"}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {run.rank ? (
                      <span className="rounded-full bg-indigo-500/15 text-indigo-400 px-2 py-0.5 text-[9px] font-semibold">
                        #{run.rank}
                      </span>
                    ) : <span className="text-white/25">—</span>}
                  </td>
                  <td className="py-3 px-3 max-w-[200px]">
                    <span className="text-white/40 line-clamp-2 leading-snug text-[11px] italic">
                      {run.response_text?.slice(0, 90)}…
                    </span>
                  </td>
                  <td className="py-3 px-3 text-white/30 whitespace-nowrap">
                    {new Date(run.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3 px-3">
                    <ExternalLink className="w-3.5 h-3.5 text-white/20 hover:text-white/60 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#141416] border-l border-white/10 h-full flex flex-col shadow-2xl overflow-y-auto">
            <div className="flex items-start justify-between p-5 border-b border-white/[0.07]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ModelBadge model={selected.model} />
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                    selected.is_mentioned ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                  }`}>{selected.is_mentioned ? "Brand Mentioned" : "Not Mentioned"}</span>
                </div>
                <h2 className="text-sm font-semibold text-white/80 leading-snug">{selected.prompts?.text}</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg bg-white/5 p-2 text-white/40 hover:text-white/70 ml-3 shrink-0"
              >✕</button>
            </div>

            <div className="p-5 space-y-5">
              {selected.rank && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Brand Position</span>
                  <span className="rounded-full bg-indigo-500/15 text-indigo-300 px-3 py-1 text-xs font-bold">#{selected.rank}</span>
                </div>
              )}

              <div>
                <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">AI Response</div>
                <p className="text-sm text-white/60 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 leading-relaxed">
                  {selected.response_text || "No response text recorded."}
                </p>
              </div>

              {selected.citations && selected.citations.length > 0 && (
                <div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">Cited Sources</div>
                  <div className="space-y-2">
                    {selected.citations.map((c: any, i: number) => (
                      <a key={i} href={c.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.05] px-3 py-2.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        {c.title || c.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-white/20 pt-2">
                Run at: {new Date(selected.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
