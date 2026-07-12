import { describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { signShcToken } from "../../../../lib/shc-auth";

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

describe("GET /store/shc/drops", () => {
  it("lists marketplace open batches with orderable fields", async () => {
    const drops = [
      {
        id: "drop_1",
        title: "Samosas",
        cook_id: "cook_1",
        price_cents: 120,
        price: 1.2,
        cook_date: "2026-07-13",
        collection_slot: "18:00-19:00",
        remaining_qty: 28,
        ordered_qty: 12,
        max_qty: 40,
        order_by: "2026-07-12T22:00:00.000Z",
        status: "open",
      },
    ];
    const req: any = {
      headers: {},
      query: {},
      scope: {
        resolve(name: string) {
          if (name === "shcDrop") {
            return {
              listMarketplace: async () => drops,
              listForCook: async () => {
                throw new Error("should not list for cook");
              },
            };
          }
          if (name === "shcCook") {
            return {
              listAndCountCooks: async () => [
                [{ id: "cook_1", display_name: "Auntie Rose", slug: "rose", area: "Tampines" }],
                1,
              ],
            };
          }
          if (name === "logger") return console;
          throw new Error(`Unknown ${name}`);
        },
      },
    };
    const res = makeRes();
    await GET(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.drops).toHaveLength(1);
    expect(res.body.drops[0]).toMatchObject({
      title: "Samosas",
      price_cents: 120,
      cook_date: "2026-07-13",
      collection_slot: "18:00-19:00",
      remaining_qty: 28,
      order_by: expect.any(String),
      cook_name: "Auntie Rose",
    });
    // must not include sold_out in marketplace payload from handler (service already filters)
    expect(res.body.drops.every((d: any) => d.status === "open")).toBe(true);
  });

  it("lists by cook_id with activeOnly", async () => {
    let seenCook: string | undefined;
    const req: any = {
      headers: {},
      query: { cook_id: "cook_1" },
      scope: {
        resolve(name: string) {
          if (name === "shcDrop") {
            return {
              listForCook: async (cookId: string, opts: any) => {
                seenCook = cookId;
                expect(opts?.activeOnly).toBe(true);
                return [
                  {
                    id: "drop_k",
                    title: "Kueh",
                    cook_id: cookId,
                    price_cents: 200,
                    cook_date: "2026-07-14",
                    collection_slot: "17:00-18:00",
                    remaining_qty: 5,
                    order_by: "2026-07-13T20:00:00.000Z",
                    status: "open",
                  },
                ];
              },
            };
          }
          if (name === "shcCook") return {};
          if (name === "logger") return console;
          throw new Error(`Unknown ${name}`);
        },
      },
    };
    const res = makeRes();
    await GET(req, res);
    expect(seenCook).toBe("cook_1");
    expect(res.body.drops[0].title).toBe("Kueh");
  });
});

describe("POST /store/shc/drops", () => {
  it("creates a batch for authenticated cook", async () => {
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    let created: any;
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      body: {
        title: "Samosas",
        price: 1.2,
        max_qty: 40,
        min_qty: 10,
        cook_date: "2026-07-13",
        collection_slot: "18:00-19:00",
        order_by: "2026-07-12T22:00:00.000Z",
      },
      scope: {
        resolve(name: string) {
          if (name === "shcDrop") {
            return {
              createDrop: async (payload: any) => {
                created = { id: "drop_new", ...payload, ordered_qty: 0, remaining_qty: payload.max_qty, status: "open" };
                return created;
              },
            };
          }
          if (name === "logger") return console;
          throw new Error(`Unknown ${name}`);
        },
      },
    };
    const res = makeRes();
    await POST(req, res);
    expect(res.statusCode).toBe(201);
    expect(created.cook_id).toBe("cook_1");
    expect(created.price_cents).toBe(120);
    expect(res.body.drop.title).toBe("Samosas");
  });

  it("rejects unauthenticated create", async () => {
    const req: any = {
      headers: {},
      body: { title: "X", price: 1, max_qty: 5, cook_date: "2026-07-13", collection_slot: "18:00-19:00", order_by: "x" },
      scope: { resolve: () => ({}) },
    };
    const res = makeRes();
    await POST(req, res);
    expect(res.statusCode).toBe(401);
  });
});
