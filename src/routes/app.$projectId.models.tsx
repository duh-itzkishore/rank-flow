import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Bot, TrendingUp, TrendingDown, Info, Clock, DollarSign, Heart, ShieldAlert, Key, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

export const Route = createFileRoute("/app/$projectId/models")({
  component: AIModels,
});

const AI_PROVIDERS = [
  {
    id: "openai",
    label: "OpenAI",
    models: "GPT-4o-mini, GPT-4o",
    docsUrl: "https://platform.openai.com/api-keys",
    placeholder: "sk-proj-...",
    color: "#10a37f",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    models: "Gemini 1.5 Flash",
    docsUrl: "https://aistudio.google.com/app/apikey",
    placeholder: "AIzaSy...",
    color: "#4285f4",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    models: "Claude 3.5 Sonnet, Claude Haiku",
    docsUrl: "https://console.anthropic.com/settings/keys",
    placeholder: "sk-ant-api03-...",
    color: "#c85a2a",
  },
  {
    id: "perplexity",
    label: "Perplexity AI",
    models: "Sonar Large (web search)",
    docsUrl: "https://www.perplexity.ai/settings/api",
    placeholder: "pplx-...",
    color: "#7c3aed",
  },
];

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
      "Use semantic keywords like 'enterprise-grade', 'compliance'",
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
  avgLatency: number;
  avgTokens: number;
  avgSentiment: number;
  trend: "up" | "down" | "flat";
};

