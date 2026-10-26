// Pure admin rules shared by the dashboard UI. The database enforces the same rules
// (RLS + guard_order_update trigger); these only decide what the UI offers.
export type OrderStatus =
  | "pending_payment" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment", paid: "Paid — not shipped", processing: "Processing",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded",
};

export function paymentStatus(o: { status: OrderStatus; paid_at: string | null }) {
  if (o.status === "refunded") return "Refunded";
  return o.paid_at ? "Paid" : "Unpaid";
}

/** Fulfilment statuses an admin may move an order to. Payment states are never offered. */
export function nextStatuses(o: { status: OrderStatus; paid_at: string | null }): OrderStatus[] {
  if (["delivered", "cancelled", "refunded"].includes(o.status)) return [];
  const all: OrderStatus[] = o.paid_at ? ["processing", "shipped", "delivered", "cancelled"] : ["cancelled"];
  return all.filter((s) => s !== o.status);
}

export const isLowStock = (p: { stock: number; low_stock_threshold: number }) => p.stock <= p.low_stock_threshold;

/** Sales metrics count only orders the payment provider confirmed (paid_at set, not refunded). */
export function salesMetrics(orders: { total: number; paid_at: string | null; status: OrderStatus }[]) {
  const paid = orders.filter((o) => o.paid_at && o.status !== "refunded");
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  return { revenue, paidOrders: paid.length, avgOrder: paid.length ? Math.round(revenue / paid.length) : 0 };
}

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
