import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export function CTABand() {
  const { ref, isIntersecting } = useScrollReveal(0.05);

  return (
    <section
      id="cta-band"
      ref={ref as any}
      className={`relative overflow-hidden bg-[#07070a] text-white py-24 sm:py-32 transition-all duration-700 reveal-on-scroll ${
        isIntersecting ? "revealed" : ""
      }`}
    >
      {/* Decorative patterns and ambient mesh glows */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 z-0 pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/15 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-8 lg:px-10 text-center">
        <div className="flex items-center justify-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-400">
          <span className="h-px w-6 bg-indigo-500/30" />
          <span>Ready when you are</span>
          <span className="h-px w-6 bg-indigo-500/30" />
        </div>
        
        <h2 className="mt-6 text-4xl sm:text-6xl lg:text-[72px] font-bold leading-[1.08] tracking-tight text-white">
          Get cited. <span className="text-indigo-400 font-serif italic font-normal">Effortlessly.</span>
        </h2>
        
        <p className="mt-6 mx-auto max-w-lg text-sm sm:text-base text-gray-400 leading-relaxed">
          Set up your first project in under 10 minutes. Watch how your brand shows up across ChatGPT, Claude, Gemini, and Perplexity — starting tonight.
        </p>
        
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-indigo-500 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Start free trial <ArrowUpRight className="w-4.5 h-4.5" />
          </Link>
          <a
            href="#pricing"
            className="text-gray-300 text-sm font-semibold px-7 py-3.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            See pricing
          </a>
        </div>
      </div>
    </section>
  );
}
