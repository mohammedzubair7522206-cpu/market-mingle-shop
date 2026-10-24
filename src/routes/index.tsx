import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import { discount, type Product } from "@/lib/products";
import { useCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bazaaro — Online Shopping in India | Shop Smart. Discover More." },
      { name: "description", content: "Discover deals on electronics, fashion, home & kitchen, beauty and fitness. Fast delivery across India." },
      { property: "og:title", content: "Bazaaro — Shop Smart. Discover More." },
      { property: "og:description", content: "Discover deals on electronics, fashion, home & kitchen, beauty and fitness." },
    ],
  }),
  component: Index,
});

function Section({ title, children, to }: { title: string; children: React.ReactNode; to?: boolean }) {
  return (
    <section className="mx-auto mt-8 max-w-7xl px-4">
      <div className="rounded-xl bg-background p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          {to && <Link to="/products" className="text-sm font-semibold text-accent-foreground">See all →</Link>}
        </div>
        {children}
      </div>
    </section>
  );
}

const Grid = ({ list }: { list: Product[] }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{list.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
);

function Index() {
  const { categories, products } = useCatalog();
  const best = [...products].sort((a, b) => b.reviews - a.reviews).slice(0, 4);
  const deals = [...products].sort((a, b) => discount(b) - discount(a)).slice(0, 4);
  const fresh = products.filter((p) => p.isNew);
  return (
    <div className="pb-4">
      <section className="relative overflow-hidden">
        <img src={hero} alt="Festive sale products" width={1600} height={640} className="h-[340px] w-full object-cover md:h-[420px]" />
        <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-center px-6">
          <p className="text-sm font-bold uppercase tracking-widest text-nav">Festive Sale</p>
          <h1 className="mt-2 max-w-md text-4xl font-extrabold text-nav md:text-5xl">Big savings on everything you love</h1>
          <p className="mt-3 max-w-sm font-medium text-nav">Up to 60% off across 5 categories. Limited time only.</p>
          <Link to="/products" className="btn-dark mt-6 w-fit px-6 py-3">Shop the sale</Link>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-7xl px-4 relative">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {categories.map((c) => {
            const p = products.find((x) => x.category === c.slug);
            return (
              <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} className="rounded-xl bg-background p-3 text-center shadow-card transition hover:-translate-y-0.5">
                <img src={p?.image} alt={c.name} loading="lazy" className="mx-auto aspect-square w-full rounded-lg bg-muted object-cover" />
                <p className="mt-2 text-sm font-bold">{c.name}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <Section title="Today's Deals" to><Grid list={deals} /></Section>
      <Section title="Bestsellers" to><Grid list={best} /></Section>
      <Section title="New Arrivals" to><Grid list={fresh} /></Section>

      <section className="mx-auto mt-8 max-w-7xl px-4">
        <div className="flex flex-col items-center gap-4 rounded-xl bg-nav px-6 py-10 text-center text-nav-foreground">
          <h2 className="text-2xl font-bold">Get exclusive deals in your inbox</h2>
          <form className="flex w-full max-w-md overflow-hidden rounded-full bg-background" onSubmit={(e) => { e.preventDefault(); (e.currentTarget as HTMLFormElement).reset(); alert("Thanks for subscribing!"); }}>
            <input type="email" required placeholder="you@example.com" className="flex-1 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none" />
            <button className="btn-primary rounded-none px-5 text-sm">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  );
}
