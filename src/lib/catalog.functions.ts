import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type CatalogRow = {
  categories: { id: string; slug: string; name: string; description: string }[];
  products: {
    id: string; slug: string; name: string; brand: string; categorySlug: string; sku: string;
    price: number; mrp: number; rating: number; reviews: number; stock: number; imageUrl: string;
    isNew: boolean; isDemo: boolean; description: string; specs: Record<string, string>;
    variantLabel: string | null; variantOptions: string[] | null;
  }[];
};

// Public catalog read (active categories/products only, enforced by RLS).
export const getCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<CatalogRow> => {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const sb = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const [cats, prods] = await Promise.all([
    sb.from("categories").select("id, slug, name, description").eq("is_active", true).order("sort_order"),
    sb.from("products").select("*, categories(slug)").eq("is_active", true).order("created_at"),
  ]);
  if (cats.error || prods.error) {
    console.error(cats.error ?? prods.error);
    throw new Error("Could not load the catalogue");
  }
  return {
    categories: cats.data,
    products: prods.data.map((p) => ({
      id: p.id, slug: p.slug, name: p.name, brand: p.brand,
      categorySlug: (p.categories as { slug: string } | null)?.slug ?? "",
      sku: p.sku, price: p.price, mrp: p.mrp, rating: Number(p.rating), reviews: p.reviews,
      stock: p.stock, imageUrl: p.image_url, isNew: p.is_new, isDemo: p.is_demo,
      description: p.description, specs: (p.specs ?? {}) as Record<string, string>,
      variantLabel: p.variant_label, variantOptions: p.variant_options,
    })),
  };
});