function AIModels() {
  const { projectId } = Route.useParams();
  const [stats, setStats] = useState<Record<string, ModelStats>>({});
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [bottomTab, setBottomTab] = useState<"logs" | "hallucinations" | "api-keys">("logs");
  const [hallucinations, setHallucinations] = useState<any[]>([]);

  // API Key configuration state
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [savedProviders, setSavedProviders] = useState<Set<string>>(new Set());
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchApiKeys();
  }, [projectId]);

  const fetchApiKeys = async () => {
    if (!projectId) return;
    try {
      const { data: keyConfigs, error } = await (supabase as any)
        .from("api_key_configs")
        .select("provider, encrypted_key")
        .eq("project_id", projectId);

      if (error) throw error;

      if (keyConfigs?.length) {
        const keyMap: Record<string, string> = {};
        const saved = new Set<string>();
        keyConfigs.forEach((c: any) => {
          keyMap[c.provider] = c.encrypted_key;
          saved.add(c.provider);
        });
        setApiKeys(keyMap);
        setSavedProviders(saved);
      } else {
        setApiKeys({});
        setSavedProviders(new Set());
      }
    } catch (err) {
      console.error("Failed to load API keys", err);
    }
  };

  const handleSaveApiKey = async (providerId: string) => {
    const keyValue = (apiKeys[providerId] || "").trim();
    if (!keyValue) { toast.error("Please enter a valid API key."); return; }
    if (!projectId) { toast.error("Project not found."); return; }
    setSavingKey(providerId);
    try {
      const { error } = await (supabase as any)
        .from("api_key_configs")
        .upsert(
          { project_id: projectId, provider: providerId, encrypted_key: keyValue, is_active: true },
          { onConflict: "project_id,provider" }
        );
      if (error) throw error;
      setSavedProviders((prev) => new Set([...prev, providerId]));
      toast.success(`${AI_PROVIDERS.find((p) => p.id === providerId)?.label} key saved!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save API key.");
    } finally {
      setSavingKey(null);
    }
  };

  const handleRemoveApiKey = async (providerId: string) => {
    if (!projectId) return;
    try {
      const { error } = await (supabase as any)
        .from("api_key_configs")
        .delete()
        .eq("project_id", projectId)
        .eq("provider", providerId);
      if (error) throw error;
      setApiKeys((prev) => { const n = { ...prev }; delete n[providerId]; return n; });
      setSavedProviders((prev) => { const s = new Set(prev); s.delete(providerId); return s; });
      toast.success("API key removed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove key.");
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString();

      // Query prompt runs with the V2 metrics columns
      const { data, error } = await (supabase as any)
        .from("prompt_runs")
        .select("model, is_mentioned, rank, created_at, response_text, sentiment_score, latency_ms, tokens_used")
        .gte("created_at", since);

      if (error) throw error;
      const runs = data || [];
      setRecentRuns(runs.slice(0, 15)); // Get recent runs for log section

      // Query hallucination alerts
      const { data: halData } = await (supabase as any)
        .from("alerts")
        .select("*")
        .eq("type", "hallucination")
        .order("created_at", { ascending: false });
      setHallucinations(halData || []);

      const result: Record<string, ModelStats> = {};
      for (const model of MODELS.map((m) => m.key)) {
        const modelRuns = runs.filter((r: any) => r.model === model);
        const mentioned = modelRuns.filter((r: any) => r.is_mentioned);
        const ranked = mentioned.filter((r: any) => r.rank !== null);
        
        const avgRank = ranked.length > 0
          ? parseFloat((ranked.reduce((a: any, r: any) => a + (r.rank || 0), 0) / ranked.length).toFixed(1))
          : null;
          
        const citationRate = modelRuns.length > 0
          ? Math.round((mentioned.length / modelRuns.length) * 100)
          : 0;

        // Calculate averages from V2 columns
        const totalLatency = modelRuns.reduce((a: any, r: any) => a + ((r as any).latency_ms || 0), 0);
        const avgLatency = modelRuns.length > 0 ? Math.round(totalLatency / modelRuns.length) : 0;

        const totalTokens = modelRuns.reduce((a: any, r: any) => a + ((r as any).tokens_used || 0), 0);
        const avgTokens = modelRuns.length > 0 ? Math.round(totalTokens / modelRuns.length) : 0;

        const totalSentiment = modelRuns.reduce((a: any, r: any) => a + ((r as any).sentiment_score || 0), 0);
        const avgSentiment = modelRuns.length > 0 ? parseFloat((totalSentiment / modelRuns.length).toFixed(2)) : 0;

        // Trend calculation
        let trend: "up" | "down" | "flat" = "flat";
        if (modelRuns.length >= 4) {
          const half = Math.floor(modelRuns.length / 2);
          const firstRate = modelRuns.slice(0, half).filter((r: any) => r.is_mentioned).length / half;
          const secondRate = modelRuns.slice(half).filter((r: any) => r.is_mentioned).length / (modelRuns.length - half);
          trend = secondRate > firstRate ? "up" : secondRate < firstRate ? "down" : "flat";
        }

        result[model] = { 
          total: modelRuns.length, 
          mentioned: mentioned.length, 
          citationRate, 
          avgRank, 
          avgLatency, 
          avgTokens, 
          avgSentiment,
          trend 
        };
      }

      setStats(result);
    } catch (err: any) {
      toast.error("Failed to load model stats: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const radarData = [
    { subject: "Citation Rate", A: stats[selectedModel || "chatgpt"]?.citationRate || 0 },
    { subject: "Avg Rank", A: selectedModel && stats[selectedModel]?.avgRank ? Math.max(0, 100 - (stats[selectedModel].avgRank! - 1) * 20) : 0 },
    { subject: "Sentiment", A: selectedModel ? Math.round((stats[selectedModel].avgSentiment + 1) * 50) : 50 }, // Map -1..1 to 0..100
    { subject: "Response Speed", A: selectedModel ? Math.max(20, Math.min(100, 100 - (stats[selectedModel].avgLatency / 100))) : 50 },
    { subject: "Mentions", A: stats[selectedModel || "chatgpt"]?.mentioned ? Math.min(100, (stats[selectedModel || "chatgpt"].mentioned / 5) * 100) : 0 },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">AI Models</h1>
        <p className="mt-1 text-sm text-white/40">Per-model citation intelligence, latency, token costs, and sentiment metrics · last 30 days</p>
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
              const s = stats[m.key] || { total: 0, mentioned: 0, citationRate: 0, avgRank: null, avgLatency: 0, avgTokens: 0, avgSentiment: 0, trend: "flat" };
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
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                      <div>
                        <div className="text-[9px] text-white/35">Avg Speed</div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3 text-indigo-400" />{s.avgLatency}ms</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-white/35">Avg Tokens</div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1 mt-0.5"><DollarSign className="w-3 h-3 text-emerald-400" />{s.avgTokens}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-white/40">Avg Sentiment</span>
                      <span className="text-xs font-semibold text-white flex items-center gap-1"><Heart className="w-3 h-3 text-rose-500" />{s.avgSentiment}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Model Deep Dive */}
          {selectedModel && (() => {
            const model = MODELS.find((m) => m.key === selectedModel)!;
            const s = stats[selectedModel] || { total: 0, mentioned: 0, citationRate: 0, avgRank: null, avgLatency: 0, avgTokens: 0, avgSentiment: 0, trend: "flat" };
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
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Bottom Tabs Section */}
          <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 space-y-4">
            <div className="flex border-b border-white/5 pb-2 items-center justify-between">
              <div className="flex gap-4">
                <button 
                  onClick={() => setBottomTab("logs")}
                  className={`text-xs font-semibold pb-2 border-b-2 transition-all ${bottomTab === "logs" ? "border-indigo-500 text-white" : "border-transparent text-white/40"}`}
                >
                  Gateway Activity Logs
                </button>
                <button 
                  onClick={() => setBottomTab("hallucinations")}
                  className={`text-xs font-semibold pb-2 border-b-2 transition-all ${bottomTab === "hallucinations" ? "border-indigo-500 text-white" : "border-transparent text-white/40"}`}
                >
                  Hallucination Monitor ({hallucinations.length})
                </button>
                <button 
                  onClick={() => setBottomTab("api-keys")}
                  className={`text-xs font-semibold pb-2 border-b-2 transition-all ${bottomTab === "api-keys" ? "border-indigo-500 text-white" : "border-transparent text-white/40"}`}
                >
                  API Keys
                </button>
              </div>
            </div>

            {bottomTab === "logs" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 pb-2">
                      <th className="py-2">Time</th>
                      <th className="py-2">Model</th>
                      <th className="py-2">Mentioned</th>
                      <th className="py-2">Rank</th>
                      <th className="py-2">Speed (ms)</th>
                      <th className="py-2">Tokens</th>
                      <th className="py-2">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentRuns.map((r, i) => (
                       <tr key={i} className="text-white/70 hover:bg-white/[0.02]">
                        <td className="py-2.5">{new Date(r.created_at).toLocaleTimeString()}</td>
                        <td className="py-2.5 font-medium text-white">{r.model}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${r.is_mentioned ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {r.is_mentioned ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="py-2.5">{r.rank ? `#${r.rank}` : "-"}</td>
                        <td className="py-2.5 font-mono">{r.latency_ms || "-"}</td>
                        <td className="py-2.5 font-mono">{r.tokens_used || "-"}</td>
                        <td className="py-2.5">{r.sentiment_score !== undefined ? r.sentiment_score : "-"}</td>
                      </tr>
                    ))}
                    {recentRuns.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-white/30">No prompt runs recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : bottomTab === "hallucinations" ? (
              <div className="space-y-3">
                {hallucinations.map((h) => (
                  <div key={h.id} className="rounded-xl bg-red-950/10 border border-red-900/20 p-4 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">Hallucinated Claim Detected</h4>
                      <p className="text-xs text-white/60 mt-1">{h.message}</p>
                      <span className="inline-block text-[9px] text-white/30 mt-2">{new Date(h.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {hallucinations.length === 0 && (
                  <div className="py-8 text-center text-white/30 text-xs">
                    No hallucination patterns detected in recent scans.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-500/[0.06] ring-1 ring-indigo-500/20 max-w-2xl">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" /> Project-Specific API Keys
                  </span>
                  <p className="text-xs text-indigo-300/70">
                    These keys configure real AI model audits for this project. Without keys, scans run in Wikipedia/SerpAPI simulation mode.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {AI_PROVIDERS.map((provider) => {
                    const isSaved = savedProviders.has(provider.id);
                    const keyVal = apiKeys[provider.id] || "";
                    const isVisible = showKeys[provider.id];
                    const isSavingThis = savingKey === provider.id;
                    return (
                      <div
                        key={provider.id}
                        className={`rounded-xl border p-4 transition-colors ${
                          isSaved
                            ? "bg-emerald-500/[0.02] border-emerald-500/20"
                            : "bg-white/[0.02] border-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: provider.color }} />
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-white">{provider.label}</div>
                              </div>
                              <div className="text-[10px] text-white/30">{provider.models}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            {isSaved && (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Connected
                              </span>
                            )}
                            <a
                              href={provider.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                            >
                              Get Key ↗
                            </a>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={isVisible ? "text" : "password"}
                              value={keyVal}
                              onChange={(e) => setApiKeys({ ...apiKeys, [provider.id]: e.target.value })}
                              placeholder={provider.placeholder}
                              className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2 pr-9 text-sm text-white/80 font-mono placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => setShowKeys({ ...showKeys, [provider.id]: !isVisible })}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                            >
                              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <button
                            onClick={() => handleSaveApiKey(provider.id)}
                            disabled={isSavingThis || !keyVal.trim()}
                            className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 whitespace-nowrap"
                          >
                            {isSavingThis ? "Saving…" : isSaved ? "Update" : "Save Key"}
                          </button>
                          {isSaved && (
                            <button
                              onClick={() => handleRemoveApiKey(provider.id)}
                              className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 text-xs font-semibold hover:bg-red-500/20 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
