import { useState } from "react";
import { runAeoAudit } from "@/server-fns/aeo-crawler";
import { ShieldCheck, RefreshCw, Loader2, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Activity, Cpu } from "lucide-react";
import { toast } from "sonner";

interface AeoAuditRunnerProps {
  projectId: string;
  websiteUrl?: string;
  onAuditComplete?: () => void;
}

export function AeoAuditRunner({ projectId, websiteUrl = "", onAuditComplete }: AeoAuditRunnerProps) {
  const [url, setUrl] = useState(websiteUrl);
  const [maxPages, setMaxPages] = useState(10);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error("Please enter a valid URL");
      return;
    }
    if (!projectId) {
      toast.error("Please select or create a project first");
      return;
    }

    setLoading(true);
    setReport(null);
    try {
      const data = await runAeoAudit({ data: { url, projectId, maxPages } });
      setReport(data);
      toast.success("AEO Audit completed successfully!");
      if (onAuditComplete) onAuditComplete();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to run AEO Audit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar / Trigger */}
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
        <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          AEO Discovery Crawler
        </h2>
        <p className="text-xs text-white/40 mb-6">
          Analyze how AI bots (like ChatGPT, Claude, Perplexity) crawl and view your website. Run a sitemap-based crawler to discover indexability issues, missing schema, and optimization areas.
        </p>

        <form onSubmit={handleRunAudit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors"
              required
            />
          </div>
          <div className="w-full sm:w-32">
            <select
              value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value))}
              className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
            >
              <option value="5" className="bg-[#1e1e21]">5 pages</option>
              <option value="10" className="bg-[#1e1e21]">10 pages</option>
              <option value="20" className="bg-[#1e1e21]">20 pages</option>
              <option value="30" className="bg-[#1e1e21]">30 pages</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Auditing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Run AEO Audit
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Dashboard */}
      {report && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Scoring Summary Widget */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 text-center flex flex-col items-center justify-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Provisional Grade</span>
              <div className="w-24 h-24 rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/30 flex items-center justify-center text-4xl font-extrabold text-indigo-400 mb-4">
                {report.scoring.provisionalGrade}
              </div>
              <div className="text-sm font-medium text-white/80">
                Score: {report.scoring.provisionalScore}/100
              </div>
              <p className="text-[11px] text-white/40 mt-3 leading-relaxed">
                Foundational: {report.scoring.foundationalScore} · Heuristic: {report.scoring.heuristicIntelligenceScore}
              </p>
            </div>

            {/* Template Coverage */}
            <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Page Type Coverage</h3>
              <div className="space-y-3">
                {report.coverage.map((c: any) => (
                  <div key={c.pageType} className="flex items-center justify-between text-xs">
                    <span className="capitalize text-white/70">{c.pageType}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">{c.pages} pages</span>
                      <span className="font-semibold text-white bg-white/5 px-2 py-0.5 rounded-md">{c.avgScore}% avg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Core Findings & Checks list */}
          <div className="md:col-span-2 space-y-6">
            {/* Intelligence Signals */}
            <div className="rounded-2xl bg-[#1a1a1c] ring-1 ring-white/[0.06] p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Heuristic Intelligence Signals
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {report.heuristicIntelligenceSignals.map((signal: any) => (
                  <div key={signal.id} className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.04] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white/80">{signal.signal}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        signal.score >= 80 ? "bg-emerald-500/10 text-emerald-400" :
                        signal.score >= 60 ? "bg-amber-500/10 text-amber-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>
                        {signal.score}%
                      </span>
                    </div>
                    <p className="text-[10px] text-white/30">{signal.rationale}</p>
                    <p className="text-[11px] text-white/60 pt-1 leading-normal">{signal.keyFinding}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Prioritized Fixes */}
            {report.prioritizedFixes.length > 0 && (
              <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Prioritized Fixes (Saved as suggestions)
                </h3>
                <div className="space-y-3">
                  {report.prioritizedFixes.map((fix: any, idx: number) => (
                    <div key={idx} className="flex gap-4 rounded-xl bg-[#221f22] border border-amber-500/10 p-4">
                      <div className="shrink-0 rounded bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-400 h-fit">
                        {fix.impact} Impact
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-white">{fix.title}</h4>
                        <p className="text-xs text-white/50">{fix.why}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Checklist */}
            <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">Technical AEO Checks</h3>
              <div className="space-y-2.5">
                {report.checks.map((check: any) => (
                  <div key={check.id} className="flex items-start gap-3 rounded-xl bg-white/[0.01] p-3 border border-white/[0.03] text-xs">
                    <span className="mt-0.5">
                      {check.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{check.label}</div>
                      <div className="text-white/40 mt-0.5 leading-relaxed">{check.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
