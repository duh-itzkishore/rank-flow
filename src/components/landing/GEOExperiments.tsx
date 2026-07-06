import { BookOpen, ArrowRight, Settings2, ShieldCheck, Database, Search } from "lucide-react";
import { Section, SectionKicker, DisplayHeading } from "./section-shell";

const experiments = [
  {
    title: "GEO Experiment: Markdown vs. HTML",
    desc: "Which format do AI crawlers prefer? We tested 500 pages side-by-side to track citation rates.",
    tag: "Experiment"
  },
  {
    title: "Does Schema Markup Impact AI Search?",
    desc: "A longitudinal study on how structured JSON-LD schemas affect LLM citation models.",
    tag: "Experiment"
  },
  {
    title: "Tracking Brand Sentiment in AI Search",
    desc: "How conversational models evaluate adjectives and recommendations for brand terms.",
    tag: "Guides"
  },
  {
    title: "How Top Brands Are Winning on AI Search",
    desc: "Key takeaways from the leading websites optimization techniques for AI-grounded search.",
    tag: "Top Voices"
  }
];

const freeTools = [
  { name: "AI Keyword Research", icon: Search },
  { name: "AI Referral Traffic", icon: Database },
  { name: "Query Fan Out", icon: Settings2 },
  { name: "GEO Content Check", icon: ShieldCheck },
  { name: "AI Crawler Simulation", icon: BookOpen }
];

export function GEOExperiments() {
  return (
    <Section id="geo-experiments" tone="light" stagger className="bg-white py-28 border-y border-gray-100">
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <SectionKicker label="Research" />
          <DisplayHeading>
            We run dozens of GEO Experiments.<br />Check out our learnings.
          </DisplayHeading>
          <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
            Data-backed findings on how generative search algorithms parse content and choose their primary citations.
          </p>
        </div>

        {/* Experiment Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-20">
          {experiments.map((e, idx) => (
            <article
              key={idx}
              className="group relative rounded-3xl border border-gray-200 bg-[#fafafa] p-6 hover:border-indigo-500/25 hover:shadow-soft transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-[9px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                  {e.tag}
                </span>
                <h3 className="mt-4 text-base font-semibold text-gray-900 leading-snug tracking-tight group-hover:text-indigo-600 transition-colors">
                  {e.title}
                </h3>
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                  {e.desc}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer">
                <span>Read article</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </article>
          ))}
        </div>

        {/* Free Tools Callout */}
        <div className="rounded-3xl border border-gray-200 bg-[#f8f8fa] p-8">
          <div className="mb-6">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Free Resources</span>
            <h4 className="text-lg font-semibold text-gray-900 mt-1">Explore our Free GEO Tools</h4>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {freeTools.map((t, idx) => (
              <div
                key={idx}
                className="group flex flex-col items-center justify-center p-5 bg-white border border-gray-200/80 rounded-2xl hover:border-indigo-500/25 hover:shadow-soft transition-all duration-300 text-center"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-50 text-indigo-600 mb-3 group-hover:scale-105 transition-transform">
                  <t.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-gray-900">{t.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Section>
  );
}
