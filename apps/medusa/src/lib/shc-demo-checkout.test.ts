import { describe, expect, it, vi } from "vitest";
import { enforceMinimumOrder } from "@shc/business-rules";

vi.mock("./shc-actors", () => ({
  getCustomerId: () => "cust_demo",
}));

import { completeDemoCartCheckout } from "./shc-demo-checkout";

describe("completeDemoCartCheckout minimum order", () => {
  it("rejects non-tasting carts below S$50", async () => {
    const req: any = {
      scope: {
        resolve(name: string) {
          if (name === "shcCart") {
            return {
              getCart: async () => ({
                items: [{ product_id: "dish_small_001", name: "Snack", qty: 2, price: 12, cook_id: "cook_1" }],
                cookId: "cook_1",
              }),
              clearCart: async () => ({}),
            };
          }
          if (name === "shcProductMeta") {
            return {
              getMetaForProduct: async () => ({ tasting_portion: false, price_cents: 1200 }),
            };
          }
          if (name === "shcOrderMeta") return { createOrUpdateMeta: async () => ({}), getOrderMetaWithMessages: async () => ({}) };
          if (name === "shcCreditWallet") return { redeemCredits: async () => ({ used: 0 }) };
          if (name === "shcNotification") return { push: async () => {} };
          throw new Error(`Unknown ${name}`);
        },
      },
    };
    Object.defineProperty(req, "auth", { value: { actor_id: "cust_demo" } });

    await expect(
      completeDemoCartCheckout(req, {
        collection_date: "2026-07-10",
        collection_slot: "18:00-19:00",
        allergen_acked: true,
        pdpa_consent: true,
      })
    ).rejects.toMatchObject({ code: "SHC-CART-004" });
  });

  it("allows tasting-only carts below S$50", async () => {
    const minimum = enforceMinimumOrder({
      totalCents: 800,
      lines: [{ tasting_portion: true, price_cents: 800 }],
    });
    expect(minimum.valid).toBe(true);
  });
});
