import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { deliveryDate, discount, inr } from "@/lib/products";
import { catalogQuery, useCatalog } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { ProductCard, Stars } from "@/components/ProductCard";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params, context }) => {
    const product = (await context.queryClient.ensureQueryData(catalogQuery)).products.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — Bazaaro` },
          { name: "description", content: loaderData.product.description },
          { property: "og:title", content: loaderData.product.name },
          { property: "og:description", content: loaderData.product.description },
        ]
      : [{ title: "Product unavailable — Bazaaro" }, { name: "robots", content: "noindex" }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { products, getCategory, getProduct } = useCatalog();
  const p = getProduct(slug) ?? Route.useLoaderData().product;
  const { add } = useCart();
  const nav = useNavigate();
  const [variant, setVariant] = useState(p.variants?.options[0]);
  const [qty, setQty] = useState(1);
  const cat = getCategory(p.category);
  const related = products.filter((x) => x.category === p.category && x.slug !== p.slug).concat(products.filter((x) => x.category !== p.category)).slice(0, 4);
  const out = p.stock === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <p className="text-sm text-muted-foreground">
        <Link to="/">Home</Link> › {cat && <Link to="/category/$slug" params={{ slug: cat.slug }}>{cat.name}</Link>} › {p.brand}
      </p>
      <div className="mt-4 grid gap-8 rounded-xl bg-background p-6 shadow-card md:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-muted">
          <img src={p.image} alt={p.name} width={816} height={816} className="aspect-square w-full cursor-zoom-in object-cover transition duration-300 hover:scale-150" />
        </div>
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase text-muted-foreground">{p.brand} · SKU {p.sku}</p>
          <h1 className="text-2xl font-bold md:text-3xl">{p.name}</h1>
          <Stars rating={p.rating} reviews={p.reviews} />
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold">{inr(p.price)}</span>
            <span className="text-muted-foreground line-through">M.R.P. {inr(p.mrp)}</span>
            <span className="font-bold text-destructive">{discount(p)}% off</span>
          </div>
          <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>
          {p.variants && (
            <div>
              <p className="mb-2 text-sm font-bold">{p.variants.label}: {variant}</p>
              <div className="flex flex-wrap gap-2">
                {p.variants.options.map((o) => (
                  <button key={o} onClick={() => setVariant(o)} className={`rounded-md border px-3 py-1.5 text-sm ${o === variant ? "border-primary bg-accent font-bold" : ""}`}>{o}</button>
                ))}
              </div>
            </div>
          )}
          <p className={`font-semibold ${out ? "text-destructive" : "text-success"}`}>{out ? "Currently unavailable" : p.stock < 10 ? `Only ${p.stock} left in stock` : "In stock"}</p>
          {!out && <p className="flex items-center gap-2 text-sm"><Truck className="h-4 w-4" /> FREE delivery by <b>{deliveryDate()}</b></p>}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border">
              <button className="px-3 py-1.5" onClick={() => setQty(Math.max(1, qty - 1))} disabled={out}>−</button>
              <span className="w-8 text-center">{qty}</span>
              <button className="px-3 py-1.5" onClick={() => setQty(Math.min(p.stock, 10, qty + 1))} disabled={out}>+</button>
            </div>
          </div>
          <div className="flex gap-3">
            <button disabled={out} onClick={() => add(p.slug, qty, variant)} className="btn-primary flex-1 py-3">Add to Cart</button>
            <button disabled={out} onClick={() => { add(p.slug, qty, variant); nav({ to: "/cart" }); }} className="btn-dark flex-1 py-3">Buy Now</button>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t pt-4 text-center text-xs">
            <div><Truck className="mx-auto h-5 w-5" />Free Delivery</div>
            <div><RotateCcw className="mx-auto h-5 w-5" />7-Day Returns</div>
            <div><ShieldCheck className="mx-auto h-5 w-5" />Warranty Included</div>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-background p-6 shadow-card">
          <h2 className="mb-2 text-lg font-bold">About this item</h2>
          <p className="text-sm text-muted-foreground">{p.description}</p>
        </div>
        <div className="rounded-xl bg-background p-6 shadow-card">
          <h2 className="mb-2 text-lg font-bold">Specifications</h2>
          <table className="w-full text-sm">
            <tbody>{Object.entries(p.specs).map(([k, v]) => <tr key={k} className="border-b last:border-0"><td className="py-2 font-semibold">{k}</td><td className="py-2 text-muted-foreground">{v}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <h2 className="mb-4 mt-8 text-xl font-bold">You may also like</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{related.map((x) => <ProductCard key={x.slug} p={x} />)}</div>
    </div>
  );
}
