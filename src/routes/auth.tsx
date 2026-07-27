import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type Mode = "login" | "register" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: Mode } => {
    const mode = search.mode;
    return mode === "register" || mode === "forgot" || mode === "login" ? { mode } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — TrustLens AI" },
      {
        name: "description",
        content: "Sign in or create a TrustLens AI account to run live authenticity analysis on video calls.",
      },
      { property: "og:title", content: "Sign in — TrustLens AI" },
      { property: "og:description", content: "Access your TrustLens AI console." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<Mode>(initialMode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      } else if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created", { description: "Check your inbox to confirm your email." });
        setMode("login");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset link sent", { description: "Check your inbox for the reset link." });
        setMode("login");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  const copy = {
    login: { title: "Welcome back", lead: "Sign in to your TrustLens console.", cta: "Sign in" },
    register: { title: "Create your account", lead: "Start analyzing calls in under a minute.", cta: "Create account" },
    forgot: { title: "Reset password", lead: "We'll email you a secure reset link.", cta: "Send reset link" },
  }[mode];

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="pointer-events-none absolute inset-0 aurora opacity-60" />

      <div className="relative flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Logo />
          <Link
            to="/"
            className="mt-10 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>

          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6"
          >
            <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{copy.lead}</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ada Lovelace"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    className="pl-9"
                  />
                </div>
              </div>

              {mode !== "forgot" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {copy.cta}
              </Button>
            </form>

            {mode !== "forgot" && (
              <>
                <div className="my-6 flex items-center gap-4">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground">or</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Button variant="glass" className="w-full" onClick={google} disabled={busy}>
                  <GoogleMark />
                  Continue with Google
                </Button>
              </>
            )}

            <p className="mt-8 text-center text-sm text-muted-foreground">
              {mode === "register" ? "Already have an account?" : "New to TrustLens?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "register" ? "login" : "register")}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {mode === "register" ? "Sign in" : "Create one"}
              </button>
            </p>
          </motion.div>
        </div>
      </div>

      <div className="relative hidden border-l border-border lg:block">
        <div className="absolute inset-0 grid-backdrop" />
        <div className="relative flex h-full flex-col justify-center px-16">
          <ShieldCheck className="h-10 w-10 text-primary" />
          <blockquote className="mt-8 text-2xl font-semibold leading-snug tracking-tight">
            "The face on the screen used to be the proof. TrustLens gives us a second opinion before
            the money moves."
          </blockquote>
          <p className="mt-6 text-sm text-muted-foreground">
            Fraud operations lead · financial services
          </p>
          <div className="mt-14 grid grid-cols-3 gap-8 border-t border-border pt-8">
            {[
              { k: "6", v: "signals" },
              { k: "0", v: "frames stored" },
              { k: "<120ms", v: "scoring" },
            ].map((s) => (
              <div key={s.v}>
                <p className="text-xl font-bold">{s.k}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}
