import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/shc-actors", () => ({
  getCustomerId: () => "cust_demo",
  unauthorized: (res: any) => res.status(401).json({ error: "unauthorized" }),
}));

import { POST } from "./route";

function makeRes() {
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return res;
}

describe("POST /store/shc/cart", () => {
  it("returns SHC-CART-001 when adding a second cook's product", async () => {
    const req: any = {
      body: { product_id: "dish_b_001", qty: 1 },
      scope: {
        resolve(name: string) {
          if (name === "shcProductMeta") {
            return {
              getMetaForProduct: async (id: string) =>
                id === "dish_b_001"
                  ? { product_id: id, cook_id: "cook_b", name: "Dish B", price_cents: 1200, cuisine: "Malay" }
                  : null,
            };
          }
          if (name === "shcCart") {
            return {
              addToCart: async () => {
                const { createSHCError } = require("@shc/types");
                throw createSHCError("SHC-CART-001", "Only products from the same cook allowed in cart.");
              },
            };
          }
          if (name === "shcAvailability") return { getAvailability: async () => null };
          if (name === "shcCook") return { listAndCountCooks: async () => [[]] };
          throw new Error(`Unknown ${name}`);
        },
      },
    };

    const res = makeRes();
    await POST(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe("SHC-CART-001");
  });
});
