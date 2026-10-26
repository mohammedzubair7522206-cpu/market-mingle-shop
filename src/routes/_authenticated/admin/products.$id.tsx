import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  component: () => <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Product editor is not built yet.</p>,
});
