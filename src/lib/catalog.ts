import { queryOptions } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { getCatalog, type CatalogRow } from "./catalog.functions";
import { resolveImage, type Category, type Product } from "./products";

export type Catalog = {
  categories: Category[];
  products: Product[];
  getProduct: (slug: string) => Product | undefined;
  getProductById: (id: string) => Product | undefined;
  getCategory: (slug: string) => Category | undefined;
};

function build(raw: CatalogRow): Catalog {
  const products: Product[] = raw.products.map((p) => ({
    id: p.id, slug: p.slug, name: p.name, brand: p.brand, category: p.categorySlug, sku: p.sku,
    price: p.price, mrp: p.mrp, rating: p.rating, reviews: p.reviews, stock: p.stock,
    image: resolveImage(p.imageUrl), isNew: p.isNew, isDemo: p.isDemo, description: p.description,
    specs: p.specs,
    variants: p.variantLabel && p.variantOptions?.length ? { label: p.variantLabel, options: p.variantOptions } : undefined,
  }));
  const categories = raw.categories;
  return {
    categories,
    products,
    getProduct: (s) => products.find((p) => p.slug === s),
    getProductById: (id) => products.find((p) => p.id === id),
    getCategory: (s) => categories.find((c) => c.slug === s),
  };
}

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 60_000,
});

// The root route loader fetches the catalog (server-rendered and sent to the browser),
// so every page and the header read the same snapshot without a hydration mismatch.
const rootApi = getRouteApi("__root__");
const cache = new WeakMap<CatalogRow, Catalog>();
export const useCatalog = (): Catalog => {
  const raw = rootApi.useLoaderData() as CatalogRow;
  let c = cache.get(raw);
  if (!c) { c = build(raw); cache.set(raw, c); }
  return c;
};
export const useCatalogMaybe = useCatalog;
