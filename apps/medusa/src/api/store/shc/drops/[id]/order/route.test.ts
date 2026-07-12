import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { signShcToken } from "../../../../../../lib/shc-auth";

vi.mock("../../../../../../lib/shc-event-bus", () => ({
  emitShcEvent: vi.fn(async () => {}),
}));

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

describe("POST /store/shc/drops/:id/order", () => {
  it("reserves capacity and creates order with fixed collection from drop", async () => {
    const token = signShcToken({ actor_type: "customer", actor_id: "cust_1", shc: true });
    let reservedQty: number | undefined;
    let metaPayload: any;
    const dropAfter = {
      id: "drop_1",
      title: "Samosas",
      cook_id: "cook_1",
      price_cents: 120,
      cook_date: "2026-07-13",
      collection_slot: "18:00-19:00",
      ordered_qty: 5,
      remaining_qty: 35,
      max_qty: 40,
      status: "open",
      note: "with chutney",
    };
    const req: any = {
      params: { id: "drop_1" },
      headers: { authorization: `Bearer ${token}` },
      body: { qty: 5, allergen_acked: true, pdpa_consent: true },
      scope: {
        resolve(name: string) {
          if (name === "shcDrop") {
            return {
              reserveQty: async (_id: string, qty: number) => {
                reservedQty = qty;
                return { drop: dropAfter, qty };
              },
            };
          }
          if (name === "shcOrderMeta") {
            return {
              createOrUpdateMeta: async (payload: any) => {
                metaPayload = payload;
              },
              addOrderMessage: async () => {},
              getOrderMetaWithMessages: async () => ({ messages: [] }),
            };
          }
          if (name === "shcNotification") {
            return { push: async () => {} };
          }
          if (name === "logger") return console;
          throw new Error(`Unknown ${name}`);
        },
      },
    };
    const res = makeRes();
    await POST(req, res);

    expect(reservedQty).toBe(5);
    expect(res.statusCode).toBe(201);
    expect(res.body.order.collection_date).toBe("2026-07-13");
    expect(res.body.order.collection_slot).toBe("18:00-19:00");
    expect(res.body.order.origin_drop_id).toBe("drop_1");
    expect(res.body.drop.remaining_qty).toBe(35);
    expect(metaPayload.collection_date).toBe("2026-07-13");
    expect(metaPayload.origin_request_id).toBe("drop:drop_1");
    // no collab bid path
    expect(res.body.bid).toBeUndefined();
  });

  it("rejects over-capacity / expired with 400 from reserveQty", async () => {
    const token = signShcToken({ actor_type: "customer", actor_id: "cust_1", shc: true });
    const req: any = {
      params: { id: "drop_x" },
      headers: { authorization: `Bearer ${token}` },
      body: { qty: 1 },
      scope: {
        resolve(name: string) {
          if (name === "shcDrop") {
            return {
              reserveQty: async () => {
                const err: any = { code: "SHC-GENERIC-001", message: "Order window closed" };
                throw err;
              },
            };
          }
          if (name === "shcOrderMeta") return {};
          if (name === "logger") return console;
          throw new Error(`Unknown ${name}`);
        },
      },
    };
    const res = makeRes();
    await POST(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toMatch(/closed/i);
  });
});
