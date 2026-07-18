import { createFileRoute } from "@tanstack/react-router";
import { Shield, Settings as SettingsIcon, Building, Lock, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserSettings, updateUserSettings } from "@/integrations/supabase/queries";

export const Route = createFileRoute("/app/settings")({
  component: Settings,
});

function Settings() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({ full_name: "", email: "" });
  const [org, setOrg] = useState<any>({ id: "", name: "", slug: "" });
  const [settings, setSettings] = useState<any>({
    notification_prefs: { email_alerts: true, weekly_digest: true },
    timezone: "UTC",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");


  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return;
        setUser(authData.user);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();
        if (profileData) setProfile({ ...profileData, email: authData.user.email });

        let orgData = null;
        try {
          const { data: memberRow } = await (supabase as any)
            .from("org_members")
            .select("org_id, role")
            .eq("user_id", authData.user.id)
            .eq("status", "active")
            .limit(1)
            .maybeSingle();

          if (memberRow?.org_id) {
            const { data: foundOrg, error } = await (supabase as any)
              .from("organizations")
              .select("*")
              .eq("id", memberRow.org_id)
              .single();
            if (!error && foundOrg) {
              orgData = { ...foundOrg, org_members: [{ role: memberRow.role }] };
            }
          }
        } catch (e) {
          console.error("Failed to query organizations", e);
        }


        // Auto-create workspace if not found
        if (!orgData) {
          try {
            const userFullName = authData.user.user_metadata?.full_name || authData.user.email?.split("@")[0] || "User";
            const orgSlug = `${userFullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).substring(2, 8)}`;
            
            const { data: newOrg, error: createOrgErr } = await (supabase as any)
              .from("organizations")
              .insert({
                name: `${userFullName}'s Workspace`,
                slug: orgSlug,
                owner_id: authData.user.id,
              })
              .select()
              .single();

            if (!createOrgErr && newOrg) {
              await (supabase as any)
                .from("org_members")
                .insert({
                  org_id: newOrg.id,
                  user_id: authData.user.id,
                  role: "owner",
                  status: "active",
                });
              orgData = { ...newOrg, org_members: [{ role: "owner" }] };
            }
          } catch (createErr) {
            console.error("Failed to auto-create workspace", createErr);
          }
        }

        if (orgData) {
          setOrg(orgData);
        }

        const { data: settingsData } = await getUserSettings(authData.user.id);
        if (settingsData) setSettings(settingsData);
      } catch (err) {
        console.error("Error loading settings", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await supabase.from("profiles").update({ full_name: profile.full_name }).eq("id", user.id);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkspace = async () => {
    setSaving(true);
    try {
      await (supabase as any).from("organizations").update({ name: org.name, slug: org.slug }).eq("id", org.id);
      toast.success("Workspace updated");
    } catch {
      toast.error("Failed to update workspace");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await updateUserSettings(user.id, {
        notification_prefs: settings.notification_prefs,
        timezone: settings.timezone,
      });
      toast.success("Preferences updated");
    } catch {
      toast.error("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };


  if (loading) return <div className="text-white/50 text-sm p-8">Loading settings...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-white/40">
          Profile, workspace, AI keys, preferences, and account settings
        </p>
      </div>

      <div className="space-y-6">

        {/* ── Profile ────────────────────────── */}
        <section className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" /> Profile
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5 font-semibold">Full Name</div>
              <input
                value={profile.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-indigo-500/40 transition-colors"
              />
            </div>
            <div>
              <div className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5 font-semibold">Email (Read Only)</div>
              <input
                disabled
                value={profile.email || ""}
                className="w-full rounded-lg bg-white/[0.02] border border-transparent px-3 py-2 text-sm text-white/40 cursor-not-allowed"
              />
            </div>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            Save Profile
          </button>
        </section>

        {/* ── Workspace ────────────────────────── */}
        <section className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-400" /> Workspace
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5 font-semibold">Workspace Name</div>
              <input
                value={org.name || ""}
                onChange={(e) => setOrg({ ...org, name: e.target.value })}
                className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-indigo-500/40 transition-colors"
              />
            </div>
            <div>
              <div className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5 font-semibold">Workspace Slug</div>
              <input
                value={org.slug || ""}
                onChange={(e) => setOrg({ ...org, slug: e.target.value })}
                className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-indigo-500/40 transition-colors"
              />
            </div>
          </div>
          <button
            onClick={handleSaveWorkspace}
            disabled={saving}
            className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            Save Workspace
          </button>
        </section>

        {/* ── Security ────────────────────────── */}
        <section className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" /> Security
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
            <div>
              <div className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5 font-semibold">New Password</div>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2 text-sm text-white/80 placeholder-white/25 outline-none focus:border-indigo-500/40 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              Update Password
            </button>
          </form>
        </section>

        {/* ── Preferences ─────────────────────── */}
        <section className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-indigo-400" /> Preferences
          </h2>
          <div className="space-y-6">
            <div className="max-w-xs">
              <div className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5 font-semibold">Timezone</div>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full rounded-lg bg-[#1a1a1c] border border-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-indigo-500/40"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Asia/Kolkata">India (IST)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
            <div className="space-y-4">
              {[
                { key: "email_alerts", label: "Email notifications", desc: "Receive alerts via email" },
                { key: "weekly_digest", label: "Weekly digest", desc: "Summary report every Monday" },
              ].map((pref) => {
                const isOn = settings.notification_prefs?.[pref.key] ?? false;
                return (
                  <div key={pref.key} className="flex items-center justify-between max-w-sm">
                    <div>
                      <div className="text-sm font-semibold text-white/80">{pref.label}</div>
                      <div className="text-xs text-white/30">{pref.desc}</div>
                    </div>
                    <div
                      onClick={() =>
                        setSettings({
                          ...settings,
                          notification_prefs: { ...settings.notification_prefs, [pref.key]: !isOn },
                        })
                      }
                      className={`w-7 h-4 rounded-full flex items-center px-0.5 transition-colors cursor-pointer ${
                        isOn ? "bg-indigo-500/40 justify-end" : "bg-white/10 justify-start"
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${isOn ? "bg-indigo-400" : "bg-white/30"}`} />
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleSavePreferences}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              Save Preferences
            </button>
          </div>
        </section>

        {/* ── Danger Zone ─────────────────────── */}
        <section className="rounded-2xl bg-red-950/20 ring-1 ring-red-900/30 p-6">
          <h2 className="text-base font-semibold text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h2>
          <p className="text-sm text-white/50 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 text-sm font-semibold hover:bg-red-500/20 transition-colors">
            Delete Account
          </button>
        </section>

      </div>
    </div>
  );
}
