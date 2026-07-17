import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Filter, Check, X, Loader2, AlertTriangle, ChevronDown, RefreshCw, AtSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$projectId/mentions")({
  component: Mentions,
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

// Detect sentiment from response text
function detectSentiment(text: string, isMentioned: boolean, brand: string): "positive" | "neutral" | "negative" {
  if (!isMentioned) return "neutral";
  const lower = text.toLowerCase();
  const positiveWords = ["great", "best", "excellent", "recommended", "top", "leading", "notable", "popular", "trusted", "award"];
  const negativeWords = ["lacks", "missing", "poor", "bad", "avoid", "not suitable", "limited", "weak", "fails", "overpriced"];
  const posScore = positiveWords.filter((w) => lower.includes(w)).length;
  const negScore = negativeWords.filter((w) => lower.includes(w)).length;
  if (negScore > posScore) return "negative";
  if (posScore > 0) return "positive";
  return "neutral";
}

// Detect if brand appears in a negative context despite being mentioned
function detectHallucination(text: string, brand: string): boolean {
  if (!brand || !text) return false;
  const lower = text.toLowerCase();
  const brandLower = brand.toLowerCase();
  if (!lower.includes(brandLower)) return false;
  const hallucinationPatterns = [
    /lacks\s+\w+\s+feature/i,
    /does not (have|offer|support)/i,
    /no\s+(free|trial|api)/i,
    /shut\s*down/i,
    /discontinued/i,
    /not\s+available\s+in/i,
  ];
  return hallucinationPatterns.some((p) => p.test(text));
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

type MentionItem = {
  id: string;
  model: string;
  prompt_text: string;
  project_name: string;
  brand: string;
  sentiment: "positive" | "neutral" | "negative";
  is_mentioned: boolean;
  rank: number | null;
  response_text: string;
  is_hallucination: boolean;
  citations: any[];
  media_embeds: any[];
  created_at: string;
};

const SENTIMENT_STYLES = {
  positive: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "#22c55e" },
  neutral: { bg: "bg-white/5", text: "text-white/40", dot: "rgba(255,255,255,0.4)" },
  negative: { bg: "bg-red-500/10", text: "text-red-400", dot: "#ef4444" },
};

