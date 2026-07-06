import { Award, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";
import { Section, SectionKicker, DisplayHeading } from "./section-shell";

const cases = [
  {
    title: "How Bacula Won the AI Search Battle",
    metric: "8x More Citations",
    desc: "Bacula Systems restructured their enterprise indexing structure, climbing to the top recommendation position across reasoning engines.",
    timeframe: "12 Months"
  },
  {
    title: "Videoloft Scales AI Visibility",
    metric: "2.4x Share of Voice",
    desc: "Videoloft implemented real-time prompt monitoring, securing mentions on primary security systems comparison threads.",
    timeframe: "6 Months"
  },
  {
    title: "How Instant Built GEO from Zero",
    metric: "+150% Referral Traffic",
    desc: "Instant Commerce targeted high-intent eCommerce prompts, optimizing their blogs and markdown structures for crawler preference.",
    timeframe: "90 Days"
  }
];

export function CaseStudies() {
  return (
    <Section id="case-studies" tone="dark" stagger className="bg-[#07070a] border-y border-white/5 py-28">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        
        {/* Gartner Recognition Band */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8 mb-20 hover:border-indigo-500/20 transition-colors">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 grid place-items-center text-indigo-400 shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-block text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Gartner® Cool Vendor</span>
              <h4 className="text-base font-semibold text-white tracking-tight mt-0.5">RankFlow Recognized in 2025 Cool Vendors™ for AI in Marketing</h4>
            </div>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Read Press Release <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start mb-16">
          <div className="lg:col-span-1">
            <SectionKicker label="Proof" />
            <DisplayHeading className="text-white text-left">
              Real results in<br />AI search engines.
            </DisplayHeading>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-sm">
              Discover how leading companies are leveraging Generative Engine Optimization to outrank competitors in conversational search.
            </p>
          </div>

          <div className="lg:col-span-2 grid gap-6 sm:grid-cols-2">
            {cases.map((c, i) => (
              <div
                key={i}
                className="group relative rounded-3xl border border-white/5 bg-white/[0.01] p-6 hover:border-indigo-500/30 hover:bg-white/[0.03] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[10px] font-bold tracking-widest text-indigo-400 font-mono">CASE // 0{i + 1}</span>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> {c.timeframe}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white tracking-tight mb-2 group-hover:text-indigo-300 transition-colors">{c.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{c.desc}</p>
                </div>
                <div className="mt-6 border-t border-white/5 pt-4 flex items-baseline justify-between">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Metric</span>
                  <span className="text-sm font-bold text-white">{c.metric}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Section>
  );
}
