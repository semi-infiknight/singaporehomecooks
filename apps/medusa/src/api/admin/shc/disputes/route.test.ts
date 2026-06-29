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

describe("GET /admin/shc/disputes", () => {
  it("lists open disputes by default", async () => {
    let filters: any;
    const req: any = {
      query: {},
      scope: {
        resolve(name: string) {
          if (name === "shcDispute") {
            return {
              listAndCountDisputes: async (f: any) => {
                filters = f;
                return [[{ id: "disp_1", order_id: "SHC-1", status: "open" }], 1];
              },
            };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(filters.status).toBe("open");
    expect(res.body.disputes[0].id).toBe("disp_1");
  });
});

describe("POST /admin/shc/disputes", () => {
  it("creates a dispute for an order", async () => {
    let payload: any;
    const req: any = {
      body: {
        order_id: "SHC-1",
        raised_by: "customer",
        type: "quality",
        notes: "Food was not as described",
      },
      scope: {
        resolve(name: string) {
          if (name === "shcDispute") {
            return {
              createDisputes: async (rows: any[]) => {
                payload = rows[0];
                return [{ id: "disp_1", ...rows[0] }];
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
    expect(payload.status).toBe("open");
    expect(res.body.dispute.order_id).toBe("SHC-1");
  });
});
