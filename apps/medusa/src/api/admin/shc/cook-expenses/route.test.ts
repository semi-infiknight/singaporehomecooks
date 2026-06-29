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

describe("GET /admin/shc/cook-expenses", () => {
  it("lists cook expenses with filters", async () => {
    let filters: any;
    const req: any = {
      query: { cook_id: "cook_1", category: "ingredients" },
      scope: {
        resolve(name: string) {
          if (name === "shcCookExpense") {
            return {
              listAndCountCookExpenses: async (f: any) => {
                filters = f;
                return [[{ id: "exp_1", cook_id: "cook_1", amount_cents: 1200 }], 1];
              },
            };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(filters).toEqual({ cook_id: "cook_1", category: "ingredients" });
    expect(res.body.count).toBe(1);
  });
});

describe("POST /admin/shc/cook-expenses", () => {
  it("creates a cook expense", async () => {
    let payload: any;
    const req: any = {
      body: { cook_id: "cook_1", amount_cents: 1800, category: "ingredients", date: "2026-07-01" },
      scope: {
        resolve(name: string) {
          if (name === "shcCookExpense") {
            return {
              createCookExpenses: async (rows: any[]) => {
                payload = rows[0];
                return [{ id: "exp_1", ...rows[0] }];
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
    expect(payload.amount_cents).toBe(1800);
    expect(res.body.expense.id).toBe("exp_1");
  });
});
