import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import {
  LayoutDashboard, FolderOpen, MessageSquare, Bot, Trophy, AtSign,
  Target, BarChart3, FileText, Bell, Users, Plug, CreditCard, Settings,
  TrendingUp, TrendingDown, Plus, Search, Download, Check, X,
  ChevronRight, Globe, Eye, Shield, Key, Mail, Zap, Clock,
  ArrowUpRight, ArrowDownRight, Filter, Calendar, ExternalLink,
  Monitor, PanelLeft, ChevronLeft, RotateCw, Share, Copy,
} from "lucide-react";
import {
  visibilityOverTime, modelDistribution, brandRankings,
  recentAlerts, topPerformingPrompts, weeklyGrowthData, recentResponses,
  projectsList, rankingsMatrix, mentionsFeed, reportsHistory,
  teamMembers, integrationsList, competitors, analyticsWeekly, prompts,
} from "@/lib/mock-data";
import { ScaledDashboard } from "./DashboardMockup";
import { Logo } from "./Logo";
import { SectionKicker, DisplayHeading } from "./section-shell";
import { useScrollReveal } from "@/hooks/useScrollReveal";

/* ------------------------------------------------------------------ */
/*  Sidebar configuration                                             */
/* ------------------------------------------------------------------ */
const SIDEBAR_ITEMS = [
  { id: "dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { id: "projects",     label: "Projects",     icon: FolderOpen      },
  { id: "prompts",      label: "Prompts",      icon: MessageSquare   },
  { id: "models",       label: "AI Models",    icon: Bot             },
  { id: "rankings",     label: "Rankings",     icon: Trophy          },
  { id: "mentions",     label: "Mentions",     icon: AtSign          },
  { id: "competitors",  label: "Competitors",  icon: Target          },
  { id: "analytics",    label: "Analytics",    icon: BarChart3       },
  { id: "reports",      label: "Reports",      icon: FileText        },
  { id: "alerts",       label: "Alerts",       icon: Bell            },
  { id: "divider",      label: "",             icon: null            },
  { id: "team",         label: "Team",         icon: Users           },
  { id: "integrations", label: "Integrations", icon: Plug            },
  { id: "billing",      label: "Billing",      icon: CreditCard      },
  { id: "settings",     label: "Settings",     icon: Settings        },
];

/* ------------------------------------------------------------------ */
/*  Colour helpers                                                    */
/* ------------------------------------------------------------------ */
const MODEL_COLORS: Record<string, string> = {
  ChatGPT: "#10a37f", Gemini: "#4285f4", Claude: "#c85a2a", Perplexity: "#7c3aed",
};
const severityColor: Record<string, string> = {
  success: "#22c55e", warning: "#f59e0b", info: "#6366f1", danger: "#ef4444",
};

/* ================================================================== */
/*  MAIN EXPORT                                                       */
/* ================================================================== */
export function DashboardPreview() {
  const { ref, isIntersecting } = useScrollReveal(0.05);
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <section
      id="dashboard"
      ref={ref as any}
      className={`relative py-20 sm:py-28 bg-[#f8f8fa] transition-colors duration-500 reveal-on-scroll ${
        isIntersecting ? "revealed" : ""
      }`}
    >
      {/* Section header */}
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <SectionKicker label="Command center" />
          <DisplayHeading>
            A beautiful home for<br />your AI visibility.
          </DisplayHeading>
          <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed max-w-lg mx-auto">
            Every metric you need, presented with the clarity you'd design yourself.
          </p>
        </div>

        {/* Interactive browser-frame mockup */}
        <div className="mt-16">
          <ScaledDashboard designWidth={1100}>
            <div className="rounded-2xl overflow-hidden bg-[#1a1a1c] shadow-[0_32px_80px_rgba(0,0,0,0.35)] ring-1 ring-white/10 text-left">
              {/* ── Title bar ────────────────────────────── */}
              <div className="bg-[#242427] border-b border-white/5 px-4 py-2.5 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <PanelLeft className="w-3.5 h-3.5 text-white/40" />
                  <ChevronLeft className="w-3.5 h-3.5 text-white/40" />
                  <ChevronRight className="w-3.5 h-3.5 text-white/25" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-[#1a1a1c] rounded-md px-6 py-1 text-[10px] text-white/60 flex items-center gap-2 min-w-[220px] justify-center">
                    <Monitor className="w-3 h-3" /> app.rankflow.ai/{activeTab}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 text-white/40" />
                  <Share className="w-3.5 h-3.5 text-white/40" />
                  <Plus className="w-3.5 h-3.5 text-white/40" />
                  <Copy className="w-3.5 h-3.5 text-white/40" />
                </div>
              </div>

              {/* ── Body: sidebar + content ────────────── */}
              <div className="grid grid-cols-[190px_1fr]" style={{ height: 560 }}>
                {/* Sidebar */}
                <div className="border-r border-white/5 bg-[#1e1e21] px-3 py-3.5 flex flex-col overflow-y-auto mockup-scroll">
                  <div className="flex items-center gap-2 mb-4">
                    <Logo className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span className="text-[11px] font-semibold text-white/90">RankFlow</span>
                  </div>
                  <nav className="flex-1 space-y-0.5">
                    {SIDEBAR_ITEMS.map((item) =>
                      item.id === "divider" ? (
                        <div key="div" className="h-px bg-white/5 my-3" />
                      ) : (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-[6px] text-[11px] font-medium transition-colors cursor-pointer ${
                            activeTab === item.id
                              ? "bg-indigo-600/20 text-indigo-400"
                              : "text-white/55 hover:bg-white/[0.04] hover:text-white/80"
                          }`}
                        >
                          {item.icon && <item.icon className="w-3.5 h-3.5 shrink-0" />}
                          {item.label}
                        </button>
                      ),
                    )}
                  </nav>
                  {/* Bottom user chip */}
                  <div className="mt-auto pt-3 border-t border-white/5 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-500 grid place-items-center text-[8px] font-bold text-white">SC</div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-white/80 font-medium truncate">Sarah Chen</div>
                      <div className="text-[8px] text-white/35 truncate">Admin</div>
                    </div>
                  </div>
                </div>

                {/* Content area */}
                <div className="bg-[#141416] overflow-y-auto mockup-scroll p-5">
                  <div key={activeTab} className="animate-page-in">
                    {activeTab === "dashboard"    && <DashboardPage    animated={isIntersecting} />}
                    {activeTab === "projects"     && <ProjectsPage />}
                    {activeTab === "prompts"      && <PromptsPage />}
                    {activeTab === "models"       && <AIModelsPage />}
                    {activeTab === "rankings"     && <RankingsPage />}
                    {activeTab === "mentions"     && <MentionsPage />}
                    {activeTab === "competitors"  && <CompetitorsPage  animated={isIntersecting} />}
                    {activeTab === "analytics"    && <AnalyticsPage    animated={isIntersecting} />}
                    {activeTab === "reports"      && <ReportsPage />}
                    {activeTab === "alerts"       && <AlertsPage />}
                    {activeTab === "team"         && <TeamPage />}
                    {activeTab === "integrations" && <IntegrationsPage />}
                    {activeTab === "billing"      && <BillingPage />}
                    {activeTab === "settings"     && <SettingsPage />}
                  </div>
                </div>
              </div>
            </div>
          </ScaledDashboard>
        </div>
      </div>
    </section>
  );
}


/* ================================================================== */
/*  Helper components                                                  */
/* ================================================================== */

function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
      {subtitle && <p className="text-[10px] text-white/40 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-white/[0.03] ring-1 ring-white/5 p-4 ${className}`}>
      {children}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider"
      style={{ background: `${color}15`, color }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function SmallBtn({ children, primary = false }: { children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[9px] font-semibold transition-colors ${
        primary
          ? "bg-indigo-600 text-white hover:bg-indigo-500"
          : "bg-white/5 text-white/60 ring-1 ring-white/10 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}


/* ================================================================== */
/*  1. DASHBOARD PAGE  (12 widgets)                                    */
/* ================================================================== */

function DashboardPage({ animated }: { animated: boolean }) {
  return (
    <>
      <PageTitle title="Dashboard" subtitle="Overview · Last 30 days" />

      {/* ── Row 1 · KPI cards ─────────────────────── */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {[
          { label: "AI Visibility", value: "84.2", icon: Eye,        change: "+12.4%", up: true  },
          { label: "Avg Brand Rank", value: "#2.1",  icon: Trophy,    change: "+0.8",   up: true  },
          { label: "Total Mentions", value: "1,842", icon: AtSign,    change: "+8.7%",  up: true  },
          { label: "Total Prompts",  value: "142",   icon: MessageSquare, change: "+14",   up: true  },
          { label: "Models Monitored", value: "4",   icon: Bot,       change: "",       up: true  },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className="w-3.5 h-3.5 text-indigo-400/80" />
              {kpi.change && (
                <span className={`flex items-center gap-0.5 text-[8px] font-semibold ${kpi.up ? "text-emerald-400" : "text-red-400"}`}>
                  {kpi.up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                  {kpi.change}
                </span>
              )}
            </div>
            <div className="text-lg font-semibold text-white leading-none">{kpi.value}</div>
            <div className="text-[8px] text-white/35 mt-1 uppercase tracking-wider">{kpi.label}</div>
          </Card>
        ))}
      </div>

      {/* ── Row 2 · Charts ────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Visibility Over Time (area chart) */}
        <Card className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] font-semibold text-white">Visibility Over Time</div>
              <div className="text-[8px] text-white/35">Score index vs. competitor avg</div>
            </div>
            <div className="flex items-center gap-3 text-[8px] text-white/45">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> You</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white/25" /> Competitor</span>
            </div>
          </div>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visibilityOverTime} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={8} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 10, color: "#fff" }} />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#gradScore)" dot={{ r: 2, fill: "#6366f1", strokeWidth: 0 }} isAnimationActive={animated} />
                <Line type="monotone" dataKey="competitor" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={animated} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Mentions by AI Model (donut) */}
        <Card>
          <div className="text-[11px] font-semibold text-white mb-1">Mentions by Model</div>
          <div className="text-[8px] text-white/35 mb-2">Share of AI voice</div>
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={modelDistribution} dataKey="value" nameKey="name" innerRadius={32} outerRadius={48} paddingAngle={3} stroke="none" isAnimationActive={animated}>
                  {modelDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1 mt-1">
            {modelDistribution.map((m) => (
              <li key={m.name} className="flex items-center justify-between text-[9px]">
                <span className="flex items-center gap-1.5 text-white/60"><span className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />{m.name}</span>
                <span className="font-semibold text-white/80">{m.value}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ── Row 3 · Top prompts + Competitor ──────── */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Top performing prompts */}
        <Card>
          <div className="text-[11px] font-semibold text-white mb-3">Top Performing Prompts</div>
          <div className="space-y-2">
            {topPerformingPrompts.slice(0, 4).map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-white/[0.06] grid place-items-center text-[8px] font-bold text-indigo-400 shrink-0">
                  {i + 1}
                </span>
                <span className="text-[9px] text-white/70 flex-1 truncate">{p.prompt}</span>
                <span className="text-[8px] text-white/50 font-mono">{p.model}</span>
                <span className={`text-[8px] font-semibold ${p.trend.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>{p.trend}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Competitor Comparison bar chart */}
        <Card>
          <div className="text-[11px] font-semibold text-white mb-1">Competitor Comparison</div>
          <div className="text-[8px] text-white/35 mb-2">Avg recommendation score</div>
          <div className="h-[110px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandRankings} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="brand" type="category" width={80} stroke="rgba(255,255,255,0.2)" fontSize={8} tickLine={false} axisLine={false} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} isAnimationActive={animated}>
                  {brandRankings.map((_, i) => <Cell key={i} fill={i === 0 ? "#6366f1" : "rgba(255,255,255,0.08)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Row 4 · Alerts + Responses + Growth ──── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Recent Alerts */}
        <Card>
          <div className="text-[11px] font-semibold text-white mb-3">Recent Alerts</div>
          <div className="space-y-2">
            {recentAlerts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-start gap-2">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: severityColor[a.severity] }} />
                <div>
                  <div className="text-[9px] text-white/70 leading-snug">{a.message}</div>
                  <div className="text-[7px] text-white/30 mt-0.5">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent AI Responses */}
        <Card>
          <div className="text-[11px] font-semibold text-white mb-3">Recent AI Responses</div>
          <div className="space-y-2">
            {recentResponses.map((r) => (
              <div key={r.id} className="rounded-lg bg-white/[0.02] p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: MODEL_COLORS[r.model] || "#6366f1" }} />
                  <span className="text-[8px] font-semibold text-white/70">{r.model}</span>
                  <span className="text-[7px] text-white/30 ml-auto">{r.time}</span>
                </div>
                <div className="text-[8px] text-white/45 line-clamp-2 leading-relaxed">{r.excerpt}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Weekly / Monthly Growth */}
        <Card>
          <div className="text-[11px] font-semibold text-white mb-3">Weekly Growth</div>
          <div className="space-y-2">
            {weeklyGrowthData.map((g) => (
              <div key={g.label} className="flex items-center justify-between">
                <span className="text-[9px] text-white/60">{g.label}</span>
                <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${g.positive ? "text-emerald-400" : "text-red-400"}`}>
                  {g.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  +{g.value}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}


/* ================================================================== */
/*  2. PROJECTS PAGE                                                   */
/* ================================================================== */

function ProjectsPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <PageTitle title="Projects" subtitle="Manage your tracked brands & websites" />
        <SmallBtn primary><Plus className="w-3 h-3" /> New Project</SmallBtn>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {projectsList.map((p) => (
          <Card key={p.id}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 grid place-items-center text-[10px] font-bold text-indigo-400">{p.name[0]}</div>
                <div>
                  <div className="text-[11px] font-semibold text-white">{p.name}</div>
                  <div className="text-[8px] text-white/35 flex items-center gap-1"><Globe className="w-2.5 h-2.5" />{p.url}</div>
                </div>
              </div>
              <Badge label={p.status} color={p.status === "active" ? "#22c55e" : "#f59e0b"} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: "Prompts", v: p.prompts },
                { l: "Models", v: p.models },
                { l: "Visibility", v: p.visibility },
              ].map((s) => (
                <div key={s.l} className="text-center rounded-md bg-white/[0.03] py-1.5">
                  <div className="text-[11px] font-semibold text-white">{s.v}</div>
                  <div className="text-[7px] text-white/30 uppercase tracking-wider">{s.l}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}


/* ================================================================== */
/*  3. PROMPTS PAGE                                                    */
/* ================================================================== */

function PromptsPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <PageTitle title="Prompts" subtitle="Create, organize & schedule AI prompts" />
        <div className="flex items-center gap-2">
          <SmallBtn><Filter className="w-3 h-3" /> Filter</SmallBtn>
          <SmallBtn primary><Plus className="w-3 h-3" /> New Prompt</SmallBtn>
        </div>
      </div>
      <Card className="!p-0 overflow-hidden">
        <div className="grid grid-cols-[1fr_50px_60px_50px_60px] gap-3 px-4 py-2 text-[8px] uppercase tracking-wider text-white/30 border-b border-white/5 font-semibold">
          <span>Prompt</span><span>Models</span><span>Mentions</span><span>Rank</span><span>Status</span>
        </div>
        {prompts.map((p) => (
          <div key={p.id} className="grid grid-cols-[1fr_50px_60px_50px_60px] gap-3 px-4 py-2.5 text-[10px] border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
            <span className="text-white/80 truncate">{p.text}</span>
            <span className="text-white/50">{p.models}</span>
            <span className="text-white/50">{p.mentions}</span>
            <span className="text-white font-semibold">#{p.avgRank}</span>
            <Badge label={p.status} color={p.status === "active" ? "#22c55e" : "#f59e0b"} />
          </div>
        ))}
      </Card>
    </>
  );
}


/* ================================================================== */
/*  4. AI MODELS PAGE                                                  */
/* ================================================================== */

function AIModelsPage() {
  const models = [
    { name: "ChatGPT",    vendor: "OpenAI",        color: "#10a37f", versions: "GPT-4o · o1 · o3",          status: "live" },
    { name: "Gemini",     vendor: "Google",         color: "#4285f4", versions: "2.0 Pro · 2.0 Flash",       status: "live" },
    { name: "Claude",     vendor: "Anthropic",      color: "#c85a2a", versions: "Sonnet 3.5 · Opus 3",       status: "live" },
    { name: "Perplexity", vendor: "Perplexity AI",  color: "#7c3aed", versions: "Sonar Pro · Sonar Reason",  status: "live" },
  ];
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <PageTitle title="AI Models" subtitle="Configure & compare tracked models" />
        <SmallBtn primary><Plus className="w-3 h-3" /> Add Model</SmallBtn>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {models.map((m) => (
          <Card key={m.name}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl grid place-items-center text-white text-xs font-bold" style={{ background: m.color }}>{m.name[0]}</div>
                <div>
                  <div className="text-[11px] font-semibold text-white">{m.name}</div>
                  <div className="text-[8px] text-white/35">{m.vendor}</div>
                </div>
              </div>
              <Badge label={m.status} color="#22c55e" />
            </div>
            <div className="rounded-md bg-white/[0.03] px-3 py-2 flex items-center justify-between">
              <span className="text-[8px] text-white/35 uppercase tracking-wider font-semibold">Versions</span>
              <span className="text-[9px] text-white/60">{m.versions}</span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}


/* ================================================================== */
/*  5. RANKINGS PAGE                                                   */
/* ================================================================== */

function RankingsPage() {
  const rankColor = (r: number) => r <= 1 ? "#fbbf24" : r <= 2 ? "#94a3b8" : r <= 3 ? "#cd7f32" : "rgba(255,255,255,0.3)";
  return (
    <>
      <PageTitle title="Rankings" subtitle="Brand positions across prompts & AI models" />
      <Card className="!p-0 overflow-hidden">
        <div className="grid grid-cols-[1fr_65px_65px_65px_65px] gap-2 px-4 py-2 text-[8px] uppercase tracking-wider text-white/30 border-b border-white/5 font-semibold">
          <span>Prompt</span><span className="text-center">ChatGPT</span><span className="text-center">Gemini</span><span className="text-center">Claude</span><span className="text-center">Perplexity</span>
        </div>
        {rankingsMatrix.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_65px_65px_65px_65px] gap-2 px-4 py-2.5 text-[10px] border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
            <span className="text-white/80 truncate">{r.prompt}</span>
            {(["chatgpt", "gemini", "claude", "perplexity"] as const).map((model) => (
              <span key={model} className="text-center font-semibold" style={{ color: rankColor(r[model]) }}>#{r[model]}</span>
            ))}
          </div>
        ))}
      </Card>
    </>
  );
}


/* ================================================================== */
/*  6. MENTIONS PAGE                                                   */
/* ================================================================== */

function MentionsPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <PageTitle title="Mentions" subtitle="Where & how often your brand is mentioned" />
        <SmallBtn><Filter className="w-3 h-3" /> Filter</SmallBtn>
      </div>
      <Card className="!p-0 overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_70px_50px_50px_50px] gap-2 px-4 py-2 text-[8px] uppercase tracking-wider text-white/30 border-b border-white/5 font-semibold">
          <span>Model</span><span>Prompt</span><span>Sentiment</span><span>Cited</span><span>Pos</span><span>Time</span>
        </div>
        {mentionsFeed.map((m) => (
          <div key={m.id} className="grid grid-cols-[1fr_80px_70px_50px_50px_50px] gap-2 px-4 py-2.5 text-[10px] border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
            <span className="flex items-center gap-1.5 text-white/80">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: MODEL_COLORS[m.model] }} />{m.model}
            </span>
            <span className="text-white/50 truncate">{m.prompt}</span>
            <Badge label={m.sentiment} color={m.sentiment === "positive" ? "#22c55e" : "#f59e0b"} />
            <span className="text-center">{m.cited ? <Check className="w-3 h-3 text-emerald-400 mx-auto" /> : <X className="w-3 h-3 text-white/20 mx-auto" />}</span>
            <span className="text-white font-semibold text-center">#{m.position}</span>
            <span className="text-white/30 text-[9px]">{m.time}</span>
          </div>
        ))}
      </Card>
    </>
  );
}


/* ================================================================== */
/*  7. COMPETITORS PAGE                                                */
/* ================================================================== */

function CompetitorsPage({ animated }: { animated: boolean }) {
  return (
    <>
      <PageTitle title="Competitors" subtitle="Compare visibility & rankings against rivals" />
      <div className="grid grid-cols-4 gap-3 mb-4">
        {competitors.map((c) => (
          <Card key={c.name}>
            <div className="text-[10px] font-semibold text-white mb-2">{c.name}</div>
            <div className="text-lg font-semibold text-white leading-none">{c.visibility}</div>
            <div className="text-[7px] text-white/30 uppercase tracking-wider mt-0.5">Visibility</div>
            <div className="flex items-center gap-1 mt-2">
              {c.trend > 0 ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
              <span className={`text-[9px] font-semibold ${c.trend > 0 ? "text-emerald-400" : "text-red-400"}`}>{c.trend > 0 ? "+" : ""}{c.trend}%</span>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <div className="text-[11px] font-semibold text-white mb-2">Score Comparison</div>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={brandRankings} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="brand" stroke="rgba(255,255,255,0.2)" fontSize={8} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={8} tickLine={false} axisLine={false} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]} isAnimationActive={animated}>
                {brandRankings.map((_, i) => <Cell key={i} fill={i === 0 ? "#6366f1" : "rgba(255,255,255,0.08)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}


/* ================================================================== */
/*  8. ANALYTICS PAGE                                                  */
/* ================================================================== */

function AnalyticsPage({ animated }: { animated: boolean }) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <PageTitle title="Analytics" subtitle="Trends, visibility score, AI share & performance" />
        <div className="flex items-center gap-2">
          <SmallBtn><Calendar className="w-3 h-3" /> Last 4 weeks</SmallBtn>
          <SmallBtn><Download className="w-3 h-3" /> Export</SmallBtn>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="col-span-2">
          <div className="text-[11px] font-semibold text-white mb-2">Visibility Trend</div>
          <div className="h-[130px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visibilityOverTime} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={8} tickLine={false} axisLine={false} />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#gradAnalytics)" isAnimationActive={animated} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="text-[11px] font-semibold text-white mb-2">Weekly Performance</div>
          <div className="space-y-2">
            {analyticsWeekly.map((w) => (
              <div key={w.week} className="flex items-center justify-between">
                <span className="text-[9px] text-white/40 font-mono">{w.week}</span>
                <div className="flex-1 mx-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${w.visibility}%` }} />
                </div>
                <span className="text-[9px] text-white/60 font-semibold">{w.visibility}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-[11px] font-semibold text-white mb-2">Mentions by Model</div>
          <div className="h-[110px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelDistribution} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={8} tickLine={false} axisLine={false} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={animated}>
                  {modelDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="text-[11px] font-semibold text-white mb-2">Share of Voice</div>
          <div className="h-[110px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={modelDistribution} dataKey="value" innerRadius={30} outerRadius={45} paddingAngle={3} stroke="none" isAnimationActive={animated}>
                  {modelDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  );
}


/* ================================================================== */
/*  9. REPORTS PAGE                                                    */
/* ================================================================== */

function ReportsPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <PageTitle title="Reports" subtitle="Export PDF/CSV reports & scheduled summaries" />
        <SmallBtn primary><Plus className="w-3 h-3" /> New Report</SmallBtn>
      </div>
      <Card className="!p-0 overflow-hidden">
        <div className="grid grid-cols-[1fr_50px_90px_70px_50px] gap-2 px-4 py-2 text-[8px] uppercase tracking-wider text-white/30 border-b border-white/5 font-semibold">
          <span>Report Name</span><span>Type</span><span>Date</span><span>Status</span><span></span>
        </div>
        {reportsHistory.map((r) => (
          <div key={r.id} className="grid grid-cols-[1fr_50px_90px_70px_50px] gap-2 px-4 py-2.5 text-[10px] border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
            <span className="flex items-center gap-1.5 text-white/80"><FileText className="w-3 h-3 text-white/30" />{r.name}</span>
            <span className="text-white/50 font-mono text-[8px]">{r.type}</span>
            <span className="text-white/40">{r.date}</span>
            <Badge label={r.status} color={r.status === "ready" ? "#22c55e" : "#6366f1"} />
            <button className="text-white/30 hover:text-white/60 transition-colors"><Download className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </Card>
    </>
  );
}


/* ================================================================== */
/*  10. ALERTS PAGE                                                    */
/* ================================================================== */

function AlertsPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <PageTitle title="Alerts" subtitle="Notifications for rank changes & competitor moves" />
        <SmallBtn primary><Plus className="w-3 h-3" /> New Alert Rule</SmallBtn>
      </div>
      <Card>
        <div className="text-[11px] font-semibold text-white mb-3">Recent Notifications</div>
        <div className="space-y-3">
          {recentAlerts.map((a) => (
            <div key={a.id} className="flex items-start gap-2.5 rounded-lg bg-white/[0.02] p-2.5">
              <span className="mt-0.5 w-2 h-2 rounded-full shrink-0" style={{ background: severityColor[a.severity] }} />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-white/80 leading-snug">{a.message}</div>
                <div className="text-[8px] text-white/30 mt-1 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{a.time}</div>
              </div>
              <ChevronRight className="w-3 h-3 text-white/20 shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}


/* ================================================================== */
/*  11. TEAM PAGE                                                      */
/* ================================================================== */

function TeamPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <PageTitle title="Team" subtitle="Invite members & manage roles" />
        <SmallBtn primary><Plus className="w-3 h-3" /> Invite Member</SmallBtn>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {teamMembers.map((t) => (
          <Card key={t.id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full grid place-items-center text-[10px] font-bold text-white bg-indigo-600/60">{t.initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-white">{t.name}</div>
              <div className="text-[8px] text-white/35 truncate">{t.email}</div>
            </div>
            <Badge label={t.role} color={t.role === "Admin" ? "#6366f1" : t.role === "Editor" ? "#22c55e" : "#94a3b8"} />
          </Card>
        ))}
      </div>
    </>
  );
}


/* ================================================================== */
/*  12. INTEGRATIONS PAGE                                              */
/* ================================================================== */

function IntegrationsPage() {
  return (
    <>
      <PageTitle title="Integrations" subtitle="Connect OpenAI, Gemini, Slack, email, webhooks & more" />
      <div className="grid grid-cols-2 gap-3">
        {integrationsList.map((integ) => (
          <Card key={integ.id} className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl grid place-items-center text-base"
              style={{ background: `${integ.color}18` }}
            >
              {integ.icon}
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-semibold text-white">{integ.name}</div>
              <div className="text-[8px] text-white/35 capitalize">{integ.status}</div>
            </div>
            <div className={`w-7 h-4 rounded-full flex items-center px-0.5 transition-colors ${integ.status === "connected" ? "bg-emerald-500/40 justify-end" : "bg-white/10 justify-start"}`}>
              <div className={`w-3 h-3 rounded-full ${integ.status === "connected" ? "bg-emerald-400" : "bg-white/30"}`} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}


/* ================================================================== */
/*  13. BILLING PAGE                                                   */
/* ================================================================== */

function BillingPage() {
  return (
    <>
      <PageTitle title="Billing" subtitle="Subscription & usage management" />
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] font-semibold text-white">Current Plan</div>
              <div className="text-[8px] text-white/35">Billed monthly</div>
            </div>
            <Badge label="Pro" color="#6366f1" />
          </div>
          <div className="text-2xl font-bold text-white">$79<span className="text-sm text-white/30 font-normal">/mo</span></div>
          <div className="text-[9px] text-white/40 mt-1">Next billing: Aug 1, 2026</div>
          <div className="mt-3 flex gap-2">
            <SmallBtn primary>Upgrade Plan</SmallBtn>
            <SmallBtn>Manage</SmallBtn>
          </div>
        </Card>
        <Card>
          <div className="text-[11px] font-semibold text-white mb-3">Usage This Month</div>
          {[
            { label: "API Calls", used: 8420, limit: 10000 },
            { label: "Prompts", used: 142, limit: 200 },
            { label: "Team Members", used: 4, limit: 5 },
          ].map((u) => (
            <div key={u.label} className="mb-2">
              <div className="flex items-center justify-between text-[8px] text-white/40 mb-0.5">
                <span>{u.label}</span>
                <span>{u.used}/{u.limit}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(u.used / u.limit) * 100}%`,
                    background: u.used / u.limit > 0.85 ? "#ef4444" : "#6366f1",
                  }}
                />
              </div>
            </div>
          ))}
        </Card>
      </div>
      <Card className="!p-0 overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_70px] gap-2 px-4 py-2 text-[8px] uppercase tracking-wider text-white/30 border-b border-white/5 font-semibold">
          <span>Invoice</span><span>Amount</span><span>Status</span>
        </div>
        {[
          { inv: "INV-2026-07", amount: "$79.00", status: "paid" },
          { inv: "INV-2026-06", amount: "$79.00", status: "paid" },
          { inv: "INV-2026-05", amount: "$49.00", status: "paid" },
        ].map((inv, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_70px] gap-2 px-4 py-2.5 text-[10px] border-b border-white/5 last:border-0">
            <span className="text-white/70">{inv.inv}</span>
            <span className="text-white/80 font-semibold">{inv.amount}</span>
            <Badge label={inv.status} color="#22c55e" />
          </div>
        ))}
      </Card>
    </>
  );
}


/* ================================================================== */
/*  14. SETTINGS PAGE                                                  */
/* ================================================================== */

function SettingsPage() {
  return (
    <>
      <PageTitle title="Settings" subtitle="Profile, API keys, preferences & account" />
      <div className="space-y-4">
        {/* Profile */}
        <Card>
          <div className="text-[11px] font-semibold text-white mb-3 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-indigo-400" /> Profile</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Full Name", value: "Sarah Chen" },
              { label: "Email", value: "sarah@rankflow.ai" },
              { label: "Company", value: "RankFlow Inc." },
              { label: "Timezone", value: "UTC-8 (Pacific)" },
            ].map((f) => (
              <div key={f.label}>
                <div className="text-[8px] text-white/30 uppercase tracking-wider mb-1">{f.label}</div>
                <div className="rounded-md bg-white/[0.04] ring-1 ring-white/5 px-2.5 py-1.5 text-[10px] text-white/70">{f.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* API Keys */}
        <Card>
          <div className="text-[11px] font-semibold text-white mb-3 flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-indigo-400" /> API Keys</div>
          <div className="space-y-2">
            {[
              { name: "Production Key", key: "rf_prod_****…8a3f", created: "Jun 1, 2026" },
              { name: "Development Key", key: "rf_dev_****…c91b", created: "May 15, 2026" },
            ].map((k) => (
              <div key={k.name} className="flex items-center justify-between rounded-md bg-white/[0.03] ring-1 ring-white/5 px-3 py-2">
                <div>
                  <div className="text-[10px] text-white/70">{k.name}</div>
                  <div className="text-[8px] text-white/30 font-mono">{k.key} · Created {k.created}</div>
                </div>
                <SmallBtn>Reveal</SmallBtn>
              </div>
            ))}
          </div>
        </Card>

        {/* Preferences */}
        <Card>
          <div className="text-[11px] font-semibold text-white mb-3 flex items-center gap-1.5"><Settings className="w-3.5 h-3.5 text-indigo-400" /> Preferences</div>
          <div className="space-y-2.5">
            {[
              { label: "Email notifications", desc: "Receive alerts via email", on: true },
              { label: "Weekly digest", desc: "Summary report every Monday", on: true },
              { label: "Dark mode", desc: "Use dark theme in dashboard", on: true },
              { label: "Beta features", desc: "Early access to new features", on: false },
            ].map((pref) => (
              <div key={pref.label} className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-white/70">{pref.label}</div>
                  <div className="text-[8px] text-white/30">{pref.desc}</div>
                </div>
                <div className={`w-7 h-4 rounded-full flex items-center px-0.5 ${pref.on ? "bg-indigo-500/40 justify-end" : "bg-white/10 justify-start"}`}>
                  <div className={`w-3 h-3 rounded-full ${pref.on ? "bg-indigo-400" : "bg-white/30"}`} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
