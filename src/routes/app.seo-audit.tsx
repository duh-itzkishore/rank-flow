import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";

export const Route = createFileRoute("/app/seo-audit")({
  component: SEOAudit,
});

const MOCK_ISSUES = [
  { id: 1, type: "error", title: "Broken Links (404)", count: 12, description: "Links pointing to pages that don't exist." },
  { id: 2, type: "error", title: "Missing Meta Titles", count: 4, description: "Pages missing crucial title tags for search indexing." },
  { id: 3, type: "warning", title: "Redirect Chains", count: 8, description: "Multiple 301/302 redirects slowing down crawlers." },
  { id: 4, type: "warning", title: "Duplicate H1 Tags", count: 3, description: "Pages with more than one primary heading." },
  { id: 5, type: "success", title: "Sitemap Valid", count: 1, description: "XML sitemap is present and correctly formatted." },
];

const HEALTH_DATA = [
  { name: "Healthy", value: 85, color: "#22c55e" },
  { name: "Warnings", value: 10, color: "#f59e0b" },
  { name: "Errors", value: 5, color: "#ef4444" },
];

function SEOAudit() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Technical SEO Audit</h1>
          <p className="mt-1 text-sm text-white/40">Crawl report inspired by Screaming Frog advanced metrics</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08] transition-colors ring-1 ring-white/10">
          <RefreshCw className="w-4 h-4 text-white/60" />
          Run New Crawl
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
                <span className="text-4xl font-bold text-white">85</span>
                <span className="text-xs text-white/40 mt-1 uppercase tracking-wider">Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="lg:col-span-2 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
          <h2 className="text-base font-semibold text-white mb-4">Crawl Issues</h2>
          <div className="space-y-3">
            {MOCK_ISSUES.map((issue) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
