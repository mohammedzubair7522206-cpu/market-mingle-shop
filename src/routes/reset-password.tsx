import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Bazaaro" },
      { name: "description", content: "Choose a new password for your Bazaaro account." },
      { property: "og:title", content: "Reset password — Bazaaro" },
      { property: "og:description", content: "Choose a new password for your account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    nav({ to: "/account" });
  };
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <form onSubmit={save} className="space-y-3 rounded-xl bg-background p-6 shadow-card">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <input required type="password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" className="w-full rounded-md border px-3 py-2 text-sm" />
        <button disabled={busy} className="btn-primary w-full py-2.5">Update password</button>
      </form>
    </div>
  );
}
