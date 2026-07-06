import { createFileRoute } from "@tanstack/react-router";
import { Filter, Check, X } from "lucide-react";
import { mentionsFeed } from "@/lib/mock-data";

export const Route = createFileRoute("/app/mentions")({
  component: Mentions,
});

const MODEL_COLORS: Record<string, string> = {
  ChatGPT: "#10a37f", Gemini: "#4285f4", Claude: "#c85a2a", Perplexity: "#7c3aed",
};

function Mentions() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Mentions</h1>
          <p className="mt-1 text-sm text-white/40">See where and how often the brand is mentioned in AI responses</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 ring-1 ring-white/10 px-3.5 py-2 text-sm font-medium text-white/60 hover:bg-white/10 transition-colors">
          <Filter className="w-3.5 h-3.5" /> Filter
        </button>
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-white/30 font-semibold">
              <th className="text-left px-6 py-3">Model</th>
              <th className="text-left px-6 py-3">Prompt</th>
              <th className="text-left px-6 py-3">Sentiment</th>
              <th className="text-center px-6 py-3 w-24">Cited</th>
              <th className="text-center px-6 py-3 w-20">Position</th>
              <th className="text-left px-6 py-3 w-24">Time</th>
            </tr>
          </thead>
          <tbody>
            {mentionsFeed.map((m) => (
              <tr key={m.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-white/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: MODEL_COLORS[m.model] }} />
                    {m.model}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-white/50 truncate max-w-xs">{m.prompt}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: m.sentiment === "positive" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
                      color: m.sentiment === "positive" ? "#22c55e" : "#f59e0b",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.sentiment === "positive" ? "#22c55e" : "#f59e0b" }} />
                    {m.sentiment}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {m.cited ? (
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-white/20 mx-auto" />
                  )}
                </td>
                <td className="px-6 py-4 text-center font-semibold text-white font-mono">
                  #{m.position}
                </td>
                <td className="px-6 py-4 text-xs text-white/30">{m.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
