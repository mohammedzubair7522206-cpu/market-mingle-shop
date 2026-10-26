import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isLowStock, salesMetrics, STATUS_LABEL, type OrderStatus } from "@/lib/admin";
import { inr } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Overview });

export const Card = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-2xl font-bold">{value}</p>
  </div>
);

function Overview() {
  const q = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const [p, c, o] = await Promise.all([
        supabase.from("products").select("id, name, sku, stock, low_stock_threshold, is_active"),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total, paid_at, status"),
      ]);
      if (p.error || o.error) throw p.error ?? o.error;
      return { products: p.data, categories: c.count ?? 0, orders: o.data };
    },
  });
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (q.error || !q.data) return <p className="text-sm text-destructive">Could not load the dashboard.</p>;
  const { products, categories, orders } = q.data;
  const active = products.filter((p) => p.is_active);
  const low = active.filter(isLowStock).sort((a, b) => a.stock - b.stock);
  const m = salesMetrics(orders as { total: number; paid_at: string | null; status: OrderStatus }[]);
  const byStatus = orders.reduce<Record<string, number>>((a, o) => ({ ...a, [o.status]: (a[o.status] ?? 0) + 1 }), {});
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="Revenue (paid orders)" value={inr(m.revenue)} />
        <Card label="Paid orders" value={m.paidOrders} />
        <Card label="Avg. order value" value={inr(m.avgOrder)} />
        <Card label="All orders" value={orders.length} />
        <Card label="Active products" value={active.length} />
        <Card label="Archived products" value={products.length - active.length} />
        <Card label="Categories" value={categories} />
        <Card label="Units in stock" value={active.reduce((s, p) => s + p.stock, 0)} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 font-bold">Low-stock alerts ({low.length})</h2>
          {low.length === 0 ? <p className="text-sm text-muted-foreground">All active products are above their stock threshold.</p> : (
            <ul className="divide-y divide-border text-sm">
              {low.map((p) => (
                <li key={p.id} className="flex justify-between py-2">
                  <Link to="/admin/products/$id" params={{ id: p.id }} className="font-semibold hover:underline">{p.name}</Link>
                  <span className={p.stock === 0 ? "font-bold text-destructive" : "text-primary"}>{p.stock === 0 ? "Out of stock" : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 font-bold">Orders by status</h2>
          {orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet. Sales figures will appear once customers pay for orders.</p> : (
            <ul className="space-y-1 text-sm">
              {Object.entries(byStatus).map(([s, n]) => <li key={s} className="flex justify-between"><span>{STATUS_LABEL[s as OrderStatus]}</span><b>{n}</b></li>)}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
