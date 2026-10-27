import { useNavigate } from "@tanstack/react-router";
import { Loader2, Search, TrendingUp, LayoutGrid } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCatalogMaybe } from "@/lib/catalog";
import { inr } from "@/lib/products";

type Item =
  | { kind: "product"; key: string; label: string; slug: string; image: string; price: number; brand: string }
  | { kind: "category"; key: string; label: string; slug: string }
  | { kind: "term"; key: string; label: string };

function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-accent font-bold text-accent-foreground">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export function SearchBox() {
  const catalog = useCatalogMaybe();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 150);
    return () => clearTimeout(t);
  }, [q]);
  const loading = q.trim() !== debounced;

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const items = useMemo<Item[]>(() => {
    if (!catalog) return [];
    const { products, categories } = catalog;
    const term = debounced.toLowerCase();
    if (!term) {
      // Popular searches: brands of the most-reviewed products in the database.
      const brands = [...new Set([...products].sort((a, b) => b.reviews - a.reviews).map((p) => p.brand))].slice(0, 5);
      return brands.map((b) => ({ kind: "term", key: `t-${b}`, label: b }));
    }
    const prods = products
      .filter((p) => `${p.name} ${p.brand}`.toLowerCase().includes(term))
      .sort((a, b) => Number(b.name.toLowerCase().startsWith(term)) - Number(a.name.toLowerCase().startsWith(term)) || b.reviews - a.reviews)
      .slice(0, 6)
      .map<Item>((p) => ({ kind: "product", key: `p-${p.slug}`, label: p.name, slug: p.slug, image: p.image, price: p.price, brand: p.brand }));
    const cats = categories
      .filter((c) => c.name.toLowerCase().includes(term))
      .slice(0, 3)
      .map<Item>((c) => ({ kind: "category", key: `c-${c.slug}`, label: c.name, slug: c.slug }));
    const brands = [...new Set(products.map((p) => p.brand))]
      .filter((b) => b.toLowerCase().includes(term))
      .slice(0, 3)
      .map<Item>((b) => ({ kind: "term", key: `t-${b}`, label: b }));
    return [...prods, ...cats, ...brands];
  }, [catalog, debounced]);

  useEffect(() => setActive(-1), [debounced]);

  const go = (it?: Item) => {
    setOpen(false);
    if (!it) {
      const t = q.trim();
      nav({ to: "/products", search: t ? { q: t } : {} });
      return;
    }
    if (it.kind === "product") nav({ to: "/product/$slug", params: { slug: it.slug } });
    else if (it.kind === "category") nav({ to: "/category/$slug", params: { slug: it.slug } });
    else { setQ(it.label); nav({ to: "/products", search: { q: it.label } }); }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => (items.length ? (a + 1) % items.length : -1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (items.length ? (a <= 0 ? items.length - 1 : a - 1) : -1)); }
    else if (e.key === "Escape") { setOpen(false); setActive(-1); }
  };

  const showEmpty = !loading && debounced && items.length === 0;
  const products = items.filter((i) => i.kind === "product");
  const others = items.filter((i) => i.kind !== "product");
  const idx = (it: Item) => items.indexOf(it);

  const row = (it: Item) => {
    const i = idx(it);
    const cls = `flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-foreground ${i === active ? "bg-muted" : "hover:bg-muted"}`;
    return (
      <li key={it.key} role="option" id={`sugg-${i}`} aria-selected={i === active}>
        <button type="button" className={cls} onMouseEnter={() => setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => go(it)}>
          {it.kind === "product" ? (
            <>
              <img src={it.image} alt="" className="h-10 w-10 shrink-0 rounded bg-muted object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate"><Highlight text={it.label} q={debounced} /></span>
                <span className="block text-xs text-muted-foreground">{it.brand}</span>
              </span>
              <span className="font-bold">{inr(it.price)}</span>
            </>
          ) : it.kind === "category" ? (
            <><LayoutGrid className="h-4 w-4 text-muted-foreground" /><span className="flex-1">in <Highlight text={it.label} q={debounced} /></span><span className="text-xs text-muted-foreground">Category</span></>
          ) : (
            <>{debounced ? <Search className="h-4 w-4 text-muted-foreground" /> : <TrendingUp className="h-4 w-4 text-primary" />}<span className="flex-1"><Highlight text={it.label} q={debounced} /></span></>
          )}
        </button>
      </li>
    );
  };

  return (
    <div ref={wrap} className="relative flex-1">
      <form
        className="flex overflow-hidden rounded-full bg-background"
        onSubmit={(e) => { e.preventDefault(); go(active >= 0 ? items[active] : undefined); }}
      >
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="Search products, brands and more"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-suggestions"
          aria-activedescendant={active >= 0 ? `sugg-${active}` : undefined}
          aria-autocomplete="list"
          className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-foreground outline-none"
        />
        <button aria-label="Search" className="bg-primary px-4 text-primary-foreground"><Search className="h-4 w-4" /></button>
      </form>
      {open && (items.length > 0 || loading || showEmpty) && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border bg-background shadow-card">
          {loading ? (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</p>
          ) : showEmpty ? (
            <div className="px-4 py-4 text-sm text-foreground">
              <p className="font-semibold">No results for “{debounced}”</p>
              <p className="mt-1 text-muted-foreground">Check the spelling or try a broader term like a brand or category.</p>
            </div>
          ) : (
            <ul id="search-suggestions" role="listbox" className="max-h-[70vh] overflow-y-auto py-2">
              {!debounced && <li className="px-4 pb-1 text-xs font-bold uppercase text-muted-foreground">Popular searches</li>}
              {products.length > 0 && <li className="px-4 pb-1 text-xs font-bold uppercase text-muted-foreground">Products</li>}
              {products.map(row)}
              {debounced && others.length > 0 && <li className="mt-1 border-t px-4 pb-1 pt-2 text-xs font-bold uppercase text-muted-foreground">Categories & brands</li>}
              {others.map(row)}
              {debounced && (
                <li>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go()} className="mt-1 w-full border-t px-4 py-2 text-left text-sm font-semibold text-accent-foreground hover:bg-muted">
                    See all results for “{debounced}” →
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