function Mentions() {
  const [mentions, setMentions] = useState<MentionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModel, setFilterModel] = useState<string>("all");
  const [filterSentiment, setFilterSentiment] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMentions();
  }, []);

  const fetchMentions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("prompt_runs")
        .select(`
          id,
          model,
          is_mentioned,
          rank,
          response_text,
          citations,
          media_embeds,
          created_at,
          prompts (
            text,
            projects ( name, brand )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      const items: MentionItem[] = (data || []).map((run: any) => {
        const prompt = Array.isArray(run.prompts) ? run.prompts[0] : run.prompts;
        const project = prompt?.projects
          ? Array.isArray(prompt.projects) ? prompt.projects[0] : prompt.projects
          : null;
        const brand = project?.brand || "";
        const sentiment = detectSentiment(run.response_text || "", run.is_mentioned, brand);
        const isHallucination = detectHallucination(run.response_text || "", brand);

        return {
          id: run.id,
          model: run.model,
          prompt_text: prompt?.text || "—",
          project_name: project?.name || "Unknown",
          brand,
          sentiment,
          is_mentioned: run.is_mentioned,
          rank: run.rank,
          response_text: run.response_text || "",
          is_hallucination: isHallucination,
          citations: run.citations || [],
          media_embeds: run.media_embeds || [],
          created_at: run.created_at,
        };
      });

      setMentions(items);
    } catch (err: any) {
      toast.error("Failed to load mentions: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = mentions.filter((m) => {
    if (filterModel !== "all" && m.model !== filterModel) return false;
    if (filterSentiment !== "all" && m.sentiment !== filterSentiment) return false;
    return true;
  });

  const stats = {
    total: mentions.length,
    mentioned: mentions.filter((m) => m.is_mentioned).length,
    positive: mentions.filter((m) => m.sentiment === "positive").length,
    hallucinations: mentions.filter((m) => m.is_hallucination).length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Mentions</h1>
          <p className="mt-1 text-sm text-white/40">Every AI model response where your brand was analyzed</p>
        </div>
        <button
          onClick={fetchMentions}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 ring-1 ring-white/10 px-3.5 py-2 text-sm font-medium text-white/60 hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Scans", value: stats.total, color: "text-white" },
          { label: "Brand Cited", value: stats.mentioned, color: "text-emerald-400" },
          { label: "Positive Tone", value: stats.positive, color: "text-indigo-400" },
          {
            label: "Hallucinations",
            value: stats.hallucinations,
            color: stats.hallucinations > 0 ? "text-amber-400" : "text-white/30",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-white/30 shrink-0" />
        <div className="relative">
          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="appearance-none rounded-lg bg-white/[0.04] border border-white/5 pl-3 pr-8 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
          >
            <option value="all" className="bg-[#1e1e21]">All Models</option>
            {Object.entries(MODEL_LABELS).map(([k, v]) => (
              <option key={k} value={k} className="bg-[#1e1e21]">{v}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterSentiment}
            onChange={(e) => setFilterSentiment(e.target.value)}
            className="appearance-none rounded-lg bg-white/[0.04] border border-white/5 pl-3 pr-8 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
          >
            <option value="all" className="bg-[#1e1e21]">All Sentiments</option>
            <option value="positive" className="bg-[#1e1e21]">Positive</option>
            <option value="neutral" className="bg-[#1e1e21]">Neutral</option>
            <option value="negative" className="bg-[#1e1e21]">Negative</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        </div>
        <span className="ml-auto text-xs text-white/30">{filtered.length} results</span>
      </div>

      {/* Mentions Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Loading mentions from database…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
          <AtSign className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-white">No mentions yet</h3>
          <p className="mt-1 text-xs text-white/45 leading-relaxed max-w-xs mx-auto">
            Run a prompt audit to see AI model mentions here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-white/30 font-semibold">
                <th className="text-left px-6 py-3">Model</th>
                <th className="text-left px-6 py-3">Prompt</th>
                <th className="text-left px-6 py-3">Sentiment</th>
                <th className="text-center px-4 py-3 w-20">Cited</th>
                <th className="text-center px-4 py-3 w-20">Rank</th>
                <th className="text-left px-4 py-3 w-28">Time</th>
                <th className="text-center px-4 py-3 w-20">Snippet</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const sentStyles = SENTIMENT_STYLES[m.sentiment];
                const isExpanded = expandedId === m.id;
                return (
                  <>
                    <tr
                      key={m.id}
                      className={`border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors ${
                        m.is_hallucination ? "ring-1 ring-amber-500/10" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: MODEL_COLORS[m.model] }} />
                          <span className="text-sm font-medium text-white/80">{MODEL_LABELS[m.model] || m.model}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-white/60 truncate">{m.prompt_text}</div>
                        <div className="text-[10px] text-white/25 mt-0.5">{m.project_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${sentStyles.bg} ${sentStyles.text}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: sentStyles.dot }} />
                          {m.sentiment}
                        </span>
                        {m.is_hallucination && (
                          <span className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400">
                            <AlertTriangle className="w-2.5 h-2.5" /> hallucination
                          </span>
                        )}
                        {m.media_embeds.length > 0 && (
                          <span className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] bg-white/5 text-white/50 border border-white/10" title="Multimodal Widgets Detected">
                            {m.media_embeds.some((e: any) => e.type === "video") && "🎥"}
                            {m.media_embeds.some((e: any) => e.type === "image") && "🖼️"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {m.is_mentioned ? (
                          <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-white/20 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-mono text-sm font-semibold text-white/70">
                        {m.rank ? `#${m.rank}` : "—"}
                      </td>
                      <td className="px-4 py-4 text-xs text-white/30">{timeAgo(m.created_at)}</td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : m.id)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 mx-auto"
                        >
                          View
                          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Response Snippet */}
                    {isExpanded && (
                      <tr key={`${m.id}-exp`} className="border-b border-white/5 bg-white/[0.01]">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="space-y-3">
                            <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
                              AI Response Snippet
                            </div>
                            <p className="text-xs text-white/60 bg-black/30 p-3 rounded-lg border border-white/[0.04] leading-relaxed italic max-w-2xl">
                              {m.response_text || "No response text recorded."}
                            </p>
                            {m.citations.length > 0 && (
                              <div>
                                <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1.5">
                                  Cited Sources
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {m.citations.map((c: any, i: number) => (
                                    <a
                                      key={i}
                                      href={c.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10 transition-colors"
                                    >
                                      {c.title}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            {m.is_hallucination && (
                              <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-3 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-300 leading-relaxed">
                                  <strong>Potential Hallucination Detected</strong> — This response may contain inaccurate claims about your brand. Consider publishing corrective content with schema markup to counter this narrative on the next AI crawl.
                                </p>
                              </div>
                            )}
                            {m.media_embeds.length > 0 && (
                              <div>
                                <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1.5">
                                  Multimodal Embeds
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {m.media_embeds.map((e: any, i: number) => (
                                    <div key={i} className="inline-flex items-center gap-1.5 text-[11px] text-white/70 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                      <span>{e.type === "video" ? "🎥 Video" : "🖼️ Image"}</span>
                                      <span className="text-white/40">·</span>
                                      <span>{e.title || e.alt || e.source}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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
