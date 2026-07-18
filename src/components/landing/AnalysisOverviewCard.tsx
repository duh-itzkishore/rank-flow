import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2, AlertCircle, AlertTriangle, X,
  ArrowRight, Globe, Lock, Eye, Shield, FileText, Database, Zap, Code, Search,
  Info, Copy, CheckCheck, ExternalLink
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisOverviewCardProps {
  url: string;
  isLoggedIn?: boolean;
  onClose?: () => void;
  inline?: boolean;
}

type TabType = 'overview' | 'ai-visibility' | 'ai-access' | 'content' | 'schema' | 'llms';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 128, strokeWidth = 8, color }: { score: number; size?: number; strokeWidth?: number; color?: string }) {
  const r = (size / 2) - strokeWidth;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const ringColor = color ?? (score > 80 ? "#22c55e" : score > 50 ? "#f59e0b" : "#ef4444");
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={ringColor} strokeWidth={strokeWidth}
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white/[0.03] rounded-xl p-4 ring-1 ring-white/[0.06] flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{label}</span>
      <span className="text-2xl font-bold text-white">{value}</span>
      {sub && <span className="text-xs text-white/40">{sub}</span>}
    </div>
  );
}

function BotRow({ name, userAgent, robotsTxt }: { name: string; userAgent: string; robotsTxt: string }) {
  const rawLower = (robotsTxt || "").toLowerCase();
  // Check if there's a disallow rule for this bot
  const lines = rawLower.split("\n").map(l => l.trim());
  let currentAgent = "";
  let isBlocked = false;
  for (const line of lines) {
    if (line.startsWith("user-agent:")) {
      currentAgent = line.replace("user-agent:", "").trim();
    }
    if ((currentAgent === userAgent || currentAgent === "*") && line.startsWith("disallow:")) {
      const disallowedPath = line.replace("disallow:", "").trim();
      if (disallowedPath === "/" || disallowedPath === "") {
        isBlocked = true;
      }
    }
  }
  // Also check explicit user-agent block
  const hasExplicitAgent = lines.some(l => l === `user-agent: ${userAgent}`);
  if (hasExplicitAgent) {
    const agentIdx = lines.findIndex(l => l === `user-agent: ${userAgent}`);
    for (let i = agentIdx + 1; i < lines.length; i++) {
      if (lines[i].startsWith("user-agent:")) break;
      if (lines[i].startsWith("disallow: /")) { isBlocked = true; break; }
    }
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg ring-1 ring-white/[0.04]">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-200">{name}</span>
        <code className="text-[10px] text-white/30 font-mono">{userAgent}</code>
      </div>
      {isBlocked ? (
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full">
          <X className="w-3 h-3" /> Blocked
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> Allowed
        </span>
      )}
    </div>
  );
}

