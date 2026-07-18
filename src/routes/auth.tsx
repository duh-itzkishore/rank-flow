import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/landing/Logo";

type AuthSearch = {
  website?: string;
};

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    return {
      website: search.website as string | undefined,
    };
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { website } = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    if (website) {
      navigate({ to: "/app/search", search: { q: website } });
    } else {
      navigate({ to: "/app/dashboard" });
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password: String(form.get("password")),
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: String(form.get("name") ?? "") },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — check your email if confirmation is required.");
    if (website) {
      navigate({ to: "/app/search", search: { q: website } });
    } else {
      navigate({ to: "/app/dashboard" });
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-[#07070a] relative overflow-hidden font-sans">
      {/* ── Top-left Escape Button ──────────────────── */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-50 flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-white/75 hover:bg-white/10 hover:text-white transition-all cursor-pointer shadow-md backdrop-blur-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </Link>

      {/* ── Left Side Column ────────────────────────── */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 border-r border-white/5 bg-gradient-to-b from-[#0e0e12] to-[#07070a]">
        {/* Branding */}
        <div className="flex items-center gap-2.5">
          <Logo className="w-6 h-6 text-indigo-500 shrink-0" />
          <span className="text-sm font-semibold tracking-tight text-white">RankFlow</span>
        </div>

        {/* Testimonial Quote */}
        <div className="z-10 max-w-md">
          <h2 className="text-2xl font-medium tracking-tight text-white leading-relaxed">
            "The clearest view of AI visibility we've ever had. Setup took 10 minutes."
          </h2>
          <p className="mt-4 text-xs text-white/40 font-semibold tracking-wide uppercase">
            — Sarah Chen, Head of Growth at Linear
          </p>
        </div>

        {/* Ambient Glow Graphic */}
        <div className="absolute top-1/2 -right-24 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/4 -right-12 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      {/* ── Right Side Column (Auth Forms) ──────────── */}
      <div className="flex items-center justify-center px-6 py-20 relative z-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo header */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden justify-center">
            <Logo className="w-6 h-6 text-indigo-500 shrink-0" />
            <span className="text-sm font-semibold tracking-tight text-white">RankFlow</span>
          </div>

          <div className="text-center lg:text-left mb-6">
            <h1 className="text-2xl font-semibold text-white tracking-tight">Welcome</h1>
            <p className="mt-1.5 text-xs text-white/40">Sign in or create your account to continue.</p>
          </div>

          {/* Form Tabs */}
          <div className="flex rounded-lg bg-white/[0.03] ring-1 ring-white/10 p-1 mb-6">
            <button
              onClick={() => {
                setActiveTab("signin");
                setShowPassword(false);
              }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "signin"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab("signup");
                setShowPassword(false);
              }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "signup"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Sign In form panel */}
          {activeTab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Email Address</label>
                <input
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-white/[0.04] border border-white/5 pl-3.5 pr-10 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Sign In
              </button>
            </form>
          )}

          {/* Sign Up form panel */}
          {activeTab === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Name</label>
                <input
                  name="name"
                  placeholder="Your Name"
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Email Address</label>
                <input
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-white/[0.04] border border-white/5 pl-3.5 pr-10 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create Account
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-[10px] text-white/25 leading-relaxed">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
