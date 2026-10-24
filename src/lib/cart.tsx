import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { useCatalogMaybe } from "./catalog";

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
export const MAX_QTY = 10;
export const capQty = (q: number, stock: number) => Math.max(1, Math.min(q, stock, MAX_QTY));

export function CartProvider({ children }: { children: ReactNode }) {
  const catalog = useCatalogMaybe();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const syncedFor = useRef<string | null>(null);

  // Guest cart: browser storage
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready && !user) localStorage.setItem(KEY, JSON.stringify(items)); }, [items, ready, user]);

  // Signed-in cart: load from account and merge any guest items into it
  useEffect(() => {
    if (loading || !ready || !catalog) return;
    if (!user) { if (syncedFor.current) { setItems([]); syncedFor.current = null; } return; }
    if (syncedFor.current === user.id) return;
    syncedFor.current = user.id;
    (async () => {
      const guest: CartItem[] = JSON.parse(localStorage.getItem(KEY) || "[]");
      for (const g of guest) {
        const p = catalog.getProduct(g.slug);
        if (!p?.stock) continue;
        await supabase.from("cart_items").upsert(
          { user_id: user.id, product_id: p.id, variant: g.variant ?? "", qty: capQty(g.qty, p.stock) },
          { onConflict: "user_id,product_id,variant" },
        );
      }
      localStorage.removeItem(KEY);
      const { data } = await supabase.from("cart_items").select("product_id, variant, qty").order("created_at");
      setItems((data ?? []).flatMap((r) => {
        const p = catalog.getProductById(r.product_id);
        return p ? [{ slug: p.slug, variant: r.variant || undefined, qty: r.qty }] : [];
      }));
    })();
  }, [user, loading, ready, catalog]);

  const persist = (slug: string, variant: string | undefined, qty: number | null) => {
    if (!user || !catalog) return;
    const p = catalog.getProduct(slug);
    if (!p) return;
    const v = variant ?? "";
    if (qty === null) void supabase.from("cart_items").delete().match({ user_id: user.id, product_id: p.id, variant: v });
    else void supabase.from("cart_items").upsert({ user_id: user.id, product_id: p.id, variant: v, qty }, { onConflict: "user_id,product_id,variant" });
  };

  const same = (i: CartItem, s: string, v?: string) => i.slug === s && i.variant === v;
  const stockOf = (slug: string) => catalog?.getProduct(slug)?.stock ?? 0;

  const value: Ctx = {
    items,
    add: (slug, qty = 1, variant) => {
      const stock = stockOf(slug);
      if (!stock) return;
      const ex = items.find((i) => same(i, slug, variant));
      const next = capQty((ex?.qty ?? 0) + qty, stock);
      setItems((prev) => ex ? prev.map((i) => (same(i, slug, variant) ? { ...i, qty: next } : i)) : [...prev, { slug, variant, qty: next }]);
      persist(slug, variant, next);
    },
    setQty: (slug, variant, qty) => {
      const next = capQty(qty, stockOf(slug));
      setItems((p) => p.map((i) => (same(i, slug, variant) ? { ...i, qty: next } : i)));
      persist(slug, variant, next);
    },
    remove: (slug, variant) => {
      setItems((p) => p.filter((i) => !same(i, slug, variant)));
      persist(slug, variant, null);
    },
    clear: () => {
      setItems([]);
      if (user) void supabase.from("cart_items").delete().eq("user_id", user.id);
    },
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + (catalog?.getProduct(i.slug)?.price ?? 0) * i.qty, 0),
  };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside provider");
  return c;
};
