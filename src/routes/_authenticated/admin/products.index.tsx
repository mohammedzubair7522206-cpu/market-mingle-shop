import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isLowStock } from "@/lib/admin";
import { inr, resolveImage } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/admin/products/")({ component: ProductsAdmin });

export const field = "rounded-md border border-input bg-background px-3 py-2 text-sm";

function ProductsAdmin() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("all");
  const [stock, setStock] = useState("all");
  const data = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const [p, c] = await Promise.all([
        supabase.from("products").select("id, name, sku, brand, price, mrp, stock, low_stock_threshold, is_active, image_url, category_id").order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name").order("sort_order"),
      ]);
      if (p.error) throw p.error;
      return { products: p.data, categories: c.data ?? [] };
    },
  });
  const cats = data.data?.categories ?? [];
  const rows = (data.data?.products ?? []).filter((p) => {
    const t = q.trim().toLowerCase();
    if (t && ![p.name, p.sku, p.brand].some((v) => v.toLowerCase().includes(t))) return false;
    if (cat && p.category_id !== cat) return false;
    if (status === "active" && !p.is_active) return false;
    if (status === "archived" && p.is_active) return false;
    if (stock === "low" && !isLowStock(p)) return false;
    if (stock === "out" && p.stock > 0) return false;
    return true;
  });
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, SKU or brand" className={`${field} flex-1`} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={field}>
          <option value="">All categories</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
          <option value="all">Active & archived</option><option value="active">Active</option><option value="archived">Archived</option>
        </select>
        <select value={stock} onChange={(e) => setStock(e.target.value)} className={field}>
          <option value="all">Any stock</option><option value="low">Low stock</option><option value="out">Out of stock</option>
        </select>
        <Link to="/admin/products/$id" params={{ id: "new" }} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">+ Add product</Link>
      </div>
      {data.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr><th className="py-2">Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="py-2">
                    <Link to="/admin/products/$id" params={{ id: p.id }} className="flex items-center gap-3 font-semibold hover:underline">
                      {p.image_url ? <img src={resolveImage(p.image_url)} alt="" className="h-10 w-10 rounded object-cover" /> : <span className="h-10 w-10 rounded bg-muted" />}
                      <span>{p.name}<span className="block text-xs font-normal text-muted-foreground">{p.brand}</span></span>
                    </Link>
                  </td>
                  <td>{p.sku}</td>
                  <td>{cats.find((c) => c.id === p.category_id)?.name ?? "—"}</td>
                  <td>{inr(p.price)}</td>
                  <td className={p.stock === 0 ? "font-bold text-destructive" : isLowStock(p) ? "font-bold text-primary" : ""}>{p.stock}</td>
                  <td>{p.is_active ? "Active" : <span className="text-muted-foreground">Archived</span>}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No products match.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
