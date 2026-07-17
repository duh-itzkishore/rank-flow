import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/agent")({
  component: AgentStub,
});

function AgentStub() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
        <Sparkles className="w-8 h-8 text-indigo-400" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-white">AI Agent</h1>
        <p className="text-white/40 mt-2 max-w-md mx-auto">
          The autonomous brand monitoring agent is coming soon.
        </p>
      </div>
    </div>
  );
}
