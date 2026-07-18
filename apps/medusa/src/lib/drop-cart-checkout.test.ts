/**
 * Cooking soon funnel: POST cart(drop_id) → completeDemoCartCheckout (reserve + meta).
 * Exercises the shipped one-cook cart path — not the legacy parallel orderDrop route.
 */
import { describe, expect, it, vi } from "vitest";
import { POST as cartPost } from "../api/store/shc/cart/route";
import { completeDemoCartCheckout } from "./shc-demo-checkout";
import { signShcToken } from "./shc-auth";
import { createInMemoryDropCasExecutor } from "./shc-drop-pg";
import ShcDropModuleService from "../modules/shc-drop/service";

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

function futureIso() {
  return new Date(Date.now() + 12 * 3600_000).toISOString();
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

describe("drop → cart → demo-complete funnel", () => {
  it("adds drop to cart, then checkout reserves capacity and locks collection", async () => {
    const store = new Map<string, any>();
    store.set("drop_1", {
      id: "drop_1",
      cook_id: "cook_1",
      title: "Samosas",
      price_cents: 120,
      min_qty: 0,
      max_qty: 40,
      ordered_qty: 10,
      cook_date: tomorrow(),
      collection_slot: "18:00-19:00",
      order_by: futureIso(),
      status: "open",
      visibility: "marketplace",
      deleted_at: null,
    });

    const dropService = Object.assign(Object.create(ShcDropModuleService.prototype), {
      _dropPgExecutor: createInMemoryDropCasExecutor(store),
      async listAndCountDrops(filters: any = {}) {
        let rows = Array.from(store.values());
        if (filters.id) rows = rows.filter((r) => r.id === filters.id);
        if (filters.status) {
          const st = Array.isArray(filters.status) ? filters.status : [filters.status];
          rows = rows.filter((r) => st.includes(r.status));
        }
        return [rows, rows.length];
      },
      async updateDrops({ selector, data }: any) {
        const row = store.get(selector.id);
        if (!row) return [];
        Object.assign(row, data);
        return [row];
      },
    }) as ShcDropModuleService;

    let cartState: any = { items: [], cookId: null };
    const cartService = {
      async getCart() {
        return cartState;
      },
      async clearCart() {
        cartState = { items: [], cookId: null };
        return cartState;
      },
      async addToCart(_cid: string, item: any) {
        cartState = {
          items: [item],
          cookId: item.cook_id,
          drop_id: item.drop_id,
          collection_date: item.collection_date,
          collection_slot: item.collection_slot,
        };
        return cartState;
      },
    };

    let savedMeta: any;
    const metaService = {
      createOrUpdateMeta: async (p: any) => {
        savedMeta = p;
      },
      addOrderMessage: async () => {},
      getOrderMetaWithMessages: async () => ({ messages: [] }),
    };
    const notif = { push: async () => {} };

    const token = signShcToken({ actor_type: "customer", actor_id: "cust_1", shc: true });
    const scope = {
      resolve(name: string) {
        if (name === "shcDrop") return dropService;
        if (name === "shcCart") return cartService;
        if (name === "shcOrderMeta") return metaService;
        if (name === "shcNotification") return notif;
        if (name === "logger") return console;
        throw new Error(`Unknown ${name}`);
      },
    };

    // 1) POST /store/shc/cart { drop_id, qty }
    const addReq: any = {
      headers: { authorization: `Bearer ${token}` },
      body: { drop_id: "drop_1", qty: 5 },
      scope,
    };
    const addRes = makeRes();
    await cartPost(addReq, addRes);
    expect(addRes.statusCode).toBe(200);
    expect(addRes.body.cart.drop_id).toBe("drop_1");
    expect(addRes.body.cart.items[0].qty).toBe(5);
    expect(addRes.body.cart.collection_date).toBe(store.get("drop_1").cook_date);
    // Capacity NOT reserved yet
    expect(store.get("drop_1").ordered_qty).toBe(10);

    // 2) completeDemoCartCheckout (same path as /carts/demo-complete)
    const completeReq: any = {
      headers: { authorization: `Bearer ${token}` },
      scope,
    };
    const result = await completeDemoCartCheckout(completeReq, {
      collection_date: "2099-01-01", // free-pick ignored for drop
      collection_slot: "00:00-01:00",
      allergen_acked: true,
      pdpa_consent: true,
    });

    expect(result.order.origin_drop_id).toBe("drop_1");
    expect(result.order.collection_date).toBe(store.get("drop_1").cook_date);
    expect(result.order.collection_slot).toBe("18:00-19:00");
    expect(store.get("drop_1").ordered_qty).toBe(15); // 10 + 5 reserved at complete
    expect(savedMeta.origin_request_id).toBe("drop:drop_1");
    expect(savedMeta.collection_date).toBe(store.get("drop_1").cook_date);
    expect(cartState.items).toHaveLength(0); // cart cleared after complete
  });

  it("rejects checkout when batch sold out — cart kept", async () => {
    const store = new Map<string, any>();
    store.set("drop_full", {
      id: "drop_full",
      cook_id: "cook_1",
      title: "Full",
      price_cents: 100,
      min_qty: 0,
      max_qty: 5,
      ordered_qty: 5,
      cook_date: tomorrow(),
      collection_slot: "18:00-19:00",
      order_by: futureIso(),
      status: "sold_out",
      visibility: "marketplace",
      deleted_at: null,
    });

    const dropService = Object.assign(Object.create(ShcDropModuleService.prototype), {
      _dropPgExecutor: createInMemoryDropCasExecutor(store),
      async listAndCountDrops(filters: any = {}) {
        let rows = Array.from(store.values());
        if (filters.id) rows = rows.filter((r) => r.id === filters.id);
        return [rows, rows.length];
      },
      async updateDrops({ selector, data }: any) {
        const row = store.get(selector.id);
        if (!row) return [];
        Object.assign(row, data);
        return [row];
      },
    }) as ShcDropModuleService;

    const cartState = {
      items: [
        {
          product_id: "drop_drop_full",
          name: "Full",
          qty: 1,
          price: 1,
          cook_id: "cook_1",
          drop_id: "drop_full",
          collection_date: tomorrow(),
          collection_slot: "18:00-19:00",
        },
      ],
      cookId: "cook_1",
      drop_id: "drop_full",
    };
    const cartService = {
      getCart: async () => cartState,
      clearCart: async () => {
        throw new Error("should not clear cart on failed reserve");
      },
    };

    const token = signShcToken({ actor_type: "customer", actor_id: "cust_1", shc: true });
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      scope: {
        resolve(name: string) {
          if (name === "shcDrop") return dropService;
          if (name === "shcCart") return cartService;
          if (name === "shcOrderMeta") return { createOrUpdateMeta: async () => {}, addOrderMessage: async () => {}, getOrderMetaWithMessages: async () => ({}) };
          if (name === "shcNotification") return { push: async () => {} };
          throw new Error(name);
        },
      },
    };

    await expect(
      completeDemoCartCheckout(req, {
        collection_date: tomorrow(),
        collection_slot: "18:00-19:00",
        allergen_acked: true,
        pdpa_consent: true,
      })
    ).rejects.toMatchObject({ message: expect.stringMatching(/sold out|Cannot|window|closed/i) });

    // cart still has items
    expect(cartState.items).toHaveLength(1);
  });
});
