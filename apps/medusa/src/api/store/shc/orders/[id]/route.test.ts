import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { signShcToken } from "../../../../../lib/shc-auth";

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

describe("GET /store/shc/orders/:id", () => {
  const meta = {
    order_id: "ord_1",
    cook_id: "cook_rose",
    shc_status: "paid",
    collection_date: "2026-07-28",
    collection_slot: "18:00-19:00",
    // Far-future release so unauthenticated/customer view still hides collection before gate.
    address_released_at: "2099-07-27T18:00:00.000Z",
    total_cents: 2500,
    items: [{ name: "Laksa", qty: 1, product_id: "p1" }],
  };

  const cook = {
    id: "cook_rose",
    display_name: "Auntie Rose",
    collection_address: "Blk 456 Tampines St 42 #05-123",
    collection_instructions: "Lift lobby B",
  };

  function makeReq(auth?: { actor_type: "customer" | "cook"; actor_id: string }) {
    const headers: Record<string, string> = {};
    if (auth) {
      headers.authorization = `Bearer ${signShcToken(auth)}`;
    }
    return {
      params: { id: "ord_1" },
      headers,
      scope: {
        resolve(name: string) {
          if (name === "shcOrderMeta") {
            return {
              getOrderMetaWithMessages: async () => ({ meta, messages: [] }),
            };
          }
          if (name === "shcCook") {
            return {
              listAndCountCooks: async () => [[cook], 1],
            };
          }
          throw new Error(`Unknown ${name}`);
        },
      },
    };
  }

  it("hides cook collection fields for unauthenticated customer before release", async () => {
    const res = makeRes();
    await GET(makeReq() as any, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.order.cook_name).toBe("Auntie Rose");
    expect(res.body.order.collection_address_released).toBe(false);
    expect(res.body.order.collection_address).toBeUndefined();
    expect(res.body.order.collection_instructions).toBeUndefined();
  });

  it("exposes collection fields for cook viewer before customer release", async () => {
    const res = makeRes();
    await GET(
      makeReq({ actor_type: "cook", actor_id: "cook_rose" }) as any,
      res
    );
    expect(res.body.order.collection_address_released).toBe(true);
    expect(res.body.order.collection_address).toBe(cook.collection_address);
    expect(res.body.order.collection_instructions).toBe(cook.collection_instructions);
  });

  it("exposes collection fields for customer after release time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2099-07-27T19:00:00.000Z"));
    const res = makeRes();
    await GET(
      makeReq({ actor_type: "customer", actor_id: "cust_1" }) as any,
      res
    );
    expect(res.body.order.collection_address_released).toBe(true);
    expect(res.body.order.collection_address).toBe(cook.collection_address);
    vi.useRealTimers();
  });
});
