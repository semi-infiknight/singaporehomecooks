import { describe, expect, it } from "vitest";
import { PATCH } from "./route";
import { signShcToken } from "../../../../lib/shc-auth";
import ShcCartModuleService from "../../../../modules/shc-cart/service";

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

describe("PATCH /store/shc/cart", () => {
  it("updates qty and removes line when qty is 0", async () => {
    let cartState: any = {
      items: [
        { product_id: "prod_a", name: "Laksa", qty: 4, price: 12, cook_id: "cook_1", min_qty: 4 },
        { product_id: "prod_b", name: "Rendang", qty: 2, price: 15, cook_id: "cook_1", min_qty: 1 },
      ],
      cookId: "cook_1",
      drop_id: null,
      collection_date: null,
      collection_slot: null,
    };

    const cartService = {
      async getCart() {
        return cartState;
      },
      async setItemQty(_cid: string, productId: string, qty: number) {
        if (qty <= 0) {
          cartState = {
            ...cartState,
            items: cartState.items.filter((i: { product_id: string }) => i.product_id !== productId),
          };
          if (cartState.items.length === 0) {
            cartState = { ...cartState, cookId: null, items: [] };
          }
          return cartState;
        }
        cartState = {
          ...cartState,
          items: cartState.items.map((i: { product_id: string; qty: number }) =>
            i.product_id === productId ? { ...i, qty } : i
          ),
        };
        return cartState;
      },
    } as unknown as ShcCartModuleService;

    const metaService = {
      async getMetaForProduct(id: string) {
        if (id === "prod_a") return { min_qty: 4 };
        return { min_qty: 1 };
      },
    };

    const token = signShcToken({ actor_type: "customer", actor_id: "cust_1", shc: true });
    const scope = {
      resolve(name: string) {
        if (name === "shcCart") return cartService;
        if (name === "shcProductMeta") return metaService;
        if (name === "shcDrop") return { getDrop: async () => null };
        throw new Error(`Unknown ${name}`);
      },
    };

    const incReq: any = {
      headers: { authorization: `Bearer ${token}` },
      body: { product_id: "prod_b", qty: 3 },
      scope,
    };
    const incRes = makeRes();
    await PATCH(incReq, incRes);
    expect(incRes.statusCode).toBe(200);
    expect(incRes.body.cart.items.find((i: any) => i.product_id === "prod_b").qty).toBe(3);

    const decReq: any = {
      headers: { authorization: `Bearer ${token}` },
      body: { product_id: "prod_a", qty: 3 },
      scope,
    };
    const decRes = makeRes();
    await PATCH(decReq, decRes);
    expect(decRes.statusCode).toBe(400);

    const rmReq: any = {
      headers: { authorization: `Bearer ${token}` },
      body: { product_id: "prod_b", qty: 0 },
      scope,
    };
    const rmRes = makeRes();
    await PATCH(rmReq, rmRes);
    expect(rmRes.statusCode).toBe(200);
    expect(rmRes.body.cart.items).toHaveLength(1);
    expect(rmRes.body.cart.items[0].product_id).toBe("prod_a");
  });
});
