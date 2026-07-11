import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Bot, TrendingUp, TrendingDown, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

export const Route = createFileRoute("/app/models")({
  component: AIModels,
});

const MODELS = [
  {
    key: "chatgpt",
    label: "ChatGPT",
    company: "OpenAI",
    color: "#10a37f",
    bg: "bg-[#10a37f]/10",
    border: "border-[#10a37f]/20",
    description: "Powers conversational AI and real-time web search. Heavily weights structured content, listicles, and Wikipedia-style authority.",
    strengths: ["Listicle content", "Structured FAQs", "Direct answers", "Schema markup"],
    winTips: [
      "Add FAQ schema to your key landing pages",
      "Get featured on 'best of' listicle blogs in your niche",
      "Include your brand in comparison tables with clear differentiators",
    ],
  },
  {
    key: "gemini",
    label: "Gemini",
    company: "Google",
    color: "#4285f4",
    bg: "bg-[#4285f4]/10",
    border: "border-[#4285f4]/20",
    description: "Google's AI model trained on vast web crawl data. Favors Google Search-indexed content, Google My Business, and YouTube.",
    strengths: ["Google-indexed content", "Video content", "E-E-A-T signals", "Local citations"],
    winTips: [
      "Ensure Google Search Console crawl is healthy",
      "Create YouTube product demo videos — Gemini surfaces them",
      "Get reviewed on Google-trusted review platforms (Trustpilot, G2)",
    ],
  },
  {
    key: "claude",
    label: "Claude",
    company: "Anthropic",
    color: "#c85a2a",
    bg: "bg-[#c85a2a]/10",
    border: "border-[#c85a2a]/20",
    description: "Trained for nuanced reasoning and safety. Prefers nuanced, authoritative long-form content and academic/research tone.",
    strengths: ["Long-form authority", "Research papers", "Ethical framing", "Case studies"],
    winTips: [
      "Publish detailed case studies and white papers",
      "Frame your product around clear ethical and safety benefits",
      'Use semantic keywords like "enterprise-grade", "compliance", "research-backed"',
    ],
  },
  {
    key: "perplexity",
    label: "Perplexity",
    company: "Perplexity AI",
    color: "#7c3aed",
    bg: "bg-[#7c3aed]/10",
    border: "border-[#7c3aed]/20",
    description: "An answer engine that heavily cites live web sources. Relies on Reddit, G2, Capterra, Product Hunt, and niche review aggregators.",
    strengths: ["Live web citations", "Reddit threads", "Review aggregators", "News coverage"],
    winTips: [
      "Get active product discussions on Reddit (r/SaaS, r/startups)",
      "Collect verified reviews on Capterra, G2, and Product Hunt",
      "Pitch tech journalists for product coverage on recognized news sites",
    ],
  },
];

type ModelStats = {
  total: number;
  mentioned: number;
  citationRate: number;
  avgRank: number | null;
  trend: "up" | "down" | "flat";
};

