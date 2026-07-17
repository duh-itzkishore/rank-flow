import { useState } from "react";
import { extractBrandDna } from "@/server-fns/brand-dna-extractor";
import { Sparkles, Globe, Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface BrandResearchProps {
  projectId: string;
  websiteUrl?: string;
  onGenerationComplete?: () => void;
}

export function BrandResearch({ projectId, websiteUrl = "", onGenerationComplete }: BrandResearchProps) {
  const [url, setUrl] = useState(websiteUrl);
  const [loading, setLoading] = useState(false);
  const [dna, setDna] = useState<any>(null);

  const handleGenerateDna = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error("Please enter a website URL");
      return;
    }
    if (!projectId) {
      toast.error("Please select a project first");
      return;
    }

    setLoading(true);
    setDna(null);
    try {
      const res = await extractBrandDna({ url, projectId });
      if (res.success) {
        setDna(res.insight);
        toast.success("Brand DNA extracted and saved to project insights!");
        if (onGenerationComplete) onGenerationComplete();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to extract Brand DNA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
        <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Brand DNA Extractor
        </h2>
        <p className="text-xs text-white/40 mb-6">
          Analyze a brand's website content, title structures, primary messaging tags, and schema layouts to generate a standardized machine-readable Brand DNA profile.
        </p>

        <form onSubmit={handleGenerateDna} className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                Extract Brand DNA
              </>
            )}
          </button>
        </form>
      </div>

      {dna && (
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">{dna.title}</h3>
            <span className="text-[10px] text-white/40 font-mono ml-auto">
              ID: {dna.id.substring(0, 8)}...
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-black/35 rounded-xl border border-white/5 p-4 text-[12px] text-white/70 leading-relaxed font-mono whitespace-pre-wrap">
              {dna.body}
            </div>
            
            <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/10 p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-white">Saved to Insights</div>
                <div className="text-[10px] text-white/45">This Brand DNA profile is now available in your AI Insights dashboard.</div>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
