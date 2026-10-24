import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/account");

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s["redirect"] === "string" ? { redirect: s["redirect"] } : {},
  head: () => ({
    meta: [
      { title: "Sign in or create an account — Bazaaro" },
      { name: "description", content: "Sign in to Bazaaro to save your cart, addresses and track your orders." },
      { property: "og:title", content: "Sign in — Bazaaro" },
      { property: "og:description", content: "Sign in to save your cart and track orders." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const nav = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => { if (user) nav({ to: safePath(redirect), replace: true }); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: form.name } },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("If that email has an account, a reset link is on its way.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setBusy(false); }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed. Please try again.");
  };

  const input = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-xl bg-background p-6 shadow-card">
        <h1 className="text-2xl font-bold">{mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Sign in"}</h1>
        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === "signup" && <input required placeholder="Full name" className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
          <input required type="email" placeholder="Email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {mode !== "forgot" && <input required type="password" minLength={8} placeholder="Password (min 8 characters)" className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />}
          <button disabled={busy} className="btn-primary w-full py-2.5">{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</button>
        </form>
        {mode !== "forgot" && (
          <>
            <div className="my-4 text-center text-xs text-muted-foreground">or</div>
            <button onClick={google} className="w-full rounded-md border py-2.5 text-sm font-semibold hover:bg-secondary">Continue with Google</button>
          </>
        )}
        <div className="mt-5 flex justify-between text-sm">
          {mode === "signin" ? (
            <>
              <button className="font-semibold text-accent-foreground" onClick={() => setMode("signup")}>New here? Create account</button>
              <button className="text-muted-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>
            </>
          ) : (
            <button className="font-semibold text-accent-foreground" onClick={() => setMode("signin")}>Back to sign in</button>
          )}
        </div>
      </div>
      <p className="mt-4 text-center text-sm"><Link to="/" className="text-muted-foreground">← Continue shopping</Link></p>
    </div>
  );
}
