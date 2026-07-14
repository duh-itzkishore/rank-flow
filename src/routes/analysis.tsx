import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AnalysisOverviewCard } from "@/components/landing/AnalysisOverviewCard";

type AnalysisSearch = {
  url?: string;
};

export const Route = createFileRoute("/analysis")({
  validateSearch: (search: Record<string, unknown>): AnalysisSearch => {
    return {
      url: search.url as string | undefined,
    };
  },
  component: AnalysisPage,
});

function AnalysisPage() {
  const { url } = Route.useSearch();

  return (
    <div className="min-h-screen bg-[#07070a] font-sans flex flex-col">
      <Navbar />
      
      <main className="flex-1 relative pt-32 pb-24 px-4 sm:px-6">
        {/* Background glow effects */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20 z-0 pointer-events-none" />
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-indigo-900/20 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[50%] rounded-full bg-violet-900/15 blur-[150px] pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          {url ? (
            <div className="animate-fade-up">
              <AnalysisOverviewCard url={url} />
            </div>
          ) : (
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold text-white mb-4">No URL provided</h2>
              <p className="text-gray-400 mb-8">Please return to the home page and enter a URL to analyze.</p>
              <a 
                href="/"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg transition-colors"
              >
                Go Back Home
              </a>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
