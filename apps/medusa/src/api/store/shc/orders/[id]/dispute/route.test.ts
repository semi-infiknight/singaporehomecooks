import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";
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

describe("POST /store/shc/orders/:id/dispute", () => {
  it("creates a customer dispute for an owned order", async () => {
    const token = signShcToken({ actor_type: "customer", actor_id: "cust_1", shc: true });
    let created: any;
    let notified: any;
    let metaUpdate: any;
    const req: any = {
      params: { id: "SHC-1" },
      headers: { authorization: `Bearer ${token}` },
      body: { type: "quality", notes: "Dish was not as described" },
      scope: {
        resolve(name: string) {
          if (name === "shcOrderMeta") {
            return {
              getOrderMetaWithMessages: async () => ({ meta: { order_id: "SHC-1", customer_id: "cust_1", cook_id: "cook_1" } }),
              createOrUpdateMeta: async (payload: any) => {
                metaUpdate = payload;
                return payload;
              },
            };
          }
          if (name === "shcDispute") {
            return {
              createDisputes: async (rows: any[]) => {
                created = rows[0];
                return [{ id: "disp_1", ...rows[0] }];
              },
            };
          }
          if (name === "shcNotification") {
            return {
              push: async (target: string, payload: any) => {
                notified = { target, payload };
              },
            };
          }
          if (name === "logger") return console;
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await POST(req, res);

    expect(res.statusCode).toBe(201);
    expect(created.raised_by).toBe("customer");
    expect(created.order_id).toBe("SHC-1");
    expect(metaUpdate.shc_status).toBe("disputed");
    expect(notified.target).toBe("cook_1");
    expect(res.body.dispute.id).toBe("disp_1");
  });

  it("rejects customer disputes for another customer's order", async () => {
    const token = signShcToken({ actor_type: "customer", actor_id: "cust_2", shc: true });
    const req: any = {
      params: { id: "SHC-1" },
      headers: { authorization: `Bearer ${token}` },
      body: { type: "other", notes: "Please review this order" },
      scope: {
        resolve(name: string) {
          if (name === "shcOrderMeta") {
            return { getOrderMetaWithMessages: async () => ({ meta: { order_id: "SHC-1", customer_id: "cust_1", cook_id: "cook_1" } }) };
          }
          if (name === "shcDispute") return { createDisputes: async () => [] };
          if (name === "shcNotification") return { push: async () => {} };
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await POST(req, res);

    expect(res.statusCode).toBe(401);
  });
});

describe("GET /store/shc/orders/:id/dispute", () => {
  it("lists disputes for an accessible cook order", async () => {
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    const req: any = {
      params: { id: "SHC-1" },
      headers: { authorization: `Bearer ${token}` },
      scope: {
        resolve(name: string) {
          if (name === "shcOrderMeta") {
            return { getOrderMetaWithMessages: async () => ({ meta: { order_id: "SHC-1", customer_id: "cust_1", cook_id: "cook_1" } }) };
          }
          if (name === "shcDispute") {
            return { listAndCountDisputes: async () => [[{ id: "disp_1", order_id: "SHC-1" }], 1] };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.body.count).toBe(1);
    expect(res.body.disputes[0].id).toBe("disp_1");
  });
});
