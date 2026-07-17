import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard, FolderOpen, MessageSquare, MessageCircle, MessagesSquare, Bot, Trophy, AtSign,
  Target, BarChart3, FileText, Bell, Users, Plug, CreditCard, Settings,
  Search, LogOut, Sparkles, ChevronRight, ShieldCheck, CheckCheck, Link2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/landing/Logo";
import { toast } from "sonner";

import { useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const topNav = [
  { title: "Dashboard",   url: "/app/dashboard",     icon: LayoutDashboard },
  { title: "Search",      url: "/app/search",        icon: Search, isStub: true },
  { title: "Agent",       url: "/app/agent",         icon: Sparkles, isStub: true, badge: "New" },
];

const projectNav = [
  { title: "Overview",    url: "/app/$projectId",             icon: BarChart3 },
  { title: "Prompts",     url: "/app/$projectId/prompts",      icon: MessagesSquare },
  { title: "Responses",   url: "/app/$projectId/responses",    icon: MessageCircle, isStub: true },
  { title: "Citations",   url: "/app/$projectId/citations",    icon: Link2, isStub: true },
];

const reportsNav = [
  { title: "Sentiment",          url: "/app/$projectId/reports/sentiment", icon: Target, isStub: true },
  { title: "AI Model Insights",  url: "/app/$projectId/models",      icon: Bot },
  { title: "Query Fan Out",      url: "/app/$projectId/reports/fanout", icon: LayoutDashboard, isStub: true },
  { title: "AI Traffic",         url: "/app/$projectId/analytics",   icon: BarChart3 },
  { title: "Agent Analytics",    url: "/app/$projectId/insights",    icon: Sparkles },
  { title: "Reputation",         url: "/app/$projectId/reports/reputation", icon: ShieldCheck, isStub: true },
  { title: "Owned Media",        url: "/app/$projectId/reports/media", icon: FileText, isStub: true },
  { title: "Reddit Intelligence",url: "/app/$projectId/mentions",    icon: MessageSquare },
  { title: "ChatGPT Shopping",   url: "/app/$projectId/reports/shopping", icon: CreditCard, isStub: true },
];

const toolsNav = [
  { title: "Prompt Research", url: "/app/$projectId/tools/research", icon: Search, isStub: true },
  { title: "Annotations",     url: "/app/$projectId/tools/annotations", icon: FileText, isStub: true },
  { title: "SEO Audit",       url: "/app/$projectId/seo-audit", icon: ShieldCheck },
];

const secondaryNav = [
  { title: "Team",         url: "/app/team",            icon: Users      },
  { title: "Integrations", url: "/app/integrations",    icon: Plug       },
  { title: "Billing",      url: "/app/billing",          icon: CreditCard },
  { title: "Settings",     url: "/app/settings",         icon: Settings   },
];

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params.projectId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [checked, setChecked] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const [reportsOpen, setReportsOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchUnreadAlerts = useCallback(async () => {
    const { count } = await (supabase as any)
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);
    setUnreadAlerts(count || 0);
  }, []);

  const fetchAlertsList = async () => {
    try {
      const { data } = await (supabase as any)
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      setAlerts(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await (supabase as any).from("alerts").update({ is_read: true }).eq("is_read", false);
      setUnreadAlerts(0);
      setAlerts(alerts.map((a) => ({ ...a, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      if (!data.user) {
        navigate({ to: "/auth", replace: true });
      } else {
        setUser({
          email: data.user.email,
          name: (data.user.user_metadata?.full_name as string) || data.user.email?.split("@")[0],
        });
        fetchUnreadAlerts();
        
        // Fetch user organizations (two-step: memberships → orgs)
        let orgsList = [];
        try {
          const { data: memberRows } = await (supabase as any)
            .from("org_members")
            .select("org_id, role")
            .eq("user_id", data.user.id)
            .eq("status", "active");

          if (memberRows && memberRows.length > 0) {
            const orgIds = memberRows.map((m: any) => m.org_id);
            const { data: orgData } = await (supabase as any)
              .from("organizations")
              .select("*")
              .in("id", orgIds);
            // Attach the role from the membership row
            orgsList = (orgData || []).map((org: any) => ({
              ...org,
              org_members: [{ role: memberRows.find((m: any) => m.org_id === org.id)?.role || "member" }],
            }));
          }
        } catch (e) {
          console.error("Failed to query organizations", e);
        }

        
        if (orgsList.length === 0) {
          try {
            const userFullName = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User";
            const orgSlug = `${userFullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).substring(2, 8)}`;
            const { data: newOrg, error: createOrgErr } = await (supabase as any)
              .from("organizations")
              .insert({
                name: `${userFullName}'s Workspace`,
                slug: orgSlug,
                owner_id: data.user.id,
              })
              .select()
              .single();

            if (!createOrgErr && newOrg) {
              await (supabase as any)
                .from("org_members")
                .insert({
                  org_id: newOrg.id,
                  user_id: data.user.id,
                  role: "owner",
                  status: "active",
                });
              orgsList = [{ ...newOrg, org_members: [{ role: "owner" }] }];
            }
          } catch (createErr) {
            console.error("Failed to auto-create organization", createErr);
          }
        }
        
        setOrganizations(orgsList);
        let currentActiveOrgId = "";
        const savedOrg = localStorage.getItem("active_org_id");
        if (savedOrg && orgsList.some((o: any) => o.id === savedOrg)) {
          setActiveOrgId(savedOrg);
          currentActiveOrgId = savedOrg;
        } else if (orgsList.length > 0) {
          setActiveOrgId(orgsList[0].id);
          currentActiveOrgId = orgsList[0].id;
          localStorage.setItem("active_org_id", orgsList[0].id);
        }

        // Fetch projects for the active org
        if (currentActiveOrgId) {
          try {
            const { data: projData } = await (supabase as any)
              .from("projects")
              .select("id, name, brand")
              .eq("org_id", currentActiveOrgId)
              .order("created_at", { ascending: false });
            
            setProjects(projData || []);
          } catch (err) {
            console.error("Failed to fetch projects", err);
          }
        }
      }
      setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate({ to: "/auth", replace: true });
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setUser({
          email: session.user.email,
          name: (session.user.user_metadata?.full_name as string) || session.user.email?.split("@")[0],
        });
        fetchUnreadAlerts();
      }
    });
    // Refresh unread count every 60 seconds
    const interval = setInterval(fetchUnreadAlerts, 60000);
    return () => { mounted = false; sub.subscription.unsubscribe(); clearInterval(interval); };
  }, [navigate, fetchUnreadAlerts]);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (!checked) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#141416]">
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  const initials = (user?.name ?? "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#141416]">
      {/* ── Sidebar ────────────────────────────────── */}
      <aside
        className={`flex flex-col h-full border-r border-white/5 bg-[#1a1a1c] transition-all duration-300 print:hidden ${
          collapsed ? "w-16" : "w-[220px]"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/5 text-white">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 shrink-0" />
            {!collapsed && <span className="text-sm font-semibold text-white">RankFlow</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-white/30 hover:text-white/60 transition-colors"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
          </button>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto mockup-scroll">
          
          <div className="space-y-0.5">
            {topNav.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  pathname === item.url
                    ? "bg-indigo-600/15 text-indigo-400"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {!collapsed && <span>{item.title}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 uppercase">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="h-px bg-white/5 mx-1" />

          {/* Project Switcher */}
          {!collapsed && (
            <div className="px-3 py-1">
              <select
                value={projectId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    navigate({ to: `/app/${val}` });
                  } else {
                    navigate({ to: "/app/dashboard" });
                  }
                }}
                className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors cursor-pointer appearance-none"
              >
                <option value="" disabled className="bg-[#1e1e21] text-white/50">Select Project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#1e1e21]">{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {projectId && (
            <>
              {/* Project Top Nav */}
              <div className="space-y-0.5">
                {projectNav.map((item) => {
                  const actualUrl = item.url.replace('$projectId', projectId);
                  const active = pathname === actualUrl;
                  return (
                    <Link
                      key={item.title}
                      to={actualUrl}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                        active
                          ? "bg-indigo-600/15 text-indigo-400"
                          : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  );
                })}
              </div>

              {/* Reports Group */}
              <div className="space-y-0.5">
                {!collapsed && (
                  <button
                    onClick={() => setReportsOpen(!reportsOpen)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors"
                  >
                    REPORTS
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${reportsOpen ? "rotate-90" : ""}`} />
                  </button>
                )}
                {(!collapsed ? reportsOpen : true) && reportsNav.map((item) => {
                  const actualUrl = item.url.replace('$projectId', projectId);
                  const active = pathname === actualUrl;
                  return (
                    <Link
                      key={item.title}
                      to={actualUrl}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                        active
                          ? "bg-indigo-600/15 text-indigo-400"
                          : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  );
                })}
              </div>

              {/* Tools Group */}
              <div className="space-y-0.5">
                {!collapsed && (
                  <button
                    onClick={() => setToolsOpen(!toolsOpen)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors"
                  >
                    TOOLS
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${toolsOpen ? "rotate-90" : ""}`} />
                  </button>
                )}
                {(!collapsed ? toolsOpen : true) && toolsNav.map((item) => {
                  const actualUrl = item.url.replace('$projectId', projectId);
                  const active = pathname === actualUrl;
                  return (
                    <Link
                      key={item.title}
                      to={actualUrl}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                        active
                          ? "bg-indigo-600/15 text-indigo-400"
                          : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          <div className="h-px bg-white/5 mx-1" />

          {secondaryNav.map((item) => {
            const active = pathname === item.url || pathname.startsWith(item.url + "/");
            return (
              <Link
                key={item.url}
                to={item.url}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-indigo-600/15 text-indigo-400"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User chip */}
        <div className="border-t border-white/5 px-3 py-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-500/80 grid place-items-center text-[11px] font-bold text-white shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-white/80 font-medium truncate">{user?.name ?? "User"}</div>
              <div className="text-[10px] text-white/30 truncate">{user?.email}</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleSignOut}
              className="text-white/25 hover:text-white/60 transition-colors shrink-0"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content ───────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/5 bg-[#141416]/80 px-6 backdrop-blur-md print:hidden">
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              placeholder="Search prompts, projects..."
              className="h-9 w-full rounded-lg bg-white/[0.04] border border-white/5 pl-9 pr-4 text-sm text-white/80 placeholder-white/25 outline-none focus:border-indigo-500/40 transition-colors"
            />
          </div>
          
          {/* Org Switcher */}
          {organizations.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Workspace:</span>
              <select
                value={activeOrgId}
                onChange={(e) => {
                  setActiveOrgId(e.target.value);
                  localStorage.setItem("active_org_id", e.target.value);
                  window.location.reload();
                }}
                className="rounded-lg bg-white/[0.04] border border-white/5 px-2 py-1 text-xs text-white outline-none focus:border-indigo-500/40 transition-colors"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id} className="bg-[#1e1e21]">{org.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="ml-auto flex items-center gap-2 relative">
            <button
              onClick={async () => {
                const nextState = !showNotifications;
                setShowNotifications(nextState);
                if (nextState) {
                  await fetchAlertsList();
                }
              }}
              className="relative rounded-lg p-2 text-white/40 hover:bg-white/[0.04] hover:text-white/70 transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unreadAlerts > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl bg-[#1a1a1c] border border-white/5 p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-semibold text-white">Notifications ({unreadAlerts})</span>
                  {unreadAlerts > 0 && (
                    <button
                      onClick={markAllRead}
                      className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <CheckCheck className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto mockup-scroll pr-1">
                  {alerts.map((a) => (
                    <div
                      key={a.id}
                      className={`p-2.5 rounded-xl border text-[11px] leading-relaxed transition-colors ${
                        a.is_read
                          ? "bg-white/[0.01] border-white/5 text-white/40"
                          : "bg-indigo-500/5 border-indigo-500/10 text-white/80"
                      }`}
                    >
                      <div>{a.message}</div>
                      <div className="text-[9px] text-white/20 mt-1">
                        {new Date(a.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center text-xs text-white/30 py-6">No notifications found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
