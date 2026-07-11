import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard, FolderOpen, MessageSquare, Bot, Trophy, AtSign,
  Target, BarChart3, FileText, Bell, Users, Plug, CreditCard, Settings,
  Search, LogOut, Sparkles, ChevronRight, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/landing/Logo";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const mainNav = [
  { title: "Dashboard",   url: "/app/dashboard",     icon: LayoutDashboard },
  { title: "SEO Audit",   url: "/app/seo-audit",     icon: ShieldCheck     },
  { title: "Projects",    url: "/app/projects",       icon: FolderOpen      },
  { title: "Prompts",     url: "/app/prompts",        icon: MessageSquare   },
  { title: "AI Models",   url: "/app/models",         icon: Bot             },
  { title: "Rankings",    url: "/app/rankings",        icon: Trophy          },
  { title: "Mentions",    url: "/app/mentions",        icon: AtSign          },
  { title: "Competitors", url: "/app/competitors",     icon: Target          },
  { title: "Analytics",   url: "/app/analytics",       icon: BarChart3       },
  { title: "Reports",     url: "/app/reports",          icon: FileText        },
];

const secondaryNav = [
  { title: "Team",         url: "/app/team",            icon: Users      },
  { title: "Integrations", url: "/app/integrations",    icon: Plug       },
  { title: "Billing",      url: "/app/billing",          icon: CreditCard },
  { title: "Settings",     url: "/app/settings",         icon: Settings   },
];

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [checked, setChecked] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  const fetchUnreadAlerts = useCallback(async () => {
    const { count } = await (supabase as any)
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);
    setUnreadAlerts(count || 0);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (!data.user) {
        navigate({ to: "/auth", replace: true });
      } else {
        setUser({
          email: data.user.email,
          name: (data.user.user_metadata?.full_name as string) || data.user.email?.split("@")[0],
        });
        fetchUnreadAlerts();
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
        className={`flex flex-col h-full border-r border-white/5 bg-[#1a1a1c] transition-all duration-300 ${
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
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto mockup-scroll">
          {mainNav.map((item) => {
            const active = pathname === item.url || pathname.startsWith(item.url + "/");
            const isAlerts = item.url === "/app/alerts";
            return (
              <Link
                key={item.url}
                to={item.url}
                onClick={isAlerts ? fetchUnreadAlerts : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-indigo-600/15 text-indigo-400"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                }`}
              >
                <div className="relative shrink-0">
                  <item.icon className="w-4 h-4" />
                  {isAlerts && unreadAlerts > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center">
                      {unreadAlerts > 9 ? "9+" : unreadAlerts}
                    </span>
                  )}
                </div>
                {!collapsed && <span>{item.title}</span>}
                {!collapsed && isAlerts && unreadAlerts > 0 && (
                  <span className="ml-auto w-4 h-4 rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold flex items-center justify-center">
                    {unreadAlerts > 9 ? "9+" : unreadAlerts}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="h-px bg-white/5 my-3 mx-1" />

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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/5 bg-[#141416]/80 px-6 backdrop-blur-md">
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              placeholder="Search prompts, projects..."
              className="h-9 w-full rounded-lg bg-white/[0.04] border border-white/5 pl-9 pr-4 text-sm text-white/80 placeholder-white/25 outline-none focus:border-indigo-500/40 transition-colors"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/app/alerts"
              onClick={fetchUnreadAlerts}
              className="relative rounded-lg p-2 text-white/40 hover:bg-white/[0.04] hover:text-white/70 transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unreadAlerts > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
