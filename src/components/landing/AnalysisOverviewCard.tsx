import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { 
  CheckCircle2, AlertCircle, AlertTriangle, X, 
  ArrowRight, Globe, Lock, Eye, Shield, FileText, Database, Zap, Code, Search
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisOverviewCardProps {
  url: string;
  isLoggedIn?: boolean;
  onClose?: () => void;
}

type TabType = 'overview' | 'ai-visibility' | 'ai-access' | 'content' | 'schema' | 'llms';

export function AnalysisOverviewCard({ url, isLoggedIn: propIsLoggedIn, onClose }: AnalysisOverviewCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoggedIn, setIsLoggedIn] = useState(propIsLoggedIn ?? false);

  useEffect(() => {
    if (propIsLoggedIn !== undefined) {
      setIsLoggedIn(propIsLoggedIn);
      return;
    }
    // Check local session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [propIsLoggedIn]);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        setLoading(true);
        const res = await fetch(`/api/seo-audit?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        
        if (!json.success) {
          throw new Error(json.error || "Analysis failed");
        }
        
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (url) {
      fetchAnalysis();
    }
  }, [url]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-[#07070a]/95 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center shadow-2xl max-w-md w-full animate-pulse relative">
          {onClose && (
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
            Please wait while our agent crawls the page, parses AI bots access, and evaluates AEO metrics. This deep scan takes about 5-10 seconds.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="flex flex-col items-center justify-center p-12 bg-[#0e0e12] rounded-2xl border border-red-500/20 text-center relative max-w-md w-full shadow-2xl">
          {onClose && (
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
      </div>
    );
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

  const handleTabClick = (tabId: TabType, locked: boolean) => {
    if (locked) {
      // If they click a locked tab, we could show a toast or auto-redirect.
      // For now, we'll let it set the activeTab so the Auth Gate UI renders in the body.
    }
    setActiveTab(tabId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-5xl mx-auto bg-[#0a0a0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        
        {/* Header & URL */}
        <div className="shrink-0 p-4 border-b border-white/5 bg-[#12121a] flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="truncate">
              <h2 className="text-white font-medium text-lg truncate">{data.url}</h2>
              <p className="text-xs text-gray-500">RankFlow AEO Auditor • {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isLoggedIn && (
              <Link to="/auth" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-md transition-colors">
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

        {/* Navigation Tabs */}
        <div className="shrink-0 flex items-center gap-1 px-4 pt-4 border-b border-white/5 bg-[#0a0a0f] overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id, tab.locked)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.locked && <Lock className="w-3 h-3 ml-1 opacity-50" />}
            </button>
          ))}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar bg-[#050508]">
          
          {/* Auth Gate Overlay if tab is locked */}
          {(tabs.find(t => t.id === activeTab)?.locked) ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                <Lock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Premium Insights Locked</h3>
              <p className="text-gray-400 mb-8">
                Sign in to your RankFlow account to access deep-dive metrics on AI visibility, crawler access rules, content readability, and schema validation.
              </p>
              <div className="flex gap-4 w-full">
                <Link to="/auth" className="flex-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors">
                  Sign In
                </Link>
                <Link to="/auth" className="flex-1 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-colors">
                  Create Account
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* TAB CONTENT: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Dial Score */}
                    <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center">
                      <span className="text-sm font-semibold text-gray-400 mb-4">AEO Overall Score</span>
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                          <circle 
                            cx="50" cy="50" r="45" fill="none" 
                            stroke={overallScore > 80 ? "#22c55e" : overallScore > 50 ? "#f59e0b" : "#ef4444"} 
                            strokeWidth="8" 
                            strokeDasharray={`${overallScore * 2.83} 283`} 
                            strokeLinecap="round" 
                          />
                        </svg>
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
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">Technical Health</span>
                            <span className="font-medium text-white">{healthScore}/100</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${healthScore}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">AI Content Visibility</span>
                            <span className="font-medium text-white">{aeo?.visibilityScore || 0}/100</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${aeo?.visibilityScore || 0}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">Content Readability (Flesch)</span>
                            <span className="font-medium text-white">{aeo?.readability || 0}/100</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${aeo?.readability || 0}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">AI Essential Checklist</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          {metrics.title ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                          <span className="text-sm text-gray-200">Meta Title</span>
                        </div>
                        <span className="text-xs text-gray-500">{metrics.title ? "Present" : "Missing"}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          {metrics.description ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                          <span className="text-sm text-gray-200">Meta Description</span>
                        </div>
                        <span className="text-xs text-gray-500">{metrics.description ? "Present" : "Missing"}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          {metrics.h1s.length > 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                          <span className="text-sm text-gray-200">H1 Tag</span>
                        </div>
                        <span className="text-xs text-gray-500">{metrics.h1s.length > 0 ? "Present" : "Missing"}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          {metrics.schemas?.length > 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          <span className="text-sm text-gray-200">Schema.org JSON-LD</span>
                        </div>
                        <span className="text-xs text-gray-500">{metrics.schemas?.length > 0 ? "Present" : "Missing"}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          {aeo?.llmsTxtStatus !== "Not found" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          <span className="text-sm text-gray-200">llms.txt</span>
                        </div>
                        <span className="text-xs text-gray-500">{aeo?.llmsTxtStatus !== "Not found" ? "Found" : "Not Found"}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          {(aeo?.robotsTxt?.length || 0) > 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          <span className="text-sm text-gray-200">robots.txt</span>
                        </div>
                        <span className="text-xs text-gray-500">{(aeo?.robotsTxt?.length || 0) > 0 ? "Present" : "Missing"}</span>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* OTHER TABS WOULD GO HERE (But they are locked for non-logged in users) */}
              
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Ensure Recharts tooltip is styled correctly if used later
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#12121a] border border-white/10 p-3 rounded-lg shadow-xl">
        <p className="text-white text-sm font-medium">{`${payload[0].name} : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};
