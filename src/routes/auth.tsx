import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back");
    navigate({ to: "/app/dashboard" });
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
    if (error) { toast.error(error.message); return; }
    toast.success("Account created — check your email if confirmation is required.");
    navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-cream">
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 bg-gradient-warm">
        <Link to="/" className="flex items-center gap-2 text-gray-900">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gray-900">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-medium">RankFlow</span>
        </Link>
        <div>
          <h2 className="max-w-md text-3xl font-normal tracking-tight text-gray-900">
            "The clearest view of AI visibility we've ever had. Setup took 10 minutes."
          </h2>
          <p className="mt-4 text-sm text-gray-700">— Sarah Chen, Head of Growth at Linear</p>
        </div>
        <div className="absolute -right-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-gray-900/10 blur-3xl" />
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden text-gray-900">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gray-900">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-medium">RankFlow</span>
          </Link>
          <h1 className="text-3xl font-normal tracking-tight text-gray-900">Welcome</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in or create your account to continue.</p>

          <Tabs defaultValue="signin" className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="mt-6 space-y-4">
                <div className="space-y-1.5"><Label>Email</Label><Input name="email" type="email" placeholder="you@company.com" required /></div>
                <div className="space-y-1.5"><Label>Password</Label><Input name="password" type="password" placeholder="••••••••" required minLength={6} /></div>
                <Button disabled={loading} className="w-full rounded-full bg-gray-900 text-white hover:bg-gray-800">
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-6 space-y-4">
                <div className="space-y-1.5"><Label>Name</Label><Input name="name" placeholder="Your name" required /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input name="email" type="email" placeholder="you@company.com" required /></div>
                <div className="space-y-1.5"><Label>Password</Label><Input name="password" type="password" placeholder="••••••••" required minLength={6} /></div>
                <Button disabled={loading} className="w-full rounded-full bg-gray-900 text-white hover:bg-gray-800">
                  {loading ? "Creating..." : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-xs text-gray-500">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
