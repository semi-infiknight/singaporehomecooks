import { describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { signShcToken } from "../../../../lib/shc-auth";

vi.mock("../../../../lib/shc-event-bus", () => ({
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

describe("GET /store/shc/requests", () => {
  it("scopes mine=true to the authenticated customer", async () => {
    const token = signShcToken({ actor_type: "customer", actor_id: "cust_1", shc: true });
    let listedFor: string | undefined;
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      query: { mine: "true" },
      scope: {
        resolve(name: string) {
          if (name === "shcRequest") {
            return {
              listRequestsForCustomer: async (customerId: string) => {
                listedFor = customerId;
                return [{ id: "req_1", body: "Nasi lemak for 8 pax", customer_id: customerId, status: "open" }];
              },
              listOpenRequests: async () => {
                throw new Error("should not list open requests when mine=true");
              },
            };
          }
          if (name === "logger") return console;
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(listedFor).toBe("cust_1");
    expect(res.body.requests).toHaveLength(1);
    expect(res.body.requests[0].id).toBe("req_1");
  });

  it("lists open requests for cooks when mine is not set", async () => {
    const req: any = {
      headers: {},
      query: {},
      scope: {
        resolve(name: string) {
          if (name === "shcRequest") {
            return {
              listOpenRequests: async () => [{ id: "req_open", body: "Laksa for reunion", status: "open" }],
              listRequestsForCustomer: async () => {
                throw new Error("should not scope to customer");
              },
            };
          }
          if (name === "logger") return console;
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.body.requests[0].id).toBe("req_open");
  });
});

describe("POST /store/shc/requests", () => {
  it("creates a customer request when request_dish flag is enabled", async () => {
    const token = signShcToken({ actor_type: "customer", actor_id: "cust_1", shc: true });
    let created: any;
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      body: {
        body: "Looking for ayam buah keluak for Hari Raya weekend gathering",
        party_size: 8,
        budget_cents: 18000,
        date: "2026-07-12",
      },
      scope: {
        resolve(name: string) {
          if (name === "shcFeatureFlag") {
            return { isEnabled: async () => true };
          }
          if (name === "shcRequest") {
            return {
              createRequest: async (payload: any) => {
                created = { id: "req_new", ...payload };
                return created;
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
    expect(created.customer_id).toBe("cust_1");
    expect(res.body.request.id).toBe("req_new");
  });

  it("returns 403 when request_dish feature flag is disabled", async () => {
    const token = signShcToken({ actor_type: "customer", actor_id: "cust_1", shc: true });
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      body: { body: "Looking for ayam buah keluak for Hari Raya weekend gathering" },
      scope: {
        resolve(name: string) {
          if (name === "shcFeatureFlag") {
            return { isEnabled: async () => false };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await POST(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body.error?.message).toMatch(/temporarily unavailable/i);
  });
});
