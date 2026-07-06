import { ArrowRight, HelpCircle, CheckCircle2 } from "lucide-react";
import { Section, SectionKicker, DisplayHeading } from "./section-shell";

export function Transformation() {
  return (
    <Section id="transformation" tone="dark" className="bg-[#07070a] border-b border-white/5 py-28">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <SectionKicker label="Transformation" />
          <DisplayHeading className="text-white">
            Do you know if AI<br />is recommending you?
          </DisplayHeading>
          <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
            AI engines synthesize answers from trusted resources. Here is how marketing teams move from blind guesswork to automated optimization.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Card Left: From this */}
          <div className="group relative rounded-3xl border border-white/5 bg-white/[0.01] p-8 flex flex-col justify-between hover:border-red-500/20 transition-all duration-300">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="h-7 w-7 rounded-lg bg-red-500/10 grid place-items-center text-red-400">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-red-400 uppercase">From This // Unoptimized</span>
              </div>
              <blockquote className="text-lg text-gray-300 font-normal leading-relaxed italic">
                “We have no idea how to improve our brand visibility on ChatGPT. Let alone know how to even crawl or optimize it.”
              </blockquote>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
              <span>Rebecca Anderson</span>
              <span>Before using RankFlow</span>
            </div>
          </div>

          {/* Card Right: To this */}
          <div className="group relative rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-8 flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-300 shadow-[0_16px_36px_-12px_rgba(99,102,241,0.15)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 grid place-items-center text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">To This // Optimized</span>
              </div>
              <blockquote className="text-lg text-white font-medium leading-relaxed">
                “Since using RankFlow, I’ve seen a 2x increase in both our visibility in AI search engines and incoming traffic.”
              </blockquote>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-indigo-400">
              <span className="font-semibold text-white">Rebecca Anderson</span>
              <span className="font-semibold text-indigo-300">Content Manager @ Instant Commerce</span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
