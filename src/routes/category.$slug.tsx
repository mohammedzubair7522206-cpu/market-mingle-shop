import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { catalogQuery, useCatalog } from "@/lib/catalog";
import { Listing } from "@/components/Listing";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params, context }) => {
    const category = (await context.queryClient.ensureQueryData(catalogQuery)).categories.find((c) => c.slug === params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.category.name} — Shop Online at Bazaaro` },
          { name: "description", content: loaderData.category.description },
          { property: "og:title", content: `${loaderData.category.name} — Bazaaro` },
          { property: "og:description", content: loaderData.category.description },
        ]
      : [{ title: "Category not found — Bazaaro" }, { name: "robots", content: "noindex" }],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const { products } = useCatalog();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <p className="text-sm text-muted-foreground"><Link to="/">Home</Link> › {category.name}</p>
      <div className="my-4 rounded-xl bg-nav p-6 text-nav-foreground">
        <h1 className="text-3xl font-bold">{category.name}</h1>
        <p className="mt-1 opacity-80">{category.description}</p>
      </div>
      <Listing key={category.slug} list={products.filter((p) => p.category === category.slug)} />
    </div>
  );
}
