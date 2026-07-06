import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  PanelLeft, ChevronLeft, ChevronRight, Monitor, RotateCw, Share, Plus, Copy,
  Compass, Layers, ListTodo, Grid, Sparkles,
} from "lucide-react";
import { Logo } from "./Logo";

export function ScaledDashboard({ children, designWidth = 896 }: { children: ReactNode; designWidth?: number }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!outerRef.current || !innerRef.current) return;
    const ro = new ResizeObserver(() => {
      const w = outerRef.current!.offsetWidth;
      const s = Math.min(1, w / designWidth);
      setScale(s);
      setHeight(innerRef.current!.offsetHeight * s);
    });
    ro.observe(outerRef.current);
    ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [designWidth]);

  return (
    <div ref={outerRef} style={{ height }} className="overflow-hidden">
      <div
        ref={innerRef}
        style={{ width: designWidth, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}

export function DashboardMockup() {
  return (
    <div className="rounded-t-2xl overflow-hidden bg-[#1a1a1c] shadow-[0_-20px_80px_rgba(0,0,0,0.35)] ring-1 ring-white/10 text-left">
      {/* Title bar */}
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
            <Monitor className="w-3 h-3" /> rankflow.ai
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RotateCw className="w-3.5 h-3.5 text-white/40" />
          <Share className="w-3.5 h-3.5 text-white/40" />
          <Plus className="w-3.5 h-3.5 text-white/40" />
          <Copy className="w-3.5 h-3.5 text-white/40" />
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[22%_1fr]">
        {/* Sidebar */}
        <div className="border-r border-white/5 bg-[#1e1e21] px-3 py-3.5">
          <div className="flex items-center justify-between mb-4">
            <Logo className="w-4 h-4 text-white/70" />
            <Grid className="w-3.5 h-3.5 text-white/30" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded grid place-items-center text-[8px] font-bold text-white" style={{ background: "#e8553f" }}>
              R
            </div>
            <span className="text-[10px] text-white/80">RankFlow Brand</span>
          </div>
          <div className="space-y-2 mb-5">
            {[
              { icon: Compass, label: "Uncover" },
              { icon: Layers, label: "Subjects" },
              { icon: ListTodo, label: "Inbox" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-[10px] text-white/60">
                <Icon className="w-3 h-3" /> {label}
              </div>
            ))}
          </div>
          <div className="text-[8px] uppercase tracking-wider text-white/30 mb-2">Recent</div>
          <div className="space-y-1.5">
            {[
              "Best AI writing tools",
              "Top ChatGPT alternatives",
              "SEO for AI search",
              "Prompt engineering guides",
            ].map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-[9px] text-white/55">
                <span className="w-1 h-1 rounded-full bg-[#28c840]/70" />
                <span className="truncate">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="bg-[#1a1a1c] p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg grid place-items-center text-white text-sm font-bold" style={{ background: "#e8553f" }}>
              R
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">RankFlow Brand</div>
              <div className="text-[10px] text-white/45">Tracking 4 AI models · 2,148 prompts</div>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-white text-gray-900 text-[10px] font-medium px-3 py-1.5">
              <Sparkles className="w-3 h-3" /> Generate
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 divide-x divide-white/5 rounded-xl bg-white/[0.03] ring-1 ring-white/5 mb-4">
            {[
              { label: "VISIBILITY", value: "84.2", sub: "Score index" },
              { label: "MENTIONS", value: "1,842", sub: "This month" },
              { label: "AVG RANK", value: "2.1", sub: "Across models" },
              { label: "MAX REACH", value: "3.15M", sub: "Searches / mo" },
            ].map((s) => (
              <div key={s.label} className="px-4 py-3">
                <div className="text-[8px] tracking-wider text-white/35">{s.label}</div>
                <div className="text-xl font-medium text-white mt-1">{s.value}</div>
                <div className="text-[9px] text-white/45 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Subjects */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { name: "Productivity", prompts: 42, color: "#e8553f" },
              { name: "Design Tools", prompts: 28, color: "#febc2e" },
              { name: "AI & Automation", prompts: 61, color: "#28c840" },
            ].map((c) => (
              <div key={c.name} className="rounded-lg bg-white/[0.03] ring-1 ring-white/5 p-3">
                <div className="w-6 h-6 rounded" style={{ background: c.color }} />
                <div className="text-[11px] text-white mt-2">{c.name}</div>
                <div className="text-[9px] text-white/45">{c.prompts} prompts</div>
              </div>
            ))}
          </div>

          {/* Inbox */}
          <div className="rounded-lg bg-white/[0.03] ring-1 ring-white/5 overflow-hidden">
            <div className="grid grid-cols-[1fr_60px_80px_70px] gap-3 px-3 py-2 text-[8px] uppercase tracking-wider text-white/35 border-b border-white/5">
              <span>Prompt</span><span>Rank</span><span>Model</span><span>Status</span>
            </div>
            {[
              { q: "Best project management tools for startups", r: "#2", m: "ChatGPT", s: "Live" },
              { q: "Top AI writing assistants 2026", r: "#1", m: "Claude", s: "Live" },
              { q: "Notion alternatives for teams", r: "#4", m: "Perplexity", s: "Drafting" },
              { q: "Best CRM for small business", r: "#3", m: "Gemini", s: "Live" },
              { q: "AI SEO tools compared", r: "#1", m: "ChatGPT", s: "Drafting" },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_60px_80px_70px] gap-3 px-3 py-2 text-[10px] text-white/70 border-b border-white/5 last:border-0">
                <span className="truncate">{row.q}</span>
                <span className="text-white">{row.r}</span>
                <span className="text-white/60">{row.m}</span>
                <span className={row.s === "Drafting" ? "text-[#febc2e]/80" : "text-[#28c840]/80"}>{row.s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
