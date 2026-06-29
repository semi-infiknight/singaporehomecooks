import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { signShcToken } from "../../../../../../lib/shc-auth";

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

describe("POST /store/shc/bids/:id/accept", () => {
  it("creates a customer-scoped order from an accepted bid", async () => {
    const token = signShcToken({ actor_type: "customer", actor_id: "cust_1", shc: true });
    let savedMeta: any;
    const req: any = {
      params: { id: "bid_1" },
      headers: { authorization: `Bearer ${token}` },
      body: { collection_date: "2026-07-15", collection_slot: "12:00-13:00" },
      scope: {
        resolve(name: string) {
          if (name === "shcBid") {
            return {
              getBid: async () => ({
                id: "bid_1",
                request_id: "req_1",
                cook_id: "cook_1",
                price_cents: 12000,
                status: "pending",
              }),
              acceptBid: async (id: string) => ({ id, status: "accepted", price_cents: 12000 }),
            };
          }
          if (name === "shcRequest") {
            return {
              getRequest: async () => ({
                id: "req_1",
                customer_id: "cust_1",
                body: "Ayam buah keluak for Hari Raya",
                party_size: 6,
                date: "2026-07-12",
                status: "open",
              }),
              updateRequestStatus: async () => ({}),
            };
          }
          if (name === "shcNotification") {
            return { push: async () => ({}) };
          }
          if (name === "shcOrderMeta") {
            return {
              createOrUpdateMeta: async (meta: any) => {
                savedMeta = meta;
                return meta;
              },
              addOrderMessage: async () => ({}),
              getOrderMetaWithMessages: async () => null,
              transitionOrderState: async () => ({ valid: true, meta: {} }),
            };
          }
          if (name === "shcCook") {
            return { getCookWithPushToken: async () => null };
          }
          if (name === "logger") return console;
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await POST(req, res);

    if (res.statusCode !== 200) {
      throw new Error(`Unexpected ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    expect(res.body.ok).toBe(true);
    expect(res.body.order_id).toMatch(/^SHC-/);
    expect(res.body.order.customer_id).toBe("cust_1");
    expect(savedMeta.customer_id).toBe("cust_1");
    expect(savedMeta.total_cents).toBe(12000);
    expect(savedMeta.origin_request_id).toBe("req_1");
    expect(savedMeta.collection_slot).toBe("12:00-13:00");
  });
});
