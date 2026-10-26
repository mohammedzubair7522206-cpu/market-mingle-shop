import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: () => <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Categories & brands is not built yet.</p>,
});
