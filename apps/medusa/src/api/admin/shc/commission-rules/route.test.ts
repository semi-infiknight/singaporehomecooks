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

describe("GET /admin/shc/commission-rules", () => {
  it("lists commission rules", async () => {
    const req: any = {
      query: {},
      scope: {
        resolve(name: string) {
          if (name === "shcCommissionRule") {
            return {
              listAndCountCommissionRules: async () => [[{ id: "cr_1", version: 1, rate_pct: 15 }], 1],
            };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.body.count).toBe(1);
    expect(res.body.rules[0].rate_pct).toBe(15);
  });
});

describe("POST /admin/shc/commission-rules", () => {
  it("creates a commission rule", async () => {
    let payload: any;
    const req: any = {
      body: {
        version: 2,
        rate_pct: 15,
        gst_rate: 9,
        effective_from: "2026-07-01",
        created_by: "ops",
      },
      scope: {
        resolve(name: string) {
          if (name === "shcCommissionRule") {
            return {
              createCommissionRules: async (rows: any[]) => {
                payload = rows[0];
                return [{ id: "cr_2", ...rows[0] }];
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
    expect(payload.effective_from).toBeInstanceOf(Date);
    expect(res.body.rule.version).toBe(2);
  });
});
