import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Plus, MessageSquare, Save, X, Search, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$projectId/tools/annotations")({
  component: AnnotationsTool,
});

const MODEL_COLORS: Record<string, string> = {
  chatgpt: "#10a37f", gemini: "#4285f4", claude: "#c85a2a", perplexity: "#7c3aed",
};

function AnnotationsTool() {
  const { projectId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<any[]>([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent prompt runs
      const { data: dbRuns, error: runsErr } = await supabase
        .from("prompt_runs")
        .select(`
          id, model, created_at, response_text, is_mentioned,
          prompts!inner(project_id, text)
        `)
        .eq("prompts.project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (runsErr) throw runsErr;
      
      // Fetch annotations from ai_insights
      const { data: dbNotes, error: notesErr } = await (supabase as any)
        .from("ai_insights")
        .select("*")
        .eq("project_id", projectId)
        .eq("insight_type", "annotation")
        .order("created_at", { ascending: false });

      if (notesErr) throw notesErr;

      setRuns(dbRuns || []);
      setAnnotations(dbNotes || []);

    } catch (err: any) {
      toast.error("Failed to load annotations data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (run: any) => {
    if (!noteText.trim()) return;
    try {
      setSaving(true);
      
      // Embed run id in title to link it
      const title = `[Run:${run.id}] Note on ${run.model}`;
      
      const { data, error } = await (supabase as any)
        .from("ai_insights")
        .insert({
          project_id: projectId,
          insight_type: "annotation",
          title,
          body: noteText,
          priority: "normal",
          is_actioned: false
        })
        .select()
        .single();

      if (error) throw error;
      
      setAnnotations([data, ...annotations]);
      toast.success("Annotation saved successfully!");
      setActiveRunId(null);
      setNoteText("");
    } catch (err: any) {
      toast.error("Failed to save annotation: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const markActioned = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("ai_insights")
        .update({ is_actioned: true })
        .eq("id", id);
      if (error) throw error;
      
      setAnnotations(annotations.map(a => a.id === id ? { ...a, is_actioned: true } : a));
      toast.success("Annotation marked as resolved.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/50 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading annotations...
      </div>
    );
  }

  const filteredRuns = runs.filter(r => 
    r.prompts?.text.toLowerCase().includes(search.toLowerCase()) || 
    r.response_text?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            Annotations Tool
          </h1>
          <p className="mt-1 text-sm text-white/40">Add notes and labels to specific AI responses to track issues and opportunities.</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left Col: Recent AI Responses */}
        <div className="w-full xl:w-2/3 flex flex-col gap-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-white/70">Recent AI Responses</h3>
              <div className="relative w-64">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Search prompts or responses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredRuns.length > 0 ? (
                filteredRuns.map(run => {
                  const hasAnnotation = annotations.some(a => a.title.includes(`[Run:${run.id}]`));
                  
                  return (
                    <div key={run.id} className="rounded-xl border border-white/5 bg-white/[0.01] p-4 hover:bg-white/[0.03] transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span 
                              className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: `${MODEL_COLORS[run.model] || '#888'}20`, color: MODEL_COLORS[run.model] || '#888' }}
                            >
                              {run.model}
                            </span>
                            <span className="text-xs text-white/30">{new Date(run.created_at).toLocaleString()}</span>
                            {hasAnnotation && (
                              <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                                <MessageSquare className="w-3 h-3" /> Annotated
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-white/90 font-medium mb-1">Q: {run.prompts?.text}</p>
                          <p className="text-xs text-white/50 line-clamp-2">A: {run.response_text}</p>
                        </div>
                        <button
                          onClick={() => {
                            setActiveRunId(activeRunId === run.id ? null : run.id);
                            setNoteText("");
                          }}
                          className="shrink-0 rounded-lg bg-white/5 p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                          title="Add Annotation"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Inline Note Editor */}
                      {activeRunId === run.id && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add your note or label for this response (e.g., 'Hallucinated pricing info', 'Missed key feature')..."
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 resize-none h-24"
                          />
                          <div className="flex justify-end gap-2 mt-3">
                            <button
                              onClick={() => setActiveRunId(null)}
                              className="px-3 py-1.5 text-xs text-white/50 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNote(run)}
                              disabled={saving || !noteText.trim()}
                              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              Save Annotation
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-white/40 text-sm">
                  No responses match your search.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Annotations List */}
        <div className="w-full xl:w-1/3">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sticky top-6">
            <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Team Annotations
            </h3>
            
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
              {annotations.length > 0 ? (
                annotations.map(note => {
                  // Extract run ID and nice title if formatted as "[Run:id] Note on Model"
                  const titleMatch = note.title.match(/\\[Run:.*?\\] (.*)/);
                  const displayTitle = titleMatch ? titleMatch[1] : note.title;
                  
                  return (
                    <div 
                      key={note.id} 
                      className={`rounded-xl border p-4 transition-colors ${
                        note.is_actioned 
                          ? "bg-white/[0.01] border-white/5 opacity-50" 
                          : "bg-indigo-500/5 border-indigo-500/20"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-indigo-300">{displayTitle}</span>
                        <span className="text-[10px] text-white/30">{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-white/80 mb-3">{note.body}</p>
                      
                      {!note.is_actioned && (
                        <button
                          onClick={() => markActioned(note.id)}
                          className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                  <FileText className="w-6 h-6 text-white/20 mx-auto mb-2" />
                  <p className="text-xs text-white/40">No annotations yet.</p>
                  <p className="text-[10px] text-white/30 mt-1">Click the + on any response to add one.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
