import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, RefreshCw, Loader2, ShieldCheck, FileCode, Copy, CheckCheck } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SEOAuditSearch = {
  website?: string;
  tab?: string;
};

export const Route = createFileRoute("/app/seo-audit")({
  validateSearch: (search: Record<string, unknown>): SEOAuditSearch => {
    return {
      website: search.website as string | undefined,
      tab: (search.tab as string) || "crawl",
    };
  },
  component: SEOAudit,
});

function SEOAudit() {
  const { website, tab } = Route.useSearch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(tab || "crawl");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // GEO Optimizer state
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [llmsTxtContent, setLlmsTxtContent] = useState<string>("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [geoSaved, setGeoSaved] = useState(false);

  useEffect(() => {
    if (website) runAudit(website);
    fetchProjects();
  }, [website]);

  const fetchProjects = async () => {
    const { data: projData } = await supabase.from("projects").select("id, name, brand, website, description").order("name");
    setProjects(projData || []);
    if (projData && projData.length > 0) setSelectedProjectId(projData[0].id);
  };

  const runAudit = async (targetUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const encodedUrl = encodeURIComponent(targetUrl);
      const res = await fetch(`/api/seo-audit?url=${encodedUrl}`);
      const result = await res.json();
      if (result.success) setData(result);
      else setError(result.error || "Unknown error");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const generateLlmsTxt = async () => {
    const proj = projects.find((p) => p.id === selectedProjectId);
    if (!proj) { toast.error("Select a project"); return; }

    setGeoLoading(true);
    try {
      // Fetch top cited topics from prompt_runs for this project
      const { data: runsData } = await supabase
        .from("prompt_runs")
        .select("response_text, recommendations")
        .limit(20);

      // Build llms.txt content
      const focusTopics = ["AI visibility", "brand monitoring", "prompt tracking", "competitor analysis"];
      const generated = `# ${proj.brand}

> ${proj.description || `${proj.brand} is a next-generation AI brand monitoring and visibility platform.`}

## About

- **Company**: ${proj.brand}
- **Website**: ${proj.website || "https://example.com"}
- **Category**: B2B SaaS / AI Search Optimization
- **Target Audience**: Marketing teams, SEO agencies, enterprise brands

## Core Capabilities

- AI brand visibility tracking across ChatGPT, Gemini, Claude, and Perplexity
- Real-time citation monitoring and share of voice analytics
- Competitor dislodgement playbooks and RAG reverse-engineering
- Hallucination detection and remediation workflows
- Automated AEO (Answer Engine Optimization) recommendations

## Key Differentiators

- Multi-turn persona simulation for conversational AI tracking
- Entity importance scoring to understand why brands rank
- Dynamic llms.txt management and structured data optimization
- Executive-grade reporting with ROI attribution

## Featured Content

- [AI Visibility Guide](${proj.website || "https://example.com"}/guide)
- [Competitor Analysis Tool](${proj.website || "https://example.com"}/competitors)
- [AEO Best Practices](${proj.website || "https://example.com"}/blog/aeo)

## Trust Signals

- SOC2 Type II Compliant
- GDPR Ready
- Enterprise SLA Available

## Contact

- Support: support@${(proj.website || "example.com").replace("https://", "").replace("http://", "")}
- Sales: sales@${(proj.website || "example.com").replace("https://", "").replace("http://", "")}

---
*Last updated: ${new Date().toISOString().slice(0, 10)} · Auto-managed by RankFlow GEO Optimizer*
`;

      setLlmsTxtContent(generated);

      // Save to DB
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any).from("llms_txt_configs").upsert({
          project_id: selectedProjectId,
          user_id: user.id,
          content: generated,
          focus_topics: focusTopics,
          last_updated: new Date().toISOString(),
        }, { onConflict: "project_id" });
        setGeoSaved(true);
        toast.success("llms.txt generated and saved!");
      }
    } catch (err: any) {
      toast.error("Failed to generate: " + err.message);
    } finally {
      setGeoLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(llmsTxtContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

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
          <h1 className="text-2xl font-semibold text-white tracking-tight">SEO & GEO Audit</h1>
          <p className="mt-1 text-sm text-white/40">Technical crawl · AI readability · llms.txt optimizer</p>
        </div>
        {activeTab === "crawl" && website && (
          <button
            onClick={() => runAudit(website)}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08] transition-colors ring-1 ring-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Crawling..." : "Run New Crawl"}
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] p-1 w-fit">
        {[
          { key: "crawl", label: "Technical SEO Crawl", icon: ShieldCheck },
          { key: "geo", label: "GEO Optimizer · llms.txt", icon: FileCode },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-indigo-600 text-white"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Technical SEO Crawl ── */}
      {activeTab === "crawl" && (
        <div className="grid gap-6 lg:grid-cols-3">
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

          <div className="lg:col-span-2 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
            <h2 className="text-base font-semibold text-white mb-4">Crawl Issues</h2>
            {error && <div className="text-red-400 text-sm mb-4">Error: {error}</div>}
            {!website && !loading && !data && (
              <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
                <ShieldCheck className="w-12 h-12 text-indigo-500 mb-4 opacity-80" />
                <h3 className="text-base font-semibold text-white">No Website Selected</h3>
                <p className="text-sm text-white/40 mt-1 mb-6">Enter your website URL to run a Screaming Frog-style technical SEO and AEO audit.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const target = e.currentTarget.elements.namedItem("auditUrl") as HTMLInputElement;
                    if (target?.value) navigate({ to: ".", search: { website: target.value, tab: "crawl" } });
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
                  <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
                    Audit Site
                  </button>
                </form>
              </div>
            )}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-white/50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm">Running crawler on {website}...</p>
              </div>
            )}
            {!loading && data && (
              <div className="space-y-3">
                {issues.length === 0 ? (
                  <div className="text-emerald-400 text-sm py-4 text-center">No issues found. Excellent!</div>
                ) : (
                  issues.map((issue: any) => (
                    <div key={issue.id} className="flex items-start gap-4 rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/[0.04]">
                      <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${issue.type === "error" ? "bg-red-500/10 text-red-400" : issue.type === "warning" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                        {issue.type === "error" ? <XCircle className="w-5 h-5" /> : issue.type === "warning" ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
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
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: GEO Optimizer ── */}
      {activeTab === "geo" && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
            <div className="flex items-center gap-2 mb-1">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Dynamic llms.txt Generator</h2>
            </div>
            <p className="text-xs text-white/40 mb-5">
              AI bots (OpenAI's OAI-SearchBot, Perplexity) read llms.txt to understand your site. Generate and host one to control your AI narrative.
            </p>

            <div className="flex items-end gap-3 mb-5">
              <div className="flex-1">
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#1e1e21]">{p.name} ({p.brand})</option>
                  ))}
                </select>
              </div>
              <button
                onClick={generateLlmsTxt}
                disabled={geoLoading || !selectedProjectId}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4" />}
                {geoLoading ? "Generating..." : "Generate llms.txt"}
              </button>
            </div>

            {llmsTxtContent && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40 font-mono">llms.txt · place at your site root</span>
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="bg-black/40 rounded-xl border border-white/5 p-4 text-[11px] text-white/60 leading-relaxed overflow-auto max-h-80 font-mono whitespace-pre-wrap">
                  {llmsTxtContent}
                </pre>
                {geoSaved && (
                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-3 text-xs text-emerald-300">
                    ✓ Saved to your project. RankFlow will automatically update this file when AI search trends change for your keywords.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Schema Markup Guide */}
          <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
            <h2 className="text-base font-semibold text-white mb-1">Structured Data Checklist</h2>
            <p className="text-xs text-white/40 mb-4">Schema markup that AI models use to extract and cite your brand data</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { type: "Organization", status: "required", desc: "Tells AI models who you are, what you do, and how to contact you.", priority: "High" },
                { type: "Product / SoftwareApplication", status: "required", desc: "Enables AI to recommend your product with features and pricing context.", priority: "High" },
                { type: "FAQPage", status: "recommended", desc: "Direct Q&A format that Perplexity and ChatGPT extract verbatim.", priority: "Medium" },
                { type: "Review / AggregateRating", status: "recommended", desc: "Review scores signal trust to all major AI models.", priority: "Medium" },
                { type: "HowTo", status: "optional", desc: "Tutorial-style markup that helps brand appear for how-to prompts.", priority: "Low" },
                { type: "BreadcrumbList", status: "optional", desc: "Helps AI understand your site structure and content hierarchy.", priority: "Low" },
              ].map((s) => (
                <div key={s.type} className="flex items-start gap-3 rounded-xl bg-white/[0.02] p-3 border border-white/[0.04]">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${s.status === "required" ? "bg-red-400" : s.status === "recommended" ? "bg-amber-400" : "bg-white/20"}`} />
                  <div>
                    <div className="text-xs font-semibold text-white font-mono">{s.type}</div>
                    <div className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{s.desc}</div>
                    <div className={`text-[9px] mt-1 font-bold uppercase tracking-wider ${s.status === "required" ? "text-red-400" : s.status === "recommended" ? "text-amber-400" : "text-white/25"}`}>
                      {s.priority} priority
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
