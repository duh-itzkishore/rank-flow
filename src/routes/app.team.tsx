import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getOrgMembers, getTeamInvites, createTeamInvite, removeOrgMember } from "@/integrations/supabase/queries";

export const Route = createFileRoute("/app/team")({
  component: Team,
});

function Team() {
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  useEffect(() => {
    async function loadTeam() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return;
        setUser(authData.user);

        // Get user org
        const { data: orgs } = await (supabase as any).from('organizations')
          .select('*, org_members!inner(role, status)')
          .eq('org_members.user_id', authData.user.id)
          .limit(1);

        if (orgs && orgs.length > 0) {
          const currentOrgId = orgs[0].id;
          setOrgId(currentOrgId);

          // Fetch members and invites
          const { data: memberData } = await getOrgMembers(currentOrgId);
          const { data: inviteData } = await getTeamInvites(currentOrgId);

          setMembers(memberData || []);
          setInvites(inviteData || []);
        }
      } catch (err) {
        console.error("Error loading team", err);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !user) return;

    try {
      const { data, error } = await createTeamInvite({
        org_id: orgId,
        email: inviteEmail,
        role: inviteRole,
        invited_by: user.id
      });

      if (error) throw error;
      
      toast.success("Invite sent successfully!");
      setInvites([...invites, data]);
      setShowInviteModal(false);
      setInviteEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!orgId) return;
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await removeOrgMember(orgId, userId);
      setMembers(members.filter((m) => m.user_id !== userId));
      toast.success("Member removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member");
    }
  };

  if (loading) {
    return <div className="text-white/50 text-sm">Loading team...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-white/40">Invite team members and manage roles</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          <Plus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1c] p-6 rounded-2xl w-full max-w-md ring-1 ring-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Invite Team Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500/50"
                  placeholder="colleague@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Role</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-[#1a1a1c] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500/50"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {members.map((m) => {
          const profile = m.profiles || {};
          const initials = (profile.full_name || profile.email || "U").substring(0, 2).toUpperCase();
          return (
            <div key={m.id} className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-5 hover:bg-white/[0.05] transition-colors flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-full grid place-items-center text-xs font-bold text-white bg-indigo-600/60 shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{profile.full_name || 'No Name'}</div>
                <div className="text-xs text-white/35 truncate">{profile.email}</div>
              </div>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: m.role === "admin" || m.role === "owner" ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.06)",
                  color: m.role === "admin" || m.role === "owner" ? "#818cf8" : "rgba(255,255,255,0.4)",
                }}
              >
                {m.role}
              </span>
              {m.role !== "owner" && (
                <button onClick={() => handleRemoveMember(m.user_id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-300 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}

        {invites.map((inv) => (
          <div key={inv.id} className="rounded-2xl bg-white/[0.01] ring-1 ring-white/[0.04] p-5 border border-dashed border-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full grid place-items-center text-xs font-bold text-white/40 bg-white/5 shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white/60">Pending Invite</div>
              <div className="text-xs text-white/35 truncate">{inv.email}</div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/40">
              {inv.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
