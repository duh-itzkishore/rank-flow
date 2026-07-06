import { Eye, MessageSquare, Users, LineChart, GitCompare, Bell, Sparkles } from "lucide-react";
import { Section, SectionKicker, DisplayHeading } from "./section-shell";

export function Features() {
  return (
    <Section id="features" tone="light" stagger className="bg-white py-28">
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center mb-20">
          <SectionKicker label="Toolkit" />
          <DisplayHeading>
            Everything you need<br />to win in AI search.
          </DisplayHeading>
          <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
            Enterprise-grade monitoring tools to track, analyze, and optimize your brand across the answer-engine web.
          </p>
        </div>

        {/* Bento grid with staggered card positions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: AI Visibility (col-span-2) */}
          <div className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-gray-200/85 bg-[#fafafa] p-8 hover:border-indigo-500/35 hover:shadow-soft transition-all duration-300 flex flex-col justify-between min-h-[320px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-100/20 to-transparent rounded-bl-full pointer-events-none" />
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform duration-300">
                <Eye className="h-5 w-5" />
              </div>
              <span className="font-mono text-[9px] tracking-widest text-gray-400 font-bold uppercase">01 // TRACKING</span>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-1.5">
                AI Visibility Tracking
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 max-w-md">
                See exactly how often and in what context your brand surfaces in AI answers. Monitor share of voice across ChatGPT, Gemini, Claude, and Perplexity dynamically.
              </p>
            </div>
          </div>

          {/* Card 2: Prompt Monitoring (col-span-1) - Staggered Down */}
          <div className="group relative overflow-hidden rounded-3xl border border-gray-200/85 bg-[#fafafa] p-8 hover:border-indigo-500/35 hover:shadow-soft md:translate-y-6 transition-all duration-300 flex flex-col justify-between min-h-[320px]">
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform duration-300">
                <MessageSquare className="h-5 w-5" />
              </div>
              <span className="font-mono text-[9px] tracking-widest text-gray-400 font-bold uppercase">02 // PROMPTS</span>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Prompt Monitoring</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Track thousands of high-intent search queries. Discover if search engines recommend your product or write you off completely.
              </p>
            </div>
          </div>

          {/* Card 3: Competitor Analysis (col-span-1) */}
          <div className="group relative overflow-hidden rounded-3xl border border-gray-200/85 bg-[#fafafa] p-8 hover:border-indigo-500/35 hover:shadow-soft transition-all duration-300 flex flex-col justify-between min-h-[320px]">
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform duration-300">
                <Users className="h-5 w-5" />
              </div>
              <span className="font-mono text-[9px] tracking-widest text-gray-400 font-bold uppercase">03 // INTEL</span>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Competitor Benchmark</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Directly benchmark citations against competitors. Find the exact documentation and source directories they use to win engine recommendations.
              </p>
            </div>
          </div>

          {/* Card 4: Historical Tracking (col-span-2) - Staggered Down */}
          <div className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-gray-200/85 bg-[#fafafa] p-8 hover:border-indigo-500/35 hover:shadow-soft md:translate-y-6 transition-all duration-300 flex flex-col justify-between min-h-[320px]">
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-100/10 to-transparent pointer-events-none" />
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform duration-300">
                <LineChart className="h-5 w-5" />
              </div>
              <span className="font-mono text-[9px] tracking-widest text-gray-400 font-bold uppercase">04 // TRENDS</span>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Historical Trends</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 max-w-md">
                Monitor visibility score index trends over time. Quantify the long-term impact of content updates and documentation changes on your overall visibility.
              </p>
            </div>
          </div>

          {/* Card 5: Model Comparison (col-span-2) */}
          <div className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-gray-200/85 bg-[#fafafa] p-8 hover:border-indigo-500/35 hover:shadow-soft transition-all duration-300 flex flex-col justify-between min-h-[320px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-100/20 to-transparent rounded-bl-full pointer-events-none" />
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform duration-300">
                <GitCompare className="h-5 w-5" />
              </div>
              <span className="font-mono text-[9px] tracking-widest text-gray-400 font-bold uppercase">05 // COMPARE</span>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Cross-Model Comparison</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 max-w-md">
                Compare side-by-side responses. Track how reasoning agents (like GPT-o1/o3) summarize your product space compared to real-time search models.
              </p>
            </div>
          </div>

          {/* Card 6: Alerts & Reports (col-span-1) - Staggered Down */}
          <div className="group relative overflow-hidden rounded-3xl border border-gray-200/85 bg-[#fafafa] p-8 hover:border-indigo-500/35 hover:shadow-soft md:translate-y-6 transition-all duration-300 flex flex-col justify-between min-h-[320px]">
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform duration-300">
                <Bell className="h-5 w-5" />
              </div>
              <span className="font-mono text-[9px] tracking-widest text-gray-400 font-bold uppercase">06 // ALERTS</span>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Instant Alerts</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Get notified when new mentions appear, when citation context changes, or when competitors hijack your primary search prompts.
              </p>
            </div>
          </div>

        </div>
      </div>
    </Section>
  );
}
