import { createFileRoute } from "@tanstack/react-router";
import { Plus, Download, FileText } from "lucide-react";
import { reportsHistory } from "@/lib/mock-data";

export const Route = createFileRoute("/app/reports")({
  component: Reports,
});

function Reports() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-white/40">Export PDF/CSV reports & scheduled summaries</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
          <Plus className="w-4 h-4" /> New Report
        </button>
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-white/30 font-semibold">
              <th className="text-left px-6 py-3">Report Name</th>
              <th className="text-left px-6 py-3">Type</th>
              <th className="text-left px-6 py-3">Date</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-center px-6 py-3 w-20">Download</th>
            </tr>
          </thead>
          <tbody>
            {reportsHistory.map((r) => (
              <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-white/80">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-white/30" />
                    {r.name}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-white/50 font-mono text-xs">{r.type}</td>
                <td className="px-6 py-4 text-sm text-white/40">{r.date}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      background: r.status === "ready" ? "rgba(34,197,94,0.1)" : "rgba(99,102,241,0.1)",
                      color: r.status === "ready" ? "#22c55e" : "#6366f1",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.status === "ready" ? "#22c55e" : "#6366f1" }} />
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="text-white/40 hover:text-white/70 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
