import { createFileRoute } from "@tanstack/react-router";
import { BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { competitors, brandRankings } from "@/lib/mock-data";

export const Route = createFileRoute("/app/competitors")({
  component: Competitors,
});

function Competitors() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Competitors</h1>
          <p className="mt-1 text-sm text-white/40">Benchmark your visibility against the competition</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
          <Plus className="w-4 h-4" /> Add Competitor
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {competitors.map((c) => (
          <div key={c.name} className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-5 hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white">{c.name}</span>
              <div className="flex items-center gap-1">
                {c.trend > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                )}
                <span className={`text-xs font-semibold ${c.trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {c.trend > 0 ? "+" : ""}{c.trend}%
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-white leading-none">{c.visibility}</div>
            <div className="text-[10px] text-white/35 uppercase tracking-wider mt-1">Visibility Score</div>
            <div className="text-[11px] text-white/40 mt-3">{c.mentions} mentions tracked</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
        <h2 className="text-base font-semibold text-white mb-4">Overall Score Comparison</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={brandRankings} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="brand" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {brandRankings.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#6366f1" : "rgba(255,255,255,0.08)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
