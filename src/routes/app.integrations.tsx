import { createFileRoute } from "@tanstack/react-router";
import { integrationsList } from "@/lib/mock-data";

export const Route = createFileRoute("/app/integrations")({
  component: Integrations,
});

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-5 hover:bg-white/[0.05] transition-colors ${className}`}>
      {children}
    </div>
  );
}

function Integrations() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-white/40">Connect OpenAI, Gemini, Slack, email, webhooks, etc.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrationsList.map((integ) => (
          <Card key={integ.id} className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl grid place-items-center text-lg shrink-0 border border-white/5"
              style={{ background: `${integ.color}18` }}
            >
              {integ.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">{integ.name}</div>
              <div className="text-xs text-white/35 capitalize mt-0.5">{integ.status}</div>
            </div>
            <div className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors cursor-pointer shrink-0 ${integ.status === "connected" ? "bg-emerald-500/40 justify-end" : "bg-white/10 justify-start"}`}>
              <div className={`w-4 h-4 rounded-full shadow-sm transition-transform ${integ.status === "connected" ? "bg-emerald-400" : "bg-white/30"}`} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
