import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2, Search, ChevronDown, Download, Globe, ExternalLink, Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$projectId/citations")({
  component: Citations,
});

function FilterPill({ label, icon: Icon }: { label: string; icon?: any }) {
  return (
    <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.07] hover:text-white/80 transition-colors whitespace-nowrap">
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {label}
      <ChevronDown className="w-3 h-3 opacity-50 ml-0.5" />
    </button>
  );
}

function Citations() {
  const { projectId } = useParams({ from: "/app/$projectId/citations" });
  const [mentions, setMentions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchMentions(); }, [projectId]);

  async function fetchMentions() {
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from("mentions")
        .select("id, source_url, source_domain, title, snippet, model, created_at, sentiment, is_brand_mention")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(200);
      setMentions(data || []);
    } catch (err: any) {
      toast.error("Failed to load citations: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Domain aggregation
  const domainCounts: Record<string, number> = {};
  mentions.forEach(m => {
    const domain = m.source_domain || (m.source_url ? (() => { try { return new URL(m.source_url).hostname; } catch { return m.source_url; } })() : "unknown");
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  });
  const topDomains = Object.entries(domainCounts)
    .sort(([, a], [, b]) => b - a).slice(0, 10);

  const filtered = mentions.filter(m =>
    !search || m.source_url?.includes(search) || m.title?.toLowerCase().includes(search.toLowerCase()) || m.snippet?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            Citations
            <span className="text-white/20 text-sm" title="Web sources that cite your brand in AI responses">ⓘ</span>
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            {mentions.length} citations across {topDomains.length} domains
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60 hover:bg-white/[0.07] transition-colors">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Citations", value: mentions.length },
          { label: "Unique Domains", value: topDomains.length },
          { label: "Brand Mentions", value: mentions.filter(m => m.is_brand_mention).length },
          { label: "AI Models", value: [...new Set(mentions.map(m => m.model))].filter(Boolean).length },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">{k.label}</div>
            <div className="text-xl font-bold text-white">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Domains sidebar */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <h2 className="text-[13px] font-semibold text-white/80 mb-4">Top Cited Domains</h2>
          {topDomains.length === 0 ? (
            <p className="text-xs text-white/30 py-4">No citation data yet.</p>
          ) : (
            <div className="space-y-3">
              {topDomains.map(([domain, count], i) => {
                const maxCount = topDomains[0][1];
                return (
                  <div key={domain}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1.5 text-white/60">
                        <span className="text-white/30 w-4 text-right">{i + 1}.</span>
                        <Globe className="w-3 h-3 text-white/30" />
                        {domain}
                      </span>
                      <span className="font-semibold text-white/80">{count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.05]">
                      <div
                        className="h-1 rounded-full bg-indigo-500/60"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Citation list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filter bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search citations..."
                className="h-8 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-8 pr-3 text-xs text-white placeholder-white/30 outline-none focus:border-indigo-500/40"
              />
            </div>
            <FilterPill label="Last 30 days" />
            <FilterPill label="United States" icon={Globe} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/40 text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              Loading citations…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
              <Globe className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">
                {mentions.length === 0
                  ? "No citations tracked yet. Run prompt audits to start collecting citation data."
                  : "No citations match your filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(m => (
                <div key={m.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {m.is_brand_mention && (
                          <span className="rounded-full bg-indigo-500/15 text-indigo-400 px-2 py-0.5 text-[9px] font-bold uppercase">Brand Cited</span>
                        )}
                        {m.model && (
                          <span className="rounded-full bg-white/[0.06] text-white/50 px-2 py-0.5 text-[9px] font-semibold capitalize">{m.model}</span>
                        )}
                        {m.sentiment && (
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                            m.sentiment === "positive" ? "bg-emerald-500/15 text-emerald-400"
                              : m.sentiment === "negative" ? "bg-red-500/15 text-red-400"
                              : "bg-white/[0.06] text-white/40"
                          }`}>{m.sentiment}</span>
                        )}
                      </div>
                      {m.title && (
                        <p className="text-[13px] font-semibold text-white/80 leading-snug mb-1 line-clamp-1">{m.title}</p>
                      )}
                      {m.snippet && (
                        <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{m.snippet}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-white/25">
                        <Globe className="w-3 h-3" />
                        {m.source_domain || m.source_url?.slice(0, 40)}
                        <span className="ml-auto">
                          {new Date(m.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    {m.source_url && (
                      <a href={m.source_url} target="_blank" rel="noreferrer"
                        className="shrink-0 text-white/20 hover:text-indigo-400 transition-colors mt-1">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
