import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FileText, Download, Loader2, Calendar, Eye, Printer, Plus, Trash2, Mail, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/app/reports")({
  component: Reports,
});

const MODEL_COLORS: Record<string, string> = {
  chatgpt: "#10a37f", gemini: "#4285f4", claude: "#c85a2a", perplexity: "#7c3aed",
};

function Reports() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [range, setRange] = useState<string>("30d");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Scheduled reports states
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReportName, setNewReportName] = useState("");
  const [newReportFormat, setNewReportFormat] = useState("pdf");
  const [newReportFrequency, setNewReportFrequency] = useState("weekly");
  const [newReportRecipients, setNewReportRecipients] = useState("");
  const [newReportProjectId, setNewReportProjectId] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    supabase.from("projects").select("id, name, brand, website").order("name").then(({ data }) => {
      setProjects(data || []);
      if (data && data.length > 0) {
        setNewReportProjectId(data[0].id);
      }
    });
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data } = await (supabase as any)
        .from("report_templates")
        .select("*, projects(name)");
      setSchedules(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;

    try {
      setSavingSchedule(true);
      const emails = newReportRecipients.split(",").map(e => e.trim()).filter(Boolean);
      const { error } = await (supabase as any)
        .from("report_templates")
        .insert({
          project_id: newReportProjectId,
          user_id: authData.user.id,
          name: newReportName,
          format: newReportFormat,
          frequency: newReportFrequency,
          recipients: emails,
          is_active: true
        });

      if (error) throw error;
      toast.success("Scheduled report created successfully!");
      setIsModalOpen(false);
      setNewReportName("");
      setNewReportRecipients("");
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.message || "Failed to create schedule");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      const { error } = await (supabase as any).from("report_templates").delete().eq("id", id);
      if (error) throw error;
      toast.success("Schedule deleted");
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await (supabase as any)
        .from("report_templates")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      setSchedules(schedules.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
      toast.success("Schedule updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const rangeDays = range === "7d" ? 7 : range === "30d" ? 30 : 90;
      const since = new Date(Date.now() - rangeDays * 86400 * 1000).toISOString();

      // Fetch prompt runs
      let query = supabase.from("prompt_runs").select(`
        id, model, is_mentioned, rank, created_at,
        prompts ( text, project_id )
      `).gte("created_at", since);

      const { data: runs } = await query;

      const allRuns = (runs || []).filter((r: any) => {
        if (selectedProjectId === "all") return true;
        const p = Array.isArray(r.prompts) ? r.prompts[0] : r.prompts;
        return p?.project_id === selectedProjectId;
      });

      // Compute stats
      const total = allRuns.length;
      const mentioned = allRuns.filter((r: any) => r.is_mentioned);
      const mentionRate = total > 0 ? Math.round((mentioned.length / total) * 100) : 0;
      const ranked = mentioned.filter((r: any) => r.rank !== null);
      const avgRank = ranked.length > 0
        ? parseFloat((ranked.reduce((a: number, r: any) => a + r.rank, 0) / ranked.length).toFixed(1))
        : null;

      // Visibility by date
      const byDate: Record<string, { total: number; mentioned: number }> = {};
      for (const r of allRuns as any[]) {
        const day = r.created_at.slice(0, 10);
        if (!byDate[day]) byDate[day] = { total: 0, mentioned: 0 };
        byDate[day].total++;
        if (r.is_mentioned) byDate[day].mentioned++;
      }
      const visibilityTrend = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, { total, mentioned }]) => ({
          date: date.slice(5),
          visibility: total > 0 ? Math.round((mentioned / total) * 100) : 0,
        }));

      // SoV by model
      const modelCounts: Record<string, number> = {};
      for (const r of mentioned as any[]) {
        modelCounts[r.model] = (modelCounts[r.model] || 0) + 1;
      }
      const sovData = Object.entries(MODEL_COLORS).map(([key, color]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: modelCounts[key] || 0,
        color,
      }));

      // Top prompts
      const promptCounts: Record<string, { text: string; mentioned: number; total: number }> = {};
      for (const r of allRuns as any[]) {
        const p = Array.isArray(r.prompts) ? r.prompts[0] : r.prompts;
        const text = p?.text || "Unknown";
        if (!promptCounts[text]) promptCounts[text] = { text, mentioned: 0, total: 0 };
        promptCounts[text].total++;
        if (r.is_mentioned) promptCounts[text].mentioned++;
      }
      const topPrompts = Object.values(promptCounts)
        .sort((a, b) => b.mentioned - a.mentioned)
        .map((p) => ({ text: p.text, total: p.total, mentioned: p.mentioned }))
        .slice(0, 5);

      const proj = projects.find((p) => p.id === selectedProjectId);

      setReportData({
        generatedAt: new Date().toLocaleDateString("en-US", { dateStyle: "long" }),
        range,
        projectName: proj?.name || "All Projects",
        brand: proj?.brand || "All Brands",
        total, mentionRate, avgRank,
        visibilityTrend, sovData, topPrompts,
      });

      setPreviewing(true);
    } catch (err: any) {
      toast.error("Failed to generate report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Reports & Scheduled Digests</h1>
          <p className="mt-1 text-sm text-white/40">Configure scheduled dashboards, executive digests & export layouts</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 ring-1 ring-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Scheduled Report
          </button>
          {previewing && (
            <button
              onClick={printReport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
          )}
        </div>
      </div>

      {/* Modal overlays for creating a report schedule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md rounded-2xl bg-[#1e1e21] border border-white/5 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-base font-semibold text-white mb-4">Create Scheduled Report</h2>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Report Name</label>
                <input
                  value={newReportName}
                  onChange={(e) => setNewReportName(e.target.value)}
                  placeholder="e.g. Weekly SEO Visibility Digest"
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Project Campaign</label>
                <select
                  value={newReportProjectId}
                  onChange={(e) => setNewReportProjectId(e.target.value)}
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#1e1e21]">{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Format</label>
                  <select
                    value={newReportFormat}
                    onChange={(e) => setNewReportFormat(e.target.value)}
                    className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  >
                    <option value="pdf" className="bg-[#1e1e21]">PDF Report</option>
                    <option value="csv" className="bg-[#1e1e21]">CSV Raw Data</option>
                    <option value="email_digest" className="bg-[#1e1e21]">Email Digest</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Frequency</label>
                  <select
                    value={newReportFrequency}
                    onChange={(e) => setNewReportFrequency(e.target.value)}
                    className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  >
                    <option value="daily" className="bg-[#1e1e21]">Daily</option>
                    <option value="weekly" className="bg-[#1e1e21]">Weekly</option>
                    <option value="monthly" className="bg-[#1e1e21]">Monthly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Recipients (comma separated)</label>
                <input
                  value={newReportRecipients}
                  onChange={(e) => setNewReportRecipients(e.target.value)}
                  placeholder="e.g. boss@corp.com, me@agency.com"
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg bg-white/5 text-white/60 ring-1 ring-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
                >
                  {savingSchedule && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Schedule Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Builder */}
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 space-y-4 print:hidden">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" /> Report Builder
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
            >
              <option value="all" className="bg-[#1e1e21]">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#1e1e21]">{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Date Range</label>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
            >
              <option value="7d" className="bg-[#1e1e21]">Last 7 days</option>
              <option value="30d" className="bg-[#1e1e21]">Last 30 days</option>
              <option value="90d" className="bg-[#1e1e21]">Last 90 days</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              {loading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Scheduled Digests Panel */}
      {schedules.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 space-y-4 print:hidden">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-400" /> Active Schedules & Email Digests
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-white/40 pb-2">
                  <th className="py-2">Report Name</th>
                  <th className="py-2">Project</th>
                  <th className="py-2">Frequency</th>
                  <th className="py-2">Format</th>
                  <th className="py-2">Recipients</th>
                  <th className="py-2">Active</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {schedules.map((s) => (
                  <tr key={s.id} className="text-white/70 hover:bg-white/[0.01]">
                    <td className="py-2.5 font-semibold text-white">{s.name}</td>
                    <td className="py-2.5">{s.projects?.name || "-"}</td>
                    <td className="py-2.5 capitalize">{s.frequency}</td>
                    <td className="py-2.5 uppercase font-mono">{s.format}</td>
                    <td className="py-2.5 truncate max-w-xs">{s.recipients.join(", ")}</td>
                    <td className="py-2.5">
                      <div 
                        onClick={() => handleToggleActive(s.id, s.is_active)}
                        className={`w-7 h-4 rounded-full flex items-center px-0.5 transition-colors cursor-pointer ${s.is_active ? "bg-indigo-500/40 justify-end" : "bg-white/10 justify-start"}`}
                      >
                        <div className={`w-3 h-3 rounded-full ${s.is_active ? "bg-indigo-400" : "bg-white/30"}`} />
                      </div>
                    </td>
                    <td className="py-2.5">
                      <button 
                        onClick={() => handleDeleteSchedule(s.id)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Preview */}
      {previewing && reportData && (
        <div ref={printRef} className="print:bg-white print:text-black space-y-6 bg-[#18181b] border border-white/5 p-6 rounded-2xl print:border-0 print:p-0">
          {/* Report Header */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/10 ring-1 ring-indigo-500/20 p-6 print:bg-indigo-50 print:ring-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mb-1">RankFlow · AI Visibility Report</div>
                <h2 className="text-2xl font-bold text-white print:text-gray-900">{reportData.brand}</h2>
                <div className="text-sm text-white/50 mt-1 print:text-gray-500">{reportData.projectName} · Last {reportData.range}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-white/30 uppercase tracking-wider print:text-gray-400">Generated</div>
                <div className="text-sm text-white/60 print:text-gray-600">{reportData.generatedAt}</div>
              </div>
            </div>
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Audits", value: reportData.total.toString(), color: "text-white" },
              { label: "Citation Rate", value: `${reportData.mentionRate}%`, color: "text-emerald-400" },
              { label: "Avg AI Rank", value: reportData.avgRank ? `#${reportData.avgRank}` : "N/A", color: "text-indigo-400" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-5 text-center print:ring-1 print:ring-gray-200">
                <div className={`text-3xl font-bold ${kpi.color} print:text-gray-900`}>{kpi.value}</div>
                <div className="text-[11px] text-white/35 uppercase tracking-wider mt-1 print:text-gray-500">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-5 print:ring-1 print:ring-gray-200">
              <h3 className="text-sm font-semibold text-white mb-3 print:text-gray-900">AI Visibility Over Time</h3>
              {reportData.visibilityTrend.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-white/30 text-xs">No trend data available</div>
              ) : (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.visibilityTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
                      <Area type="monotone" dataKey="visibility" stroke="#6366f1" strokeWidth={2} fill="url(#repGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-5 print:ring-1 print:ring-gray-200">
              <h3 className="text-sm font-semibold text-white mb-3 print:text-gray-900">Share of Voice by AI Engine</h3>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reportData.sovData} dataKey="value" nameKey="name" innerRadius={35} outerRadius={55} paddingAngle={3} stroke="none">
                      {reportData.sovData.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1 mt-1">
                {reportData.sovData.map((m: any) => (
                  <li key={m.name} className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-white/50 print:text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />{m.name}
                    </span>
                    <span className="font-semibold text-white/70 print:text-gray-800">{m.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Top Prompts Table */}
          <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] overflow-hidden print:ring-1 print:ring-gray-200">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white print:text-gray-900">Top Performing Prompts</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-white/30 font-semibold">
                  <th className="text-left px-6 py-3 print:text-gray-500">Prompt</th>
                  <th className="text-center px-4 py-3 print:text-gray-500">Audits</th>
                  <th className="text-center px-4 py-3 print:text-gray-500">Citations</th>
                  <th className="text-center px-4 py-3 print:text-gray-500">Rate</th>
                </tr>
              </thead>
              <tbody>
                {reportData.topPrompts.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-xs text-white/30">No prompt data yet</td></tr>
                ) : (
                  reportData.topPrompts.map((p: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="px-6 py-3 text-sm text-white/70 max-w-xs truncate print:text-gray-700">{p.text}</td>
                      <td className="px-4 py-3 text-center text-sm text-white/50 print:text-gray-500">{p.total}</td>
                      <td className="px-4 py-3 text-center text-sm text-emerald-400 font-semibold print:text-green-600">{p.mentioned}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-bold text-white print:text-gray-800">
                          {p.total > 0 ? `${Math.round((p.mentioned / p.total) * 100)}%` : "0%"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Disclaimer */}
          <div className="text-[10px] text-white/20 text-center print:text-gray-400">
            Report generated by RankFlow · {reportData.generatedAt}
          </div>
        </div>
      )}

      {!previewing && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center print:hidden">
          <FileText className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-white">No Report Generated</h3>
          <p className="mt-1 text-xs text-white/45 leading-relaxed max-w-xs mx-auto">
            Select a project and date range above, then click Generate Report to preview and export your executive AI visibility summary.
          </p>
        </div>
      )}
    </div>
  );
}
