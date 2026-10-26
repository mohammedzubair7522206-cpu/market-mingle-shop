import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: () => <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Orders is not built yet.</p>,
});
