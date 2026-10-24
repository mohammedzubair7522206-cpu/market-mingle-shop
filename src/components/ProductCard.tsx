import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { discount, inr, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";

export function Stars({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="flex items-center gap-0.5 rounded bg-success px-1.5 py-0.5 text-xs font-bold text-primary-foreground">
        {rating.toFixed(1)} <Star className="h-3 w-3 fill-current" />
      </span>
      <span className="text-muted-foreground">({reviews.toLocaleString("en-IN")})</span>
    </div>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  return (
    <div className="group flex flex-col rounded-lg border bg-card p-3 transition hover:shadow-card">
      <Link to="/product/$slug" params={{ slug: p.slug }} className="relative block overflow-hidden rounded-md bg-muted">
        <img src={p.image} alt={p.name} loading="lazy" width={816} height={816} className="aspect-square w-full object-cover transition group-hover:scale-105" />
        <span className="absolute left-2 top-2 rounded bg-destructive px-2 py-0.5 text-xs font-bold text-primary-foreground">{discount(p)}% off</span>
      </Link>
      <div className="mt-3 flex flex-1 flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase text-muted-foreground">{p.brand}</p>
        <Link to="/product/$slug" params={{ slug: p.slug }} className="line-clamp-2 text-sm font-semibold hover:text-accent-foreground">{p.name}</Link>
        <Stars rating={p.rating} reviews={p.reviews} />
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-extrabold">{inr(p.price)}</span>
          <span className="text-sm text-muted-foreground line-through">{inr(p.mrp)}</span>
        </div>
        <p className={`text-xs font-medium ${p.stock === 0 ? "text-destructive" : p.stock < 10 ? "text-accent-foreground" : "text-success"}`}>
          {p.stock === 0 ? "Out of stock" : p.stock < 10 ? `Only ${p.stock} left` : "In stock · Free delivery"}
        </p>
        <button disabled={!p.stock} onClick={() => add(p.slug, 1, p.variants?.options[0])} className="btn-primary mt-auto py-2 text-sm">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
