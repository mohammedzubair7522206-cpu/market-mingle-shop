import { describe, expect, it } from "vitest";
import { isLowStock, nextStatuses, paymentStatus, salesMetrics } from "@/lib/admin";

describe("admin order rules", () => {
  it("never offers 'paid' as a manual status", () => {
    expect(nextStatuses({ status: "paid", paid_at: "2026-01-01" })).not.toContain("paid");
  });
  it("unpaid orders can only be cancelled", () => {
    expect(nextStatuses({ status: "pending_payment", paid_at: null })).toEqual(["cancelled"]);
  });
  it("delivered orders are closed", () => {
    expect(nextStatuses({ status: "delivered", paid_at: "2026-01-01" })).toEqual([]);
  });
  it("payment status follows payment confirmation", () => {
    expect(paymentStatus({ status: "pending_payment", paid_at: null })).toBe("Unpaid");
  });
});

describe("admin metrics", () => {
  it("revenue counts only confirmed, non-refunded payments", () => {
    const m = salesMetrics([
      { total: 1000, paid_at: "x", status: "paid" },
      { total: 500, paid_at: null, status: "pending_payment" },
      { total: 300, paid_at: "x", status: "refunded" },
    ]);
    expect(m).toEqual({ revenue: 1000, paidOrders: 1, avgOrder: 1000 });
  });
  it("stock at or below the threshold is low", () => {
    expect(isLowStock({ stock: 5, low_stock_threshold: 5 })).toBe(true);
    expect(isLowStock({ stock: 6, low_stock_threshold: 5 })).toBe(false);
  });
});
