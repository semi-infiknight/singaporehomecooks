import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

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

function makeStatService(value?: unknown) {
  return {
    listAndCountPlatformStats: async () => [[value ? { id: "ps_1", value } : null].filter(Boolean), value ? 1 : 0],
    updatePlatformStats: async ({ data }: any) => [{ id: "ps_1", value: data.value }],
    createPlatformStats: async (rows: any[]) => rows,
  };
}

describe("GET /admin/shc/business-rules", () => {
  it("returns normalized config", async () => {
    const req: any = {
      scope: {
        resolve(name: string) {
          if (name === "shcPlatformStat") {
            return makeStatService({ drop: { customer_window_days: 10 } });
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();
    await GET(req, res);
    expect(res.body.config.drop.customer_window_days).toBe(10);
    expect(res.body.defaults.commission.default_rate_pct).toBe(15);
  });
});

describe("POST /admin/shc/business-rules", () => {
  it("patches business rules", async () => {
    let saved: any;
    const req: any = {
      body: { cart: { one_cook_enforced: false }, commission: { default_rate_pct: 12 } },
      scope: {
        resolve(name: string) {
          if (name === "shcPlatformStat") {
            return {
              ...makeStatService(),
              updatePlatformStats: async ({ data }: any) => {
                saved = data.value;
                return [{ id: "ps_1", value: data.value }];
              },
              createPlatformStats: async (rows: any[]) => {
                saved = rows[0].value;
                return rows;
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
    expect(res.body.config.cart.one_cook_enforced).toBe(false);
    expect(saved.commission.default_rate_pct).toBe(12);
  });
});
