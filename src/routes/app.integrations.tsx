import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Mail, MessageSquare, Webhook, Link2, Database } from "lucide-react";

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
  const [connections, setConnections] = useState<Record<string, boolean>>({
    ga4: true,
    hubspot: false,
    slack: true,
  });

  const toggle = (id: string) => {
    setConnections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const integrations = [
    { id: "ga4", name: "Google Analytics 4", type: "ROI Attribution", icon: <BarChart3 />, color: "#f59e0b", desc: "Correlate AI visibility with Direct Traffic" },
    { id: "hubspot", name: "HubSpot CRM", type: "Pipeline Attribution", icon: <Database />, color: "#ff7a59", desc: "Correlate AI SoV with closed-won revenue" },
    { id: "slack", name: "Slack Alerts", type: "Notifications", icon: <MessageSquare />, color: "#e01e5a", desc: "Get real-time rank drops & hallucination alerts" },
    { id: "mail", name: "Email Summaries", type: "Notifications", icon: <Mail />, color: "#3b82f6", desc: "Weekly executive PDF reports" },
    { id: "webhook", name: "Custom Webhooks", type: "Developer", icon: <Webhook />, color: "#8b5cf6", desc: "Push prompt run data to your internal tools" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 relative h-full">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-white/40">Connect your analytics and CRM to power the ROI Attribution Engine.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integ) => {
          const isConnected = !!connections[integ.id];
          return (
            <Card key={integ.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl grid place-items-center shrink-0 border border-white/5"
                  style={{ background: `${integ.color}18`, color: integ.color }}
                >
                  {integ.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{integ.name}</div>
                  <div className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mt-0.5">{integ.type}</div>
                </div>
                <button
                  onClick={() => toggle(integ.id)}
                  className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors cursor-pointer shrink-0 ${isConnected ? "bg-emerald-500/40 justify-end" : "bg-white/10 justify-start"}`}
                >
                  <div className={`w-4 h-4 rounded-full shadow-sm transition-transform ${isConnected ? "bg-emerald-400" : "bg-white/30"}`} />
                </button>
              </div>
              <p className="text-xs text-white/50 leading-relaxed border-t border-white/5 pt-3">
                {integ.desc}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
