import { createFileRoute } from "@tanstack/react-router";
import { Shield, Key, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  component: Settings,
});

function Settings() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-white/40">Profile, API keys, preferences, and account settings</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" /> Profile
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Full Name", value: "Sarah Chen" },
              { label: "Email", value: "sarah@rankflow.ai" },
              { label: "Company", value: "RankFlow Inc." },
              { label: "Timezone", value: "UTC-8 (Pacific)" },
            ].map((f) => (
              <div key={f.label}>
                <div className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5 font-semibold">{f.label}</div>
                <input
                  defaultValue={f.value}
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2 text-sm text-white/80 placeholder-white/25 outline-none focus:border-indigo-500/40 transition-colors"
                />
              </div>
            ))}
          </div>
          <button className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
            Save Profile
          </button>
        </div>

        {/* API Keys */}
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" /> API Keys
          </h2>
          <div className="space-y-3">
            {[
              { name: "Production Key", key: "rf_prod_••••••••••••8a3f", created: "Jun 1, 2026" },
              { name: "Development Key", key: "rf_dev_••••••••••••c91b", created: "May 15, 2026" },
            ].map((k) => (
              <div key={k.name} className="flex items-center justify-between rounded-xl bg-white/[0.02] p-4 border border-white/5">
                <div>
                  <div className="text-sm font-medium text-white/80">{k.name}</div>
                  <div className="text-xs text-white/30 font-mono mt-1">{k.key} · Created {k.created}</div>
                </div>
                <button className="inline-flex items-center gap-1 rounded-md bg-white/5 text-white/60 ring-1 ring-white/10 px-2.5 py-1 text-[10px] font-semibold hover:bg-white/10 transition-colors">
                  Reveal
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-indigo-400" /> Preferences
          </h2>
          <div className="space-y-4">
            {[
              { label: "Email notifications", desc: "Receive alerts via email", on: true },
              { label: "Weekly digest", desc: "Summary report every Monday", on: true },
              { label: "Dark mode", desc: "Use dark theme in dashboard", on: true },
              { label: "Beta features", desc: "Early access to new features", on: false },
            ].map((pref) => (
              <div key={pref.label} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white/80">{pref.label}</div>
                  <div className="text-xs text-white/30">{pref.desc}</div>
                </div>
                <div className={`w-7 h-4 rounded-full flex items-center px-0.5 transition-colors cursor-pointer ${pref.on ? "bg-indigo-500/40 justify-end" : "bg-white/10 justify-start"}`}>
                  <div className={`w-3 h-3 rounded-full ${pref.on ? "bg-indigo-400" : "bg-white/30"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