function AIModels() {
  const [stats, setStats] = useState<Record<string, ModelStats>>({});
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString();

      const { data, error } = await supabase
        .from("prompt_runs")
        .select("model, is_mentioned, rank, created_at")
        .gte("created_at", since);

      if (error) throw error;
      const runs = data || [];

      const result: Record<string, ModelStats> = {};
      for (const model of MODELS.map((m) => m.key)) {
        const modelRuns = runs.filter((r) => r.model === model);
        const mentioned = modelRuns.filter((r) => r.is_mentioned);
        const ranked = mentioned.filter((r) => r.rank !== null);
        const avgRank = ranked.length > 0
          ? parseFloat((ranked.reduce((a, r) => a + (r.rank || 0), 0) / ranked.length).toFixed(1))
          : null;
        const citationRate = modelRuns.length > 0
          ? Math.round((mentioned.length / modelRuns.length) * 100)
          : 0;

        // Trend: compare first half vs second half
        let trend: "up" | "down" | "flat" = "flat";
        if (modelRuns.length >= 4) {
          const half = Math.floor(modelRuns.length / 2);
          const firstRate = modelRuns.slice(0, half).filter((r) => r.is_mentioned).length / half;
          const secondRate = modelRuns.slice(half).filter((r) => r.is_mentioned).length / (modelRuns.length - half);
          trend = secondRate > firstRate ? "up" : secondRate < firstRate ? "down" : "flat";
        }

        result[model] = { total: modelRuns.length, mentioned: mentioned.length, citationRate, avgRank, trend };
      }

      setStats(result);
    } catch (err: any) {
      toast.error("Failed to load model stats: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Radar chart data for the selected model
  const radarData = [
    { subject: "Citation Rate", A: stats[selectedModel || "chatgpt"]?.citationRate || 0 },
    { subject: "Avg Rank", A: selectedModel && stats[selectedModel]?.avgRank ? Math.max(0, 100 - (stats[selectedModel].avgRank! - 1) * 20) : 0 },
    { subject: "Coverage", A: stats[selectedModel || "chatgpt"]?.total ? Math.min(100, (stats[selectedModel || "chatgpt"].total / 10) * 100) : 0 },
    { subject: "Trend", A: stats[selectedModel || "chatgpt"]?.trend === "up" ? 80 : stats[selectedModel || "chatgpt"]?.trend === "down" ? 20 : 50 },
    { subject: "Mentions", A: stats[selectedModel || "chatgpt"]?.mentioned ? Math.min(100, (stats[selectedModel || "chatgpt"].mentioned / 5) * 100) : 0 },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">AI Models</h1>
        <p className="mt-1 text-sm text-white/40">Per-model citation intelligence, win strategies & performance · last 30 days</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Loading model intelligence…
        </div>
      ) : (
        <>
          {/* Model Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODELS.map((m) => {
              const s = stats[m.key] || { total: 0, mentioned: 0, citationRate: 0, avgRank: null, trend: "flat" };
              const isSelected = selectedModel === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setSelectedModel(isSelected ? null : m.key)}
                  className={`rounded-2xl p-5 text-left transition-all border ${m.bg} ${m.border} ${
                    isSelected ? "ring-2 ring-white/20" : "hover:ring-1 hover:ring-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-bold text-white">{m.label}</div>
                      <div className="text-[10px] text-white/30 mt-0.5">{m.company}</div>
                    </div>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${m.color}20` }}>
                      <Bot className="w-4 h-4" style={{ color: m.color }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40">Citation Rate</span>
                      <span className="text-sm font-bold text-white">{s.citationRate}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-black/30 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.citationRate}%`, background: m.color }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40">Avg Rank</span>
                      <span className="text-xs font-semibold text-white">{s.avgRank ? `#${s.avgRank}` : "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40">Total Scans</span>
                      <span className="text-xs text-white/60">{s.total}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {s.trend === "up" ? (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> Rising</span>
                      ) : s.trend === "down" ? (
                        <span className="text-[10px] text-red-400 flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> Falling</span>
                      ) : (
                        <span className="text-[10px] text-white/30">→ Stable</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Model Deep Dive */}
          {selectedModel && (() => {
            const model = MODELS.find((m) => m.key === selectedModel)!;
            const s = stats[selectedModel] || { total: 0, mentioned: 0, citationRate: 0, avgRank: null, trend: "flat" };
            return (
              <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${model.color}20` }}>
                    <Bot className="w-5 h-5" style={{ color: model.color }} />
                  </div>
                  <div>
                    <div className="text-base font-bold text-white">{model.label} Intelligence Report</div>
                    <div className="text-xs text-white/35 mt-0.5">{model.description}</div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Radar Chart */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Performance Radar</h3>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="rgba(255,255,255,0.06)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                          <Radar dataKey="A" stroke={model.color} fill={model.color} fillOpacity={0.15} strokeWidth={2} />
                          <Tooltip contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Win Tips */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-indigo-400" />
                      How to Win on {model.label}
                    </h3>
                    <div className="space-y-2.5">
                      {model.winTips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-white/60 leading-relaxed">
                          <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {tip}
                        </div>
                      ))}
                    </div>

                    <h3 className="text-sm font-semibold text-white mt-4 mb-2">What {model.label} Values</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {model.strengths.map((s, i) => (
                        <span key={i} className={`text-[10px] px-2 py-1 rounded-full font-medium ${model.bg} border ${model.border}`} style={{ color: model.color }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {!selectedModel && (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
              <p className="text-sm text-white/30">Click any model card above to see its deep-dive intelligence report and win strategies</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
