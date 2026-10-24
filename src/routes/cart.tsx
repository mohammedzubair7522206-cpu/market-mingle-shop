import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { inr } from "@/lib/products";
import { useCatalog } from "@/lib/catalog";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Bazaaro" },
      { name: "description", content: "Review the items in your Bazaaro shopping cart." },
      { property: "og:title", content: "Your Cart — Bazaaro" },
      { property: "og:description", content: "Review the items in your shopping cart." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal, count } = useCart();
  const { getProduct } = useCatalog();
  const shipping = subtotal >= 499 || subtotal === 0 ? 0 : 49;

  if (!items.length)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link to="/products" className="btn-primary mt-6 inline-block px-6 py-3">Start shopping</Link>
      </div>
    );

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[1fr_320px]">
      <div className="rounded-xl bg-background p-5 shadow-card">
        <h1 className="mb-4 text-2xl font-bold">Shopping Cart</h1>
        {items.map((i) => {
          const p = getProduct(i.slug);
          if (!p) return null;
          return (
            <div key={i.slug + i.variant} className="flex gap-4 border-t py-4">
              <img src={p.image} alt={p.name} className="h-24 w-24 rounded-md bg-muted object-cover" />
              <div className="flex-1">
                <Link to="/product/$slug" params={{ slug: p.slug }} className="font-semibold">{p.name}</Link>
                {i.variant && <p className="text-sm text-muted-foreground">{p.variants?.label}: {i.variant}</p>}
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center rounded-full border text-sm">
                    <button className="px-3 py-1" onClick={() => setQty(i.slug, i.variant, i.qty - 1)}>−</button>
                    <span className="w-6 text-center">{i.qty}</span>
                    <button className="px-3 py-1" onClick={() => setQty(i.slug, i.variant, i.qty + 1)}>+</button>
                  </div>
                  <button aria-label="Remove" onClick={() => remove(i.slug, i.variant)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="font-bold">{inr(p.price * i.qty)}</p>
            </div>
          );
        })}
      </div>
      <aside className="h-fit space-y-2 rounded-xl bg-background p-5 text-sm shadow-card">
        <div className="flex justify-between"><span>Items ({count})</span><span>{inr(subtotal)}</span></div>
        <div className="flex justify-between"><span>Delivery</span><span>{shipping ? inr(shipping) : "FREE"}</span></div>
        <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>Total</span><span>{inr(subtotal + shipping)}</span></div>
        <button className="btn-primary mt-3 w-full py-3" onClick={() => alert("Checkout is coming soon — payments are not connected yet.")}>Proceed to Checkout</button>
      </aside>
    </div>
  );
}
