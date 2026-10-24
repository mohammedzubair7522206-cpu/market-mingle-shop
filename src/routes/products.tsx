import { createFileRoute } from "@tanstack/react-router";
import { useCatalog } from "@/lib/catalog";
import { Listing } from "@/components/Listing";

export const Route = createFileRoute("/products")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => {
    const q = s["q"];
    return typeof q === "string" && q ? { q } : {};
  },
  head: () => ({
    meta: [
      { title: "All Products — Bazaaro" },
      { name: "description", content: "Browse and filter every product on Bazaaro by brand, price, rating and discount." },
      { property: "og:title", content: "All Products — Bazaaro" },
      { property: "og:description", content: "Browse and filter every product on Bazaaro." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { q } = Route.useSearch();
  const { categories, products } = useCatalog();
  const term = q?.toLowerCase().trim();
  const list = term
    ? products.filter((p) => [p.name, p.brand, p.description, categories.find((c) => c.slug === p.category)?.name].join(" ").toLowerCase().includes(term))
    : products;
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">{q ? `Results for “${q}”` : "All Products"}</h1>
      <Listing key={q ?? ""} list={list} />
      {term && list.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Try a different keyword like “shoes” or “kitchen”.</p>}
    </div>
  );
}
