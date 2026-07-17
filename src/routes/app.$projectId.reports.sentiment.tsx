import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/app/$projectId/reports/sentiment")({ component: () => <ComingSoon title="Sentiment Analysis" desc="Track how AI models emotionally describe your brand vs. competitors across all prompts." /> });

function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 grid place-items-center mx-auto mb-5">
          <Construction className="w-7 h-7 text-indigo-400" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">{title}</h1>
        <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
        <span className="mt-5 inline-block rounded-full bg-amber-500/15 text-amber-400 px-3 py-1 text-xs font-semibold">Coming Soon</span>
      </div>
    </div>
  );
}
