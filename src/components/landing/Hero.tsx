import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { DashboardMockup, ScaledDashboard } from "./DashboardMockup";
import { AnalysisOverviewCard } from "./AnalysisOverviewCard";

export function Hero() {
  const [url, setUrl] = useState("");
  const [analyzedUrl, setAnalyzedUrl] = useState<string | null>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setAnalyzedUrl(url);
  };


  return (
    <section
      id="hero"
      className="relative min-h-screen bg-[#07070a] bg-cover bg-center text-white overflow-hidden flex flex-col justify-between pt-28"
      style={{ backgroundImage: "url('/dark_hero_glow_bg.png')" }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" />
      {/* Decorative patterns and ambient mesh glows */}
      <div className="absolute inset-0 bg-grid-pattern opacity-25 z-0 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-indigo-900/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[50%] rounded-full bg-violet-900/15 blur-[150px] pointer-events-none" />



      <div className="relative z-10 px-5 sm:px-8 lg:px-10 text-center flex flex-col items-center max-w-5xl mx-auto pt-10 sm:pt-16">
        <div className="animate-fade-up flex flex-wrap justify-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md px-3.5 py-1.5 text-[10px] font-semibold text-gray-300 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Generative Engine Optimization
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md px-3.5 py-1.5 text-[10px] font-semibold text-gray-300 uppercase tracking-widest">
            AI Search Analytics
          </span>
        </div>

        <h1 className="text-white font-bold leading-[1.06] tracking-tight text-4xl min-[400px]:text-5xl sm:text-7xl lg:text-[84px] max-w-4xl animate-fade-up">
          Get cited. <span className="text-indigo-400 font-serif italic font-normal">Effortlessly.</span>
        </h1>

        <p className="animate-fade-up [animation-delay:150ms] mt-6 text-gray-400 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
          Monitor how your brand, products, and website appear across leading AI assistants.
          Track share of voice and citation rates on ChatGPT, Gemini, Claude, and Perplexity.
        </p>

        {/* Input Bar */}
        <form onSubmit={handleAnalyze} className="animate-fade-up [animation-delay:250ms] mt-8 w-full max-w-xl">
          <div className="flex items-center gap-3 rounded-full bg-white/[0.04] backdrop-blur-lg border border-white/10 pl-5 pr-1.5 py-1.5 shadow-xl shadow-black/30 focus-within:border-indigo-500/50 transition-colors">
            <input
              type="url"
              className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-white/40 outline-none py-2"
              placeholder="Enter your website URL (e.g., https://mybrand.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-auto px-5 h-10 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all shrink-0"
              aria-label="Analyze Website"
            >
              Analyze Website <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="animate-fade-up [animation-delay:350ms] mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/auth"
            className="bg-indigo-600 text-white text-sm font-semibold px-7 py-3 rounded-full hover:bg-indigo-500 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Try It Free
          </Link>
          <a
            href="#pricing"
            className="text-gray-300 text-sm font-semibold px-7 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Talk to sales
          </a>
        </div>

        <p className="animate-fade-up [animation-delay:400ms] mt-4 text-[11px] text-gray-500 uppercase tracking-wider">
          14-day free trial · No credit card required
        </p>
      </div>

      <div className="py-14 sm:py-20 lg:py-24 shrink-0" />

      {/* Floating 3D mockup dashboard */}
      <div className="animate-hero-rise [animation-delay:480ms] relative z-20 w-[92%] sm:w-[86%] lg:w-[78%] max-w-5xl mx-auto shrink-0 -mb-16 sm:-mb-24 lg:-mb-36 perspective-[1200px]">
        <div className="animate-float-tilt transform transition-transform duration-300 hover:rotate-0">
          <ScaledDashboard designWidth={1024}>
            <DashboardMockup />
          </ScaledDashboard>
        </div>
      </div>

      {/* Modern transition gradient overlay to light content */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />

      {analyzedUrl && (
        <AnalysisOverviewCard url={analyzedUrl} onClose={() => setAnalyzedUrl(null)} />
      )}
    </section>
  );
}
