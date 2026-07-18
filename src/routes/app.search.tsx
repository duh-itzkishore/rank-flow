import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, ArrowRight } from "lucide-react";
import { AnalysisOverviewCard } from "@/components/landing/AnalysisOverviewCard";

type SearchParams = {
  q?: string;
};

export const Route = createFileRoute("/app/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      q: search.q as string | undefined,
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [url, setUrl] = useState(q || "");

  // Keep local input in sync if URL changes
  useEffect(() => {
    if (q) setUrl(q);
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    navigate({ to: "/app/search", search: { q: url } });
  };

  return (
    <div className="flex flex-col h-full bg-[#050508] p-6 gap-6 overflow-y-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-white">Global Search</h1>
        <p className="text-white/40 max-w-xl">
          Analyze any URL to see how it performs across AI agents, LLM datasets, and AEO metrics.
        </p>
      </div>

      <form onSubmit={handleSearch} className="w-full max-w-2xl">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/10 pl-4 pr-1.5 py-1.5 focus-within:border-indigo-500/50 transition-colors">
          <Search className="w-5 h-5 text-white/30" />
          <input
            type="url"
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-white/40 outline-none py-2"
            placeholder="Enter website URL (e.g., https://mybrand.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button
            type="submit"
            className="px-4 h-10 rounded-lg bg-indigo-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-indigo-500 transition-colors"
          >
            Analyze <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {q ? (
        <div className="flex-1 mt-4">
          <AnalysisOverviewCard url={q} inline={true} isLoggedIn={true} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Search className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Ready to scan</h2>
            <p className="text-white/40 mt-2 max-w-md mx-auto">
              Enter a website URL above to generate an AI Visibility and AEO health report.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
