import { Link } from "@tanstack/react-router";
import { MapPin, ShoppingCart, User } from "lucide-react";
import { useCatalogMaybe } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { SearchBox } from "@/components/SearchBox";

export const BRAND = "Bazaaro";

export function Header() {
  const { count } = useCart();
  const { user } = useAuth();
  const categories = useCatalogMaybe()?.categories ?? [];
  return (
    <header className="sticky top-0 z-30">
      <div className="bg-primary py-1.5 text-center text-xs font-semibold text-primary-foreground">
        Festive Sale is live — up to 60% off · Free delivery on orders above ₹499
      </div>
      <div className="bg-nav text-nav-foreground">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
            bazaar<span className="text-primary">o</span>
          </Link>
          <div className="hidden items-center gap-1 text-xs md:flex">
            <MapPin className="h-4 w-4" /> <div><p className="opacity-70">Deliver to</p><p className="font-bold">India 560001</p></div>
          </div>
          <SearchBox />
          <Link to={user ? "/account" : "/auth"} className="hidden items-center gap-1 text-sm font-semibold sm:flex"><User className="h-4 w-4" /> {user ? "Account" : "Sign in"}</Link>
          <Link to="/cart" className="relative flex items-center gap-1 text-sm font-semibold">
            <ShoppingCart className="h-6 w-6" />
            <span className="absolute -right-2 -top-2 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{count}</span>
            <span className="hidden sm:inline">Cart</span>
          </Link>
        </div>
        <nav className="bg-nav-muted">
          <div className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 py-2 text-sm">
            <Link to="/products" className="whitespace-nowrap font-semibold">All Products</Link>
            {categories.map((c) => (
              <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} className="whitespace-nowrap opacity-90 hover:opacity-100">{c.name}</Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const categories = useCatalogMaybe()?.categories ?? [];
  return (
    <footer className="mt-16 bg-nav text-nav-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-extrabold">bazaar<span className="text-primary">o</span></p>
          <p className="mt-2 text-sm opacity-70">Shop Smart. Discover More.</p>
        </div>
        {[
          ["Shop", categories.map((c) => c.name)],
          ["Support", ["Help Centre", "Track Order", "Returns & Refunds", "Contact Us"]],
          ["Company", ["About Us", "Careers", "Privacy Policy", "Terms of Use"]],
        ].map(([t, l]) => (
          <div key={t as string}>
            <p className="mb-3 font-bold">{t}</p>
            <ul className="space-y-1.5 text-sm opacity-70">{(l as string[]).map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        ))}
      </div>
      <p className="border-t border-nav-muted py-4 text-center text-xs opacity-60">© 2026 {BRAND}. All prices in INR, inclusive of GST.</p>
    </footer>
  );
}
