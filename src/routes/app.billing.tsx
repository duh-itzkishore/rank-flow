import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/app/billing")({
  component: Billing,
});

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-5 hover:bg-white/[0.05] transition-colors ${className}`}>
      {children}
    </div>
  );
}

function Billing() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-white/40">Subscription and usage management</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-white">Current Plan</div>
                <div className="text-xs text-white/35">Billed monthly</div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 text-indigo-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                Pro
              </span>
            </div>
            <div className="text-3xl font-bold text-white mt-1">
              $79<span className="text-sm text-white/30 font-normal">/mo</span>
            </div>
            <div className="text-xs text-white/30 mt-2">Next billing: Aug 1, 2026</div>
          </div>
          <div className="mt-6 flex gap-2.5">
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
              Upgrade Plan
            </button>
            <button className="rounded-lg bg-white/5 text-white/60 ring-1 ring-white/10 px-3.5 py-2 text-sm font-medium hover:bg-white/10 transition-colors">
              Manage
            </button>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Usage This Month</h2>
          {[
            { label: "API Calls", used: 8420, limit: 10000 },
            { label: "Prompts", used: 142, limit: 200 },
            { label: "Team Members", used: 4, limit: 5 },
          ].map((u) => (
            <div key={u.label} className="mb-4 last:mb-0">
              <div className="flex items-center justify-between text-xs text-white/40 mb-1.5 font-medium">
                <span>{u.label}</span>
                <span>{u.used}/{u.limit}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(u.used / u.limit) * 100}%`,
                    background: u.used / u.limit > 0.85 ? "#ef4444" : "#6366f1",
                  }}
                />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-white/30" />
          <h2 className="text-sm font-semibold text-white">Invoice History</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-white/30 font-semibold">
              <th className="text-left px-6 py-3">Invoice</th>
              <th className="text-left px-6 py-3">Amount</th>
              <th className="text-left px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { inv: "INV-2026-07", amount: "$79.00", status: "paid" },
              { inv: "INV-2026-06", amount: "$79.00", status: "paid" },
              { inv: "INV-2026-05", amount: "$49.00", status: "paid" },
            ].map((inv, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-3.5 text-sm text-white/70">{inv.inv}</td>
                <td className="px-6 py-3.5 text-sm text-white/80 font-semibold">{inv.amount}</td>
                <td className="px-6 py-3.5 text-sm">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