function readabilityLabel(score: number) {
  if (score >= 90) return { label: "Very Easy", color: "#22c55e" };
  if (score >= 70) return { label: "Easy", color: "#4ade80" };
  if (score >= 60) return { label: "Standard", color: "#f59e0b" };
  if (score >= 50) return { label: "Fairly Difficult", color: "#f97316" };
  if (score >= 30) return { label: "Difficult", color: "#ef4444" };
  return { label: "Very Difficult", color: "#dc2626" };
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AnalysisOverviewCard({ url, isLoggedIn: propIsLoggedIn, onClose, inline }: AnalysisOverviewCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoggedIn, setIsLoggedIn] = useState(propIsLoggedIn ?? false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (propIsLoggedIn !== undefined) { setIsLoggedIn(propIsLoggedIn); return; }
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, [propIsLoggedIn]);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`/api/seo-audit?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.error || "Analysis failed");
        setData(json);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [url]);

  // ── Loading State ────────────────────────────────────────────────────────────
  const LoaderContent = () => (
    <div className={`bg-[#07070a]/95 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center shadow-2xl max-w-md w-full animate-pulse relative ${inline ? "mx-auto my-12" : ""}`}>
      {onClose && !inline && (
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      )}
      <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
        <Search className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Analyzing {url}...</h3>
      <p className="text-gray-400 text-center text-sm">
        Our agent is crawling the page, parsing AI bot access rules, and evaluating AEO metrics. This deep scan takes about 5-10 seconds.
      </p>
    </div>
  );

  if (loading) {
    if (inline) return <LoaderContent />;
    return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"><LoaderContent /></div>;
  }

  // ── Error State ──────────────────────────────────────────────────────────────
  const ErrorContent = () => (
    <div className={`flex flex-col items-center justify-center p-12 bg-[#0e0e12] rounded-2xl border border-red-500/20 text-center relative max-w-md w-full shadow-2xl ${inline ? "mx-auto my-12" : ""}`}>
      {onClose && !inline && (
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      )}
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">Analysis Failed</h3>
      <p className="text-gray-400 mb-6">{error}</p>
      {onClose ? (
        <button onClick={onClose} className="text-indigo-400 hover:text-indigo-300 font-medium">Try another URL</button>
      ) : (
        <Link to="/" className="text-indigo-400 hover:text-indigo-300 font-medium">Try another URL</Link>
      )}
    </div>
  );

  if (error) {
    if (inline) return <ErrorContent />;
    return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"><ErrorContent /></div>;
  }

  if (!data) return null;

  const { metrics, issues, healthScore, aeo } = data;
  const overallScore = Math.round((healthScore + (aeo?.visibilityScore || 0)) / 2);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Zap, locked: false },
    { id: 'ai-visibility', label: 'AI Visibility', icon: Eye, locked: !isLoggedIn },
    { id: 'ai-access', label: 'AI Access', icon: Shield, locked: !isLoggedIn },
    { id: 'content', label: 'Content', icon: FileText, locked: !isLoggedIn },
    { id: 'schema', label: 'Schema', icon: Database, locked: !isLoggedIn },
    { id: 'llms', label: 'llms.txt', icon: Code, locked: !isLoggedIn },
  ] as const;

  const AI_BOTS = [
    { name: "ChatGPT", userAgent: "gptbot" },
    { name: "OpenAI Search", userAgent: "oai-searchbot" },
    { name: "Claude", userAgent: "claudebot" },
    { name: "Anthropic", userAgent: "anthropic-ai" },
    { name: "Perplexity", userAgent: "perplexitybot" },
    { name: "Google AI", userAgent: "google-extended" },
  ];

  const readability = readabilityLabel(aeo?.readability || 0);

  const handleTabClick = (tabId: TabType, locked: boolean) => {
    setActiveTab(tabId);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Inline mode: no overlay, no height constraint ────────────────────────────
  if (inline) {
    return (
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#12121a] rounded-t-xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="truncate">
              <h2 className="text-white font-medium text-base truncate">{data.url}</h2>
              <p className="text-xs text-gray-500">RankFlow AEO Audit · {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-2 text-white/30 hover:text-white/70 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-white/5 bg-[#0a0a0f] overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id, tab.locked)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.locked && <Lock className="w-3 h-3 ml-1 opacity-50" />}
            </button>
          ))}
        </div>

        {/* Content — no height limit, flows as page */}
        <div className="p-6 bg-[#050508]">
          <TabContent
            activeTab={activeTab}
            isLoggedIn={isLoggedIn}
            data={data} metrics={metrics} issues={issues}
            healthScore={healthScore} aeo={aeo}
            overallScore={overallScore}
            AI_BOTS={AI_BOTS} readability={readability}
            url={url} copied={copied} onCopy={handleCopy}
          />
        </div>
      </div>
    );
  }

  // ── Modal mode: fixed overlay + constrained height ───────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-5xl mx-auto bg-[#0a0a0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">

        {/* Header */}
        <div className="shrink-0 p-4 border-b border-white/5 bg-[#12121a] flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="truncate">
              <h2 className="text-white font-medium text-lg truncate">{data.url}</h2>
              <p className="text-xs text-gray-500">RankFlow AEO Auditor · {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!isLoggedIn && (
              <Link to="/auth" search={{ website: url }} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-md transition-colors">
                Sign In to Unlock
              </Link>
            )}
            {onClose && (
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex items-center gap-1 px-4 pt-4 border-b border-white/5 bg-[#0a0a0f] overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id, tab.locked)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.locked && <Lock className="w-3 h-3 ml-1 opacity-50" />}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar bg-[#050508]">
          <TabContent
            activeTab={activeTab}
            isLoggedIn={isLoggedIn}
            data={data} metrics={metrics} issues={issues}
            healthScore={healthScore} aeo={aeo}
            overallScore={overallScore}
            AI_BOTS={AI_BOTS} readability={readability}
            url={url} copied={copied} onCopy={handleCopy}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Tab Content (shared between modal & inline) ────────────────────────────────

function TabContent({ activeTab, isLoggedIn, data, metrics, issues, healthScore, aeo, overallScore, AI_BOTS, readability, url, copied, onCopy }: any) {
  // Auth gate for locked tabs
  const tabs = [
    { id: 'overview', locked: false },
    { id: 'ai-visibility', locked: !isLoggedIn },
    { id: 'ai-access', locked: !isLoggedIn },
    { id: 'content', locked: !isLoggedIn },
    { id: 'schema', locked: !isLoggedIn },
    { id: 'llms', locked: !isLoggedIn },
  ];
  const currentTab = tabs.find(t => t.id === activeTab);
  if (currentTab?.locked) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center text-center max-w-md mx-auto py-12">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Premium Insights Locked</h3>
        <p className="text-gray-400 mb-8">
          Sign in to your RankFlow account to access deep-dive metrics on AI visibility, crawler access rules, content readability, and schema validation.
        </p>
        <div className="flex gap-4 w-full">
          <Link to="/auth" search={{ website: url }} className="flex-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors text-center">
            Sign In
          </Link>
          <Link to="/auth" search={{ website: url }} className="flex-1 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-colors text-center">
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  // ── Tab 1: Overview ─────────────────────────────────────────────────────────
  if (activeTab === 'overview') {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Dial Score */}
          <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center">
            <span className="text-sm font-semibold text-gray-400 mb-4">AEO Overall Score</span>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <ScoreRing score={overallScore} />
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-white">{overallScore}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Out of 100</span>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="md:col-span-2 bg-[#0a0a0f] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Score Breakdown</h3>
            <div className="space-y-4">
              {[
                { label: "Technical Health", value: healthScore, color: "bg-emerald-500" },
                { label: "AI Content Visibility", value: aeo?.visibilityScore || 0, color: "bg-indigo-500" },
                { label: "Content Readability (Flesch)", value: aeo?.readability || 0, color: "bg-amber-500" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{label}</span>
                    <span className="font-medium text-white">{value}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Essential Checklist */}
        <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">AI Essential Checklist</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { label: "Meta Title", ok: !!metrics.title },
              { label: "Meta Description", ok: !!metrics.description },
              { label: "H1 Tag", ok: metrics.h1s?.length > 0 },
              { label: "Schema.org JSON-LD", ok: metrics.schemas?.length > 0, warn: true },
              { label: "llms.txt", ok: aeo?.llmsTxtStatus !== "Not found", warn: true },
              { label: "robots.txt", ok: (aeo?.robotsTxt?.length || 0) > 0, warn: true },
            ].map(({ label, ok, warn }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg ring-1 ring-white/[0.04]">
                <div className="flex items-center gap-3">
                  {ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : warn ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  )}
                  <span className="text-sm text-gray-200">{label}</span>
                </div>
                <span className={`text-xs font-medium ${ok ? "text-emerald-400" : warn ? "text-amber-400" : "text-red-400"}`}>
                  {ok ? "Present" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Issues Detected */}
        {issues && issues.length > 0 && (
          <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Issues Detected ({issues.length})
            </h3>
            <div className="space-y-2.5">
              {issues.map((issue: any) => (
                <div key={issue.id} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg ring-1 ring-white/[0.04]">
                  {issue.type === "error" ? (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white">{issue.title}</div>
                    <div className="text-xs text-white/40 mt-0.5">{issue.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Tab 2: AI Visibility ────────────────────────────────────────────────────
  if (activeTab === 'ai-visibility') {
    const topWords = aeo?.topWords || [];
    return (
      <div className="space-y-6">
        {/* Coverage Gauge + Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center">
            <span className="text-sm font-semibold text-gray-400 mb-4">Crawler Text Extraction Ratio</span>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <ScoreRing score={aeo?.visibilityScore || 0} color="#6366f1" />
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-white">{aeo?.visibilityScore || 0}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Out of 100</span>
              </div>
            </div>
            <p className="text-[11px] text-white/30 text-center mt-3 leading-relaxed">
              How much of the visible text an AI bot UA can extract vs a browser render.
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-4 content-start">
            <StatCard label="Agent Word Count" value={(aeo?.agentWords || 0).toLocaleString()} sub="Extracted by crawler UA" />
            <StatCard label="Human Word Count" value={(aeo?.humanWords || 0).toLocaleString()} sub="Rendered by browser" />
            <StatCard label="Page Size" value={`${aeo?.pageSizeKb || 0} KB`} sub="Raw HTML size" />
            <StatCard label="Total Links" value={metrics?.totalLinks || 0} sub="External links found" />
          </div>
        </div>

        {/* Top Keywords Bar Chart */}
        {topWords.length > 0 && (
          <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Top Keywords (by frequency)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topWords} layout="vertical" margin={{ left: 8, right: 24 }}>
                <XAxis type="number" tick={{ fill: "#ffffff40", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="phrase" tick={{ fill: "#ffffffcc", fontSize: 12 }} width={100} axisLine={false} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", fontSize: 12 }}
                  formatter={(v: any, _: any, props: any) => [`${v} (${props.payload.percent}%)`, "Count"]}
                />
                <Bar dataKey="count" radius={4} maxBarSize={18}>
                  {topWords.map((_: any, i: number) => (
                    <Cell key={i} fill={i === 0 ? "#6366f1" : i === 1 ? "#818cf8" : "#a5b4fc"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Agent vs Human Text Snippets */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" /> Agent View (Crawler UA)
            </h3>
            <pre className="text-[11px] text-white/50 font-mono leading-relaxed bg-black/30 rounded-lg p-3 whitespace-pre-wrap overflow-hidden line-clamp-[10]">
              {aeo?.agentTextSnippet || "No data extracted."}
            </pre>
          </div>
          <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" /> Human View (Browser Render)
            </h3>
            <p className="text-[11px] text-white/50 leading-relaxed bg-black/30 rounded-lg p-3 line-clamp-[10]">
              {aeo?.humanTextSnippet || "No data extracted."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Tab 3: AI Access ────────────────────────────────────────────────────────
  if (activeTab === 'ai-access') {
    return (
      <div className="space-y-6">
        {/* AI Bot Access Table */}
        <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" /> AI Crawler Access
          </h3>
          <div className="space-y-2.5">
            {AI_BOTS.map((bot: any) => (
              <BotRow key={bot.userAgent} name={bot.name} userAgent={bot.userAgent} robotsTxt={aeo?.robotsTxt || ""} />
            ))}
          </div>
        </div>

        {/* Meta Robots + llms.txt Status */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Meta Robots Tag</h3>
            {metrics?.robotsMeta ? (
              <div className="flex items-center gap-2">
                <code className="text-sm text-white/70 font-mono bg-black/30 rounded px-2 py-1">{metrics.robotsMeta}</code>
                {(metrics.robotsMeta.includes("noindex") || metrics.robotsMeta.includes("noai")) ? (
                  <span className="text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-semibold">Restrictive</span>
                ) : (
                  <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">OK</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/40">No <code className="font-mono">meta[name="robots"]</code> tag found.</p>
            )}
          </div>
          <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">llms.txt Status</h3>
            {aeo?.llmsTxtStatus !== "Not found" ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-emerald-300 font-medium">{aeo?.llmsTxtStatus}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-amber-300 font-medium">Not found</span>
              </div>
            )}
          </div>
        </div>

        {/* robots.txt Raw */}
        <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">robots.txt Content</h3>
            {aeo?.robotsTxt && (
              <button
                onClick={() => onCopy(aeo.robotsTxt)}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>
          {aeo?.robotsTxt ? (
            <pre className="text-[11px] text-white/60 font-mono leading-relaxed bg-black/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
              {aeo.robotsTxt}
            </pre>
          ) : (
            <p className="text-sm text-white/30 italic">robots.txt not found or empty.</p>
          )}
        </div>
      </div>
    );
  }

  // ── Tab 4: Content ──────────────────────────────────────────────────────────
  if (activeTab === 'content') {
    const topWords = aeo?.topWords || [];
    return (
      <div className="space-y-6">
        {/* Readability Gauge + Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center">
            <span className="text-sm font-semibold text-gray-400 mb-4">Flesch Readability</span>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <ScoreRing score={aeo?.readability || 0} color={readability.color} />
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-white">{aeo?.readability || 0}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">/ 100</span>
              </div>
            </div>
            <span className="mt-3 text-sm font-semibold" style={{ color: readability.color }}>{readability.label}</span>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-4 content-start">
            <StatCard label="Word Count" value={(aeo?.humanWords || 0).toLocaleString()} sub="Visible text words" />
            <StatCard label="Page Size" value={`${aeo?.pageSizeKb || 0} KB`} sub="Raw HTML" />
            <StatCard label="Total Links" value={metrics?.totalLinks || 0} sub="Detected on page" />
            <StatCard label="H1 Tags" value={metrics?.h1s?.length || 0} sub="Should be exactly 1" />
          </div>
        </div>

        {/* H1 Tags */}
        {metrics?.h1s?.length > 0 && (
          <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-3">H1 Tags Found</h3>
            <div className="space-y-2">
              {metrics.h1s.map((h1: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg">
                  <span className="text-xs text-indigo-400 font-bold font-mono bg-indigo-500/10 px-2 py-0.5 rounded shrink-0">H1</span>
                  <span className="text-sm text-white/80">{h1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canonical URL */}
        {metrics?.canonical && (
          <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Canonical URL</h3>
            <div className="flex items-center gap-2">
              <code className="text-sm text-white/60 font-mono bg-black/30 rounded px-2 py-1 flex-1 truncate">{metrics.canonical}</code>
              <button
                onClick={() => onCopy(metrics.canonical)}
                className="shrink-0 p-1.5 text-white/30 hover:text-white/70 transition-colors"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Top Keywords Table */}
        {topWords.length > 0 && (
          <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Top Keyword Frequency</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-white/30 border-b border-white/5">
                    <th className="text-left py-2 pr-4 font-semibold">Keyword</th>
                    <th className="text-right py-2 pr-4 font-semibold">Count</th>
                    <th className="text-right py-2 font-semibold">% of Words</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {topWords.map((w: any, i: number) => (
                    <tr key={i} className="text-white/70 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 pr-4 font-medium text-white/90">{w.phrase}</td>
                      <td className="text-right py-2 pr-4 tabular-nums">{w.count}</td>
                      <td className="text-right py-2 tabular-nums text-white/40">{w.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Tab 5: Schema ───────────────────────────────────────────────────────────
  if (activeTab === 'schema') {
    const schemaTypes = aeo?.schemaTypes || [];
    const schemas = metrics?.schemas || [];
    return (
      <div className="space-y-6">
        {/* Schema Summary */}
        <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Detected Schema Types</h3>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${schemas.length > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
              {schemas.length} JSON-LD Block{schemas.length !== 1 ? "s" : ""}
            </span>
          </div>
          {schemaTypes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {schemaTypes.map((type: string, i: number) => (
                <span key={i} className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
                  {type}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-amber-500/5 rounded-lg border border-amber-500/10">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-300">No Schema.org types detected</p>
                <p className="text-xs text-white/40 mt-0.5">Add JSON-LD structured data to help AI engines understand your content.</p>
              </div>
            </div>
          )}
        </div>

        {/* JSON-LD Blocks */}
        {schemas.length > 0 ? (
          <div className="space-y-4">
            {schemas.map((schema: any, i: number) => (
              <div key={i} className="bg-[#0a0a0f] border border-white/5 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    JSON-LD Block #{i + 1}
                    {schema["@type"] && (
                      <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">{schema["@type"]}</span>
                    )}
                  </h3>
                </div>
                <pre className="text-[11px] text-white/60 font-mono leading-relaxed bg-black/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {JSON.stringify(schema, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-semibold text-white">How to Add Schema Markup</h3>
            {[
              { step: "1", text: "Choose a schema type from schema.org (e.g. Organization, Article, FAQPage)" },
              { step: "2", text: 'Add a <script type="application/ld+json"> block to your page <head>' },
              { step: "3", text: "Fill in the required properties (name, url, description, etc.)" },
              { step: "4", text: "Validate using Google's Rich Results Test or Schema.org validator" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">{step}</span>
                <span className="text-sm text-white/60">{text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Tab 6: llms.txt ─────────────────────────────────────────────────────────
  if (activeTab === 'llms') {
    const found = aeo?.llmsTxtStatus !== "Not found";
    return (
      <div className="space-y-6">
        {/* Status Banner */}
        <div className={`rounded-xl p-6 border flex items-start gap-4 ${found ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${found ? "bg-emerald-500/15" : "bg-amber-500/15"}`}>
            {found ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <AlertTriangle className="w-6 h-6 text-amber-400" />}
          </div>
          <div>
            <h2 className={`text-lg font-bold ${found ? "text-emerald-300" : "text-amber-300"}`}>
              {found ? aeo?.llmsTxtStatus : "llms.txt Not Found"}
            </h2>
            <p className="text-sm text-white/50 mt-1">
              {found
                ? "Great! This site has an llms.txt file that helps AI models understand its content and constraints."
                : `No llms.txt file was found at ${url.replace(/\/$/, "")}/llms.txt. This means AI agents have no structured index of your content.`}
            </p>
          </div>
        </div>

        {/* What is llms.txt */}
        <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400" /> What is llms.txt?
          </h3>
          <p className="text-sm text-white/50 leading-relaxed">
            <code className="font-mono text-indigo-300">llms.txt</code> is a plain-text or Markdown file placed at the root of your website that gives AI language models a structured index of your content — including trusted URLs, documentation, product information, and usage constraints. It's the AI-native equivalent of <code className="font-mono text-white/40">sitemap.xml</code>.
          </p>
        </div>

        {/* If not found: 3-step guide */}
        {!found && (
          <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">How to Add llms.txt (3 Steps)</h3>
            <div className="space-y-3">
              {[
                { step: "1", title: "Create the file", desc: "Create a file called llms.txt at your domain root (e.g. https://yourdomain.com/llms.txt)" },
                { step: "2", title: "Add required content", desc: "Include an H1 heading (# Site Name), a short description, and at least 5 links to key pages with context." },
                { step: "3", title: "Optionally add llms-full.txt", desc: "Create a companion llms-full.txt with your full documentation content in clean Markdown for LLMs to ingest." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-4 p-4 bg-white/[0.02] rounded-lg ring-1 ring-white/[0.04]">
                  <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-bold flex items-center justify-center shrink-0">{step}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{title}</div>
                    <div className="text-xs text-white/40 mt-0.5 leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <a
                href="https://llmstxt.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                Learn more at llmstxt.org <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* If found: additional details */}
        {found && (
          <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-3">Next Steps</h3>
            <div className="space-y-3">
              {[
                "Keep your llms.txt updated as you publish new pages",
                "Consider adding llms-full.txt for richer AI model ingestion",
                "Ensure the file is publicly accessible (no auth, no redirect)",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-white/60">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
