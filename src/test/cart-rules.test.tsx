import { describe, expect, it } from "vitest";
import { capQty } from "@/lib/cart";

describe("cart quantity rules", () => {
  it("never allows more than 10 of one item", () => expect(capQty(15, 100)).toBe(10));
  it("never allows more than the stock available", () => expect(capQty(8, 3)).toBe(3));
  it("keeps at least 1 in the cart", () => expect(capQty(0, 5)).toBe(1));
});
