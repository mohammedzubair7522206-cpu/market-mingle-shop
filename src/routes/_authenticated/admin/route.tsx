import { createFileRoute, Link, Outlet, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// UI gate only. Every admin read/write is enforced by database policies (has_role admin).
export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    return { isAdmin: !!data };
  },
  head: () => ({
    meta: [
      { title: "Admin — Bazaaro" },
      { name: "description", content: "Bazaaro store administration." },
      { property: "og:title", content: "Admin — Bazaaro" },
      { property: "og:description", content: "Bazaaro store administration." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const tabs = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories & brands" },
  { to: "/admin/orders", label: "Orders" },
] as const;

function AdminLayout() {
  const { isAdmin } = Route.useRouteContext();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!isAdmin) {
    const claim = async () => {
      setBusy(true);
      const { data, error } = await supabase.rpc("claim_admin");
      setBusy(false);
      if (error || !data) { toast.error("Your account is not approved for admin access."); return; }
      toast.success("You are now an administrator");
      router.invalidate();
    };
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don't have access to the store dashboard. If the store owner approved your verified email, claim access below.</p>
        <button onClick={claim} disabled={busy} className="mt-6 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Claim admin access</button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <h1 className="mr-4 font-display text-2xl font-bold">Store admin</h1>
        {tabs.map((t) => (
          <Link key={t.to} to={t.to} activeOptions={{ exact: "exact" in t }}
            className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold"
            activeProps={{ className: "!bg-nav !text-nav-foreground" }}>{t.label}</Link>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
