import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Globe, Loader2, X, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/projects")({
  component: Projects,
});

function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUserAndProjects();
  }, []);

  const fetchUserAndProjects = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const activeOrgId = localStorage.getItem("active_org_id");
        let query = (supabase as any).from("projects").select("*");
        if (activeOrgId) {
          query = query.eq("org_id", activeOrgId);
        }
        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      }
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      toast.error(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("User session not found. Please log in again.");
      return;
    }
    if (!name.trim() || !brand.trim()) {
      toast.error("Project Name and Brand Name are required.");
      return;
    }

    try {
      setSubmitting(true);
      const activeOrgId = localStorage.getItem("active_org_id");
      const { data, error } = await (supabase as any)
        .from("projects")
        .insert({
          name: name.trim(),
          brand: brand.trim(),
          website: website.trim() || null,
          description: description.trim() || null,
          user_id: userId,
          org_id: activeOrgId || null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Project created successfully!");
      setIsModalOpen(false);
      // Reset form
      setName("");
      setBrand("");
      setWebsite("");
      setDescription("");
      // Refresh list
      fetchUserAndProjects();
    } catch (err: any) {
      console.error("Error creating project:", err);
      toast.error(err.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to compute a mock visibility score for actual database projects
  const getProjectScore = (proj: any) => {
    // Generate a deterministic score between 65 and 95 based on project ID string
    let sum = 0;
    for (let i = 0; i < proj.id.length; i++) {
      sum += proj.id.charCodeAt(i);
    }
    return 65 + (sum % 31); // 65 to 95
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 relative h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-white/40">Manage your tracked brands & websites</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Loading projects from database…
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center max-w-md mx-auto mt-10">
          <Globe className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-white">No projects found</h3>
          <p className="mt-1 text-xs text-white/45 leading-relaxed">
            Create your first project to start tracking your brand and website visibility across AI models.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => {
            const score = getProjectScore(p);
            return (
              <div key={p.id} className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 hover:bg-white/[0.05] transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 grid place-items-center text-sm font-bold text-indigo-400">
                      {p.name[0]}
                    </div>
                    <div>
                      <div className="text-base font-semibold text-white">{p.name}</div>
                      <div className="text-xs text-white/35 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {p.website || "No website"}
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: "Brand", v: p.brand },
                    { l: "Visibility", v: `${score}%` },
                    { l: "Models", v: "4" },
                  ].map((s) => (
                    <div key={s.l} className="text-center rounded-xl bg-white/[0.03] ring-1 ring-white/5 py-3">
                      <div className="text-sm font-semibold text-white truncate px-1">{s.v}</div>
                      <div className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── New Project Modal overlay ────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#1e1e21] border border-white/5 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-base font-semibold text-white mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Project Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. RankFlow Brand"
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Brand Name</label>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. RankFlow"
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Website URL (Optional)</label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. https://rankflow.ai"
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what brand or product is being tracked..."
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors h-20 resize-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg bg-white/5 text-white/60 ring-1 ring-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
