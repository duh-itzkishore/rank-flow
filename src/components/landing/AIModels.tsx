import { Section, SectionKicker, DisplayHeading } from "./section-shell";

const models = [
  { name: "ChatGPT", vendor: "OpenAI", tone: "#10a37f", desc: "Tracks GPT-4o, o1, and o3-mini reasoning engines. We analyze how ChatGPT answers prompts, when it references web links, and how it selects sources from its search integration.", coverage: "GPT-4o · o1 · o3", stagger: "" },
  { name: "Gemini", vendor: "Google", tone: "#4285f4", desc: "Tracks Google's Gemini 2.0 Pro and Flash models. We monitor references appearing inside Google's AI Overviews, Gemini Chat, and search-grounded results.", coverage: "2.0 Pro · 2.0 Flash", stagger: "md:translate-y-6" },
  { name: "Claude", vendor: "Anthropic", tone: "#c85a2a", desc: "Tracks Claude 3.5 Sonnet and 3 Opus. Claude is increasingly used for research, code-generation, and document analysis; we monitor how it summarizes technical assets and recommends solutions.", coverage: "Sonnet 3.5 · Opus 3", stagger: "" },
  { name: "Perplexity", vendor: "Perplexity AI", tone: "#5b21b6", desc: "Tracks Perplexity's Sonar Pro and Sonar Reasoning engines. As a search-first AI engine, Perplexity relies heavily on web indexing; we show how your pages are fetched, cited, and recommended.", coverage: "Sonar Pro · Sonar Reason", stagger: "md:translate-y-6" },
];

export function AIModels() {
  return (
    <Section id="models" tone="dark" stagger className="bg-[#07070a] py-28 pb-36">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center mb-20">
          <SectionKicker label="Coverage" />
          <DisplayHeading className="text-white">
            Every model that matters,<br />tracked in one place.
          </DisplayHeading>
          <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-lg mx-auto leading-relaxed">
            Comprehensive tracking across the primary engines your users reference to find solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {models.map((m, i) => (
            <article
              key={m.name}
              className={`group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all duration-300 flex flex-col justify-between ${m.stagger}`}
              style={{ borderTop: `3px solid ${m.tone}` }}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-10 w-10 place-items-center rounded-xl text-white text-base font-bold shadow-sm"
                      style={{ background: m.tone }}
                    >
                      {m.name[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white tracking-tight">{m.name}</h3>
                      <span className="text-[9px] uppercase tracking-widest text-indigo-400/80 font-bold">{m.vendor}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-400 px-2.5 py-1 text-[10px] font-bold">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> LIVE
                  </span>
                </div>

                <p className="text-sm text-gray-400 leading-relaxed mb-6">
                  {m.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-widest font-mono">Versions</span>
                <span className="text-[11px] font-medium text-gray-300">{m.coverage}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
