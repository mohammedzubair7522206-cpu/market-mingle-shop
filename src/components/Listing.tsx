import { useMemo, useState } from "react";
import { discount, inr, type Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";

type Sort = "relevance" | "price-asc" | "price-desc" | "rating" | "popular" | "newest";

export function Listing({ list }: { list: Product[] }) {
  const brands = [...new Set(list.map((p) => p.brand))];
  const [sel, setSel] = useState<string[]>([]);
  const [max, setMax] = useState(10000);
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock] = useState(false);
  const [minDisc, setMinDisc] = useState(0);
  const [sort, setSort] = useState<Sort>("relevance");

  const out = useMemo(() => {
    const r = list.filter((p) => (!sel.length || sel.includes(p.brand)) && p.price <= max && p.rating >= minRating && (!inStock || p.stock > 0) && discount(p) >= minDisc);
    const s = [...r];
    if (sort === "price-asc") s.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") s.sort((a, b) => b.price - a.price);
    if (sort === "rating") s.sort((a, b) => b.rating - a.rating);
    if (sort === "popular") s.sort((a, b) => b.reviews - a.reviews);
    if (sort === "newest") s.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    return s;
  }, [list, sel, max, minRating, inStock, minDisc, sort]);

  const clear = () => { setSel([]); setMax(10000); setMinRating(0); setInStock(false); setMinDisc(0); };
  const active = sel.length > 0 || max < 10000 || minRating > 0 || inStock || minDisc > 0;

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="h-fit space-y-5 rounded-xl bg-background p-4 text-sm shadow-card">
        <div>
          <p className="mb-2 font-bold">Brand</p>
          {brands.map((b) => (
            <label key={b} className="flex items-center gap-2 py-0.5">
              <input type="checkbox" checked={sel.includes(b)} onChange={() => setSel((s) => (s.includes(b) ? s.filter((x) => x !== b) : [...s, b]))} /> {b}
            </label>
          ))}
        </div>
        <div>
          <p className="mb-2 font-bold">Max price: {inr(max)}</p>
          <input type="range" min={500} max={10000} step={250} value={max} onChange={(e) => setMax(+e.target.value)} className="w-full accent-primary" />
        </div>
        <div>
          <p className="mb-2 font-bold">Customer rating</p>
          {[4, 3, 0].map((r) => (
            <label key={r} className="flex items-center gap-2 py-0.5"><input type="radio" checked={minRating === r} onChange={() => setMinRating(r)} /> {r ? `${r}★ & above` : "Any"}</label>
          ))}
        </div>
        <div>
          <p className="mb-2 font-bold">Discount</p>
          {[50, 30, 0].map((d) => (
            <label key={d} className="flex items-center gap-2 py-0.5"><input type="radio" checked={minDisc === d} onChange={() => setMinDisc(d)} /> {d ? `${d}% or more` : "Any"}</label>
          ))}
        </div>
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> In stock only</label>
        {active && <button onClick={clear} className="font-semibold text-accent-foreground">Clear all filters</button>}
      </aside>
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{out.length} results</p>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-md border bg-background px-3 py-1.5 text-sm">
            <option value="relevance">Sort: Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
            <option value="popular">Popularity</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        {out.length ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{out.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
        ) : (
          <div className="rounded-xl bg-background p-10 text-center shadow-card">
            <p className="font-bold">No products match your filters.</p>
            <button onClick={clear} className="btn-primary mt-4 px-5 py-2 text-sm">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
