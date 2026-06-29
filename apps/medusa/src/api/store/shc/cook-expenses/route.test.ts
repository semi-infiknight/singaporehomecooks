import { describe, expect, it } from "vitest";
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

describe("GET /store/shc/cook-expenses", () => {
  it("lists only the authenticated cook's expenses", async () => {
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    let filters: any;
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      scope: {
        resolve(name: string) {
          if (name === "shcCookExpense") {
            return {
              listAndCountCookExpenses: async (f: any) => {
                filters = f;
                return [[{ id: "exp_1", cook_id: "cook_1", amount_cents: 2500, category: "ingredients" }], 1];
              },
            };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(filters.cook_id).toBe("cook_1");
    expect(res.body.total_cents).toBe(2500);
  });
});

describe("POST /store/shc/cook-expenses", () => {
  it("creates an expense owned by the authenticated cook", async () => {
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    let payload: any;
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      body: { amount_cents: 1800, category: "ingredients", receipt_key: "receipts/cook_1/fish.jpg", date: "2026-07-01" },
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
    expect(payload.cook_id).toBe("cook_1");
    expect(res.body.expense.receipt_key).toBe("receipts/cook_1/fish.jpg");
  });
});
