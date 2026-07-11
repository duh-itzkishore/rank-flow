import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, RefreshCw, Loader2, ShieldCheck } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";
import { useState, useEffect } from "react";

type SEOAuditSearch = {
  website?: string;
};

export const Route = createFileRoute("/app/seo-audit")({
  validateSearch: (search: Record<string, unknown>): SEOAuditSearch => {
    return {
      website: search.website as string | undefined,
    };
  },
  component: SEOAudit,
});

function SEOAudit() {
  const { website } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async (targetUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const encodedUrl = encodeURIComponent(targetUrl);
      const res = await fetch(`/api/seo-audit?url=${encodedUrl}`);
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || "Unknown error");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (website) {
      runAudit(website);
    }
  }, [website]);

  const issues = data?.issues || [];
  const healthScore = data?.healthScore || 0;
  
  const HEALTH_DATA = [
    { name: "Healthy", value: healthScore, color: "#22c55e" },
    { name: "Warnings", value: Math.max(0, 100 - healthScore) / 2, color: "#f59e0b" },
    { name: "Errors", value: Math.max(0, 100 - healthScore) / 2, color: "#ef4444" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Technical SEO Audit {website ? `for ${website}` : ''}</h1>
          <p className="mt-1 text-sm text-white/40">Crawl report inspired by Screaming Frog advanced metrics</p>
        </div>
        <button 
          onClick={() => website ? runAudit(website) : null}
          disabled={loading || !website}
          className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08] transition-colors ring-1 ring-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Crawling...' : 'Run New Crawl'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overall Health Card */}
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
          <h2 className="text-base font-semibold text-white mb-6">Site Health Score</h2>
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HEALTH_DATA} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Bar dataKey="value" barSize={12} radius={10}>
                    {HEALTH_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold text-white">{healthScore}</span>
                <span className="text-xs text-white/40 mt-1 uppercase tracking-wider">Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="lg:col-span-2 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
          <h2 className="text-base font-semibold text-white mb-4">Crawl Issues</h2>
          {error && <div className="text-red-400 text-sm mb-4">Error: {error}</div>}
          {!website && !loading && !data && (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
              <ShieldCheck className="w-12 h-12 text-indigo-500 mb-4 opacity-80" />
              <h3 className="text-base font-semibold text-white">No Website Selected</h3>
              <p className="text-sm text-white/40 mt-1 mb-6">
                Enter your website URL below to run a Screaming Frog-style technical SEO and AEO audit.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget.elements.namedItem("auditUrl") as HTMLInputElement;
                  if (target?.value) {
                    navigate({ to: '.', search: { website: target.value } });
                  }
                }}
                className="w-full flex gap-2"
              >
                <input
                  name="auditUrl"
                  type="url"
                  placeholder="https://example.com"
                  required
                  className="flex-1 rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  Audit Site
                </button>
              </form>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-white/50">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm">Running Playwright crawler on {website}...</p>
            </div>
          )}
          {!loading && data && (
            <div className="space-y-3">
              {issues.length === 0 ? (
                <div className="text-emerald-400 text-sm py-4 text-center">No issues found. Excellent!</div>
              ) : (
                issues.map((issue: any) => (
              <div key={issue.id} className="flex items-start gap-4 rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/[0.04]">
                <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${issue.type === 'error' ? 'bg-red-500/10 text-red-400' : issue.type === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {issue.type === 'error' ? <XCircle className="w-5 h-5" /> : issue.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white">{issue.title}</h3>
                    <span className="text-xs font-semibold text-white/80 bg-white/10 px-2 py-0.5 rounded-md">{issue.count} pages</span>
                  </div>
                  <p className="text-sm text-white/50 mt-1">{issue.description}</p>
                </div>
                <button className="text-indigo-400 hover:text-indigo-300 p-2 shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            )))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
