import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { modelDistribution } from "@/lib/mock-data";

export const Route = createFileRoute("/app/models")({
  component: Models,
});

const models = [
  { name: "ChatGPT",    vendor: "OpenAI",        color: "#10a37f", versions: "GPT-4o · o1 · o3",          status: "live", visibility: 88, mentions: 782 },
  { name: "Gemini",     vendor: "Google",         color: "#4285f4", versions: "2.0 Pro · 2.0 Flash",       status: "live", visibility: 76, mentions: 442 },
  { name: "Claude",     vendor: "Anthropic",      color: "#c85a2a", versions: "Sonnet 3.5 · Opus 3",       status: "live", visibility: 82, mentions: 368 },
  { name: "Perplexity", vendor: "Perplexity AI",  color: "#7c3aed", versions: "Sonar Pro · Sonar Reason",  status: "live", visibility: 71, mentions: 250 },
];

function Models() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">AI Models</h1>
          <p className="mt-1 text-sm text-white/40">Configure & compare tracked models</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
          <Plus className="w-4 h-4" /> Add Model
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {models.map((m) => (
          <div key={m.name} className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl grid place-items-center text-white text-base font-bold shadow-sm" style={{ background: m.color }}>
                  {m.name[0]}
                </div>
                <div>
                  <div className="text-base font-semibold text-white">{m.name}</div>
                  <div className="text-xs text-white/35">{m.vendor}</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {m.status}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-white/40 mb-1.5">
                  <span>Visibility Index</span>
                  <span className="font-semibold text-white/80">{m.visibility}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full transition-all" style={{ width: `${m.visibility}%`, background: m.color }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl bg-white/[0.02] p-3 border border-white/5">
                  <div className="text-xs text-white/35">Total Mentions</div>
                  <div className="text-base font-semibold text-white mt-0.5">{m.mentions}</div>
                </div>
                <div className="rounded-xl bg-white/[0.02] p-3 border border-white/5">
                  <div className="text-xs text-white/35">Share of voice</div>
                  <div className="text-base font-semibold text-white mt-0.5">
                    {Math.round(modelDistribution.find((d) => d.name === m.name)?.value ?? 0)}%
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.02] px-4 py-3 border border-white/5 flex items-center justify-between">
                <span className="text-xs text-white/35 uppercase tracking-wider font-semibold">Versions</span>
                <span className="text-xs text-white/60 font-medium">{m.versions}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
