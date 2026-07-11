import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2, AlertTriangle, TrendingDown, TrendingUp, X, Filter, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/alerts")({
  component: Alerts,
});

const SEVERITY_STYLES: Record<string, { bg: string; text: string; dot: string; icon: any }> = {
  danger:  { bg: "bg-red-500/10",     text: "text-red-400",     dot: "#ef4444", icon: AlertTriangle },
  warning: { bg: "bg-amber-500/10",   text: "text-amber-400",   dot: "#f59e0b", icon: TrendingDown  },
  success: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "#22c55e", icon: TrendingUp    },
  info:    { bg: "bg-indigo-500/10",  text: "text-indigo-400",  dot: "#6366f1", icon: Bell          },
};

const TYPE_LABELS: Record<string, string> = {
  rank_drop:        "Rank Drop",
  rank_gain:        "Rank Gain",
  hallucination:    "Hallucination Detected",
  competitor_surge: "Competitor Surge",
  citation_lost:    "Citation Lost",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from("alerts")
        .select(`
          id, type, severity, message, is_read, metadata, created_at,
          projects ( name )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (err: any) {
      toast.error("Failed to load alerts: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    await (supabase as any).from("alerts").update({ is_read: true }).eq("id", id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
  };

  const markAllRead = async () => {
    const unread = alerts.filter((a) => !a.is_read);
    if (unread.length === 0) return;
    await (supabase as any).from("alerts").update({ is_read: true }).in("id", unread.map((a) => a.id));
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    toast.success("All alerts marked as read");
  };

  const deleteAlert = async (id: string) => {
    await (supabase as any).from("alerts").delete().eq("id", id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const filtered = alerts.filter((a) => {
    if (filterSeverity !== "all" && a.severity !== filterSeverity) return false;
    if (filterType !== "all" && a.type !== filterType) return false;
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2.5">
            Alerts
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-white/40">Rank drops, hallucinations, and competitor surges · auto-generated after each audit</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 ring-1 ring-white/10 px-3.5 py-2 text-sm font-medium text-white/60 hover:bg-white/10 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Unread", value: unreadCount, color: unreadCount > 0 ? "text-red-400" : "text-white/30" },
          { label: "Total", value: alerts.length, color: "text-white" },
          { label: "Hallucinations", value: alerts.filter((a) => a.type === "hallucination").length, color: "text-amber-400" },
          { label: "Rank Changes", value: alerts.filter((a) => a.type === "rank_drop" || a.type === "rank_gain").length, color: "text-indigo-400" },
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
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="appearance-none rounded-lg bg-white/[0.04] border border-white/5 pl-3 pr-8 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
          >
            <option value="all" className="bg-[#1e1e21]">All Severities</option>
            <option value="danger" className="bg-[#1e1e21]">🔴 Danger</option>
            <option value="warning" className="bg-[#1e1e21]">🟡 Warning</option>
            <option value="success" className="bg-[#1e1e21]">🟢 Success</option>
            <option value="info" className="bg-[#1e1e21]">🔵 Info</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="appearance-none rounded-lg bg-white/[0.04] border border-white/5 pl-3 pr-8 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
          >
            <option value="all" className="bg-[#1e1e21]">All Types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k} className="bg-[#1e1e21]">{v}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        </div>
        <span className="ml-auto text-xs text-white/30">{filtered.length} alerts</span>
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Loading alerts…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
          <Bell className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-white">No alerts yet</h3>
          <p className="mt-1 text-xs text-white/45 leading-relaxed max-w-xs mx-auto">
            Alerts are automatically generated when you run prompt audits. Run your first audit to start tracking rank changes and hallucinations.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => {
            const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
            const IconComp = style.icon;
            const projName = alert.projects
              ? Array.isArray(alert.projects) ? alert.projects[0]?.name : alert.projects?.name
              : null;

            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 rounded-xl p-4 border transition-colors ${
                  alert.is_read
                    ? "bg-white/[0.02] border-white/[0.04]"
                    : "bg-white/[0.04] border-white/[0.08] ring-1 ring-white/5"
                }`}
              >
                {/* Severity Icon */}
                <div className={`w-8 h-8 rounded-xl ${style.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <IconComp className={`w-4 h-4 ${style.text}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                      {TYPE_LABELS[alert.type] || alert.type}
                    </span>
                    {projName && (
                      <span className="text-[10px] text-indigo-400/70 font-medium">{projName}</span>
                    )}
                    {!alert.is_read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-auto" />
                    )}
                  </div>
                  <p className="text-sm text-white/70 leading-snug">{alert.message}</p>
                  <div className="text-[10px] text-white/25 mt-1.5">{timeAgo(alert.created_at)}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!alert.is_read && (
                    <button
                      onClick={() => markRead(alert.id)}
                      title="Mark as read"
                      className="p-1.5 rounded-lg hover:bg-white/5 text-white/25 hover:text-white/60 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    title="Dismiss"
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/25 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
