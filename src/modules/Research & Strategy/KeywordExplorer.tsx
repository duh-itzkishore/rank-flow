import { useState } from "react";
import { exploreKeywords, saveKeywordsAsPrompts } from "@/server-fns/keyword-explorer";
import { Search, Loader2, Plus, Check } from "lucide-react";
import { toast } from "sonner";

interface KeywordExplorerProps {
  projectId: string;
  onKeywordsSaved?: () => void;
}

export function KeywordExplorer({ projectId, onKeywordsSaved }: KeywordExplorerProps) {
  const [seedsText, setSeedsText] = useState("");
  const [depth, setDepth] = useState<"quick" | "normal" | "deep">("normal");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [selectedKws, setSelectedKws] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const seeds = seedsText.split(",").map(s => s.trim()).filter(Boolean);
    if (seeds.length === 0) {
      toast.error("Please enter at least one seed keyword");
      return;
    }
    if (!projectId) {
      toast.error("Please select a project first");
      return;
    }

    setLoading(true);
    setKeywords([]);
    setSelectedKws(new Set());
    try {
      const res = await exploreKeywords({ seeds, projectId, depth });
      if (res.success) {
        setKeywords(res.keywords);
        toast.success(`Found ${res.keywords.length} keyword variations!`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to explore keywords");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (kw: string) => {
    const next = new Set(selectedKws);
    if (next.has(kw)) next.delete(kw);
    else next.add(kw);
    setSelectedKws(next);
  };

  const handleSelectAll = () => {
    if (selectedKws.size === keywords.length) {
      setSelectedKws(new Set());
    } else {
      setSelectedKws(new Set(keywords.map(k => k.keyword)));
    }
  };

  const handleSaveSelected = async () => {
    if (selectedKws.size === 0) {
      toast.error("No keywords selected");
      return;
    }

    setSaving(true);
    try {
      const res = await saveKeywordsAsPrompts({
        keywords: Array.from(selectedKws),
        projectId
      });
      if (res.success) {
        toast.success(`Successfully saved ${selectedKws.size} keywords to project prompts!`);
        setSelectedKws(new Set());
        if (onKeywordsSaved) onKeywordsSaved();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save keywords");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6">
        <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-400" />
          AEO Keyword Explorer
        </h2>
        <p className="text-xs text-white/40 mb-6">
          Find what users are asking search and answer engines. Enter comma-separated keywords to pull live Google Autocomplete strings.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="e.g. physical AI, decentralized robotics"
              value={seedsText}
              onChange={(e) => setSeedsText(e.target.value)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors"
              required
            />
          </div>
          <div className="w-full sm:w-32">
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value as any)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
            >
              <option value="quick" className="bg-[#1e1e21]">Quick</option>
              <option value="normal" className="bg-[#1e1e21]">Normal</option>
              <option value="deep" className="bg-[#1e1e21]">Deep Scan</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mining...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Mine Keywords
              </>
            )}
          </button>
        </form>
      </div>

      {keywords.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Mined Variations</span>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/70">
                {keywords.length} items
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="text-xs text-white/55 hover:text-white transition-colors"
              >
                {selectedKws.size === keywords.length ? "Deselect All" : "Select All"}
              </button>
              <button
                onClick={handleSaveSelected}
                disabled={saving || selectedKws.size === 0}
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Save Selected ({selectedKws.size})
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto pr-1 space-y-2">
            {keywords.map((k) => {
              const selected = selectedKws.has(k.keyword);
              return (
                <div
                  key={k.keyword}
                  onClick={() => handleToggleSelect(k.keyword)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all cursor-pointer ${
                    selected
                      ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"
                      : "bg-[#18181a] border-white/5 text-white/70 hover:bg-[#202023]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium block truncate">{k.keyword}</span>
                    <span className="text-[9px] text-white/30 uppercase mt-0.5 block">Seed: {k.seed}</span>
                  </div>
                  <div className="shrink-0 ml-4">
                    {selected ? (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-white/10 block" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
