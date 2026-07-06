import { createFileRoute } from "@tanstack/react-router";
import { rankingsMatrix } from "@/lib/mock-data";

export const Route = createFileRoute("/app/rankings")({
  component: Rankings,
});

function Rankings() {
  const rankColor = (r: number) => {
    if (r === 1) return "#fbbf24"; // Gold
    if (r === 2) return "#94a3b8"; // Silver
    if (r === 3) return "#cd7f32"; // Bronze
    return "rgba(255,255,255,0.4)";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Rankings</h1>
        <p className="mt-1 text-sm text-white/40">Brand positions across prompts & AI models</p>
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-white/30 font-semibold">
              <th className="text-left px-6 py-3">Prompt</th>
              <th className="text-center px-6 py-3">ChatGPT</th>
              <th className="text-center px-6 py-3">Gemini</th>
              <th className="text-center px-6 py-3">Claude</th>
              <th className="text-center px-6 py-3">Perplexity</th>
            </tr>
          </thead>
          <tbody>
            {rankingsMatrix.map((r, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-white/80">{r.prompt}</td>
                {(["chatgpt", "gemini", "claude", "perplexity"] as const).map((model) => (
                  <td key={model} className="px-6 py-4 text-center">
                    <span className="font-mono text-sm font-bold" style={{ color: rankColor(r[model]) }}>
                      #{r[model]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
