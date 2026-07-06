import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { teamMembers } from "@/lib/mock-data";

export const Route = createFileRoute("/app/team")({
  component: Team,
});

function Team() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-white/40">Invite team members and manage roles</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
          <Plus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {teamMembers.map((t) => (
          <div key={t.id} className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-5 hover:bg-white/[0.05] transition-colors flex items-center gap-4">
            <div className="w-10 h-10 rounded-full grid place-items-center text-xs font-bold text-white bg-indigo-600/60 shrink-0">
              {t.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">{t.name}</div>
              <div className="text-xs text-white/35 truncate">{t.email}</div>
            </div>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: t.role === "Admin" ? "rgba(99,102,241,0.1)" : t.role === "Editor" ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.06)",
                color: t.role === "Admin" ? "#818cf8" : t.role === "Editor" ? "#22c55e" : "rgba(255,255,255,0.4)",
              }}
            >
              {t.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
