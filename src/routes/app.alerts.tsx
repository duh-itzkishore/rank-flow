import { createFileRoute } from "@tanstack/react-router";
import { Plus, Bell, Clock, ChevronRight } from "lucide-react";
import { recentAlerts } from "@/lib/mock-data";

export const Route = createFileRoute("/app/alerts")({
  component: Alerts,
});

const severityColor: Record<string, string> = {
  success: "#22c55e", warning: "#f59e0b", info: "#6366f1", danger: "#ef4444",
};

function Alerts() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Alerts</h1>
          <p className="mt-1 text-sm text-white/40">Notifications when rankings change or competitors overtake your brand</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
          <Plus className="w-4 h-4" /> New Alert Rule
        </button>
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 space-y-3">
        <h2 className="text-base font-semibold text-white mb-4">Recent Notifications</h2>
        {recentAlerts.map((a) => (
          <div key={a.id} className="flex items-start gap-3 rounded-xl bg-white/[0.02] p-4 border border-white/5 hover:bg-white/[0.04] transition-colors">
            <span className="mt-1 w-2.5 h-2.5 rounded-full shrink-0" style={{ background: severityColor[a.severity] }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white/80 leading-snug">{a.message}</div>
              <div className="text-xs text-white/30 mt-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{a.time}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  );
}
