import { SlidersHorizontal, Bot, TrendingUp } from "lucide-react";
import { Section, SectionKicker, DisplayHeading } from "./section-shell";

const steps = [
  {
    n: "01",
    icon: SlidersHorizontal,
    title: "Define Prompts & Profiles",
    desc: "Import high-intent prompts, competitor products, and brand names. Organize queries by category to represent the actual search footprints of your target audience.",
    positionClass: "md:-translate-y-4"
  },
  {
    n: "02",
    icon: Bot,
    title: "Simulate Live AI Queries",
    desc: "Our automated monitoring engines query ChatGPT, Gemini, Claude, and Perplexity at scale, retrieving live answers, citations, web source listings, and sentiment indices.",
    positionClass: "md:translate-y-4"
  },
  {
    n: "03",
    icon: TrendingUp,
    title: "Optimize & Secure Citations",
    desc: "Review gap analyses and actionable optimization tips. Restructure your landing pages, docs, and blogs to ensure your content is chosen as the primary citation source.",
    positionClass: "md:-translate-y-4"
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" tone="light" stagger className="bg-white py-28">
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center mb-20">
          <SectionKicker label="Process" />
          <DisplayHeading>
            Three steps to own<br />the AI search results.
          </DisplayHeading>
          <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
            GEO (Generative Engine Optimization) is a systematic approach. Here is how RankFlow continuously tracks and helps optimize your visibility.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 relative pt-6 pb-6">
          {/* Connector lines for desktop layout */}
          <div className="hidden md:block absolute top-[50%] left-[15%] right-[15%] border-t border-dashed border-gray-200 -z-10" />

          {steps.map((s) => (
            <div
              key={s.title}
              className={`group relative flex flex-col items-center text-center p-8 bg-[#fafafa] rounded-3xl border border-gray-200/80 hover:border-indigo-500/25 hover:shadow-soft transition-all duration-300 ${s.positionClass}`}
            >
              <span className="font-mono text-[9px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-6">
                STEP {s.n}
              </span>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gray-900 text-white group-hover:scale-105 transition-transform duration-300">
                <s.icon className="h-5.5 w-5.5" strokeWidth={1.8} />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900 tracking-tight">{s.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
