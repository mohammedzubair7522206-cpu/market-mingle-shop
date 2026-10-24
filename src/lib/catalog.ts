import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
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
  select: build,
  staleTime: 60_000,
});

export const useCatalog = () => useSuspenseQuery(catalogQuery).data;
/** Non-suspending variant for providers mounted above route boundaries. */
export const useCatalogMaybe = () => useQuery(catalogQuery).data;
