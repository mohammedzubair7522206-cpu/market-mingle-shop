import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getProduct } from "./products";

export type CartItem = { slug: string; variant?: string | undefined; qty: number };
type Ctx = {
  items: CartItem[];
  add: (slug: string, qty?: number, variant?: string) => void;
  setQty: (slug: string, variant: string | undefined, qty: number) => void;
  remove: (slug: string, variant?: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(items)); }, [items, ready]);

  const same = (i: CartItem, s: string, v?: string) => i.slug === s && i.variant === v;
  const cap = (slug: string, q: number) => Math.max(1, Math.min(q, getProduct(slug)?.stock ?? 0, 10));

  const value: Ctx = {
    items,
    add: (slug, qty = 1, variant) => {
      if (!getProduct(slug)?.stock) return;
      setItems((prev) => {
        const ex = prev.find((i) => same(i, slug, variant));
        if (ex) return prev.map((i) => (same(i, slug, variant) ? { ...i, qty: cap(slug, i.qty + qty) } : i));
        return [...prev, { slug, variant, qty: cap(slug, qty) }];
      });
    },
    setQty: (slug, variant, qty) => setItems((p) => p.map((i) => (same(i, slug, variant) ? { ...i, qty: cap(slug, qty) } : i))),
    remove: (slug, variant) => setItems((p) => p.filter((i) => !same(i, slug, variant))),
    clear: () => setItems([]),
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + (getProduct(i.slug)?.price ?? 0) * i.qty, 0),
  };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside provider");
  return c;
};
