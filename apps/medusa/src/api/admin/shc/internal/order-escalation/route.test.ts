import { afterEach, describe, expect, it } from "vitest";
import { POST } from "./route";

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

describe("POST /admin/shc/internal/order-escalation", () => {
  afterEach(() => {
    delete process.env.WORKER_API_KEY;
  });

  it("reminds cooks for paid orders", async () => {
    process.env.WORKER_API_KEY = "worker-secret";
    const pushed: Array<{ actor: string; body: string }> = [];
    const req: any = {
      headers: { "x-worker-api-key": "worker-secret" },
      scope: {
        resolve(name: string) {
          if (name === "shcOrderMeta") {
            return {
              listAndCountOrderMetas: async () => [
                [
                  { order_id: "SHC-1", cook_id: "cook_1", shc_status: "paid" },
                  { order_id: "SHC-2", cook_id: "cook_2", shc_status: "paid" },
                ],
                2,
              ],
            };
          }
          if (name === "shcNotification") {
            return {
              push: async (actor: string, payload: any) => pushed.push({ actor, body: payload.body }),
            };
          }
          if (name === "logger") return console;
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await POST(req, res);

    expect(res.body.reminded).toBe(2);
    expect(pushed.map((p) => p.actor)).toEqual(["cook_1", "cook_2"]);
  });

  it("rejects unauthorized worker calls", async () => {
    process.env.WORKER_API_KEY = "worker-secret";
    const req: any = { headers: { "x-worker-api-key": "wrong" }, scope: { resolve: () => ({}) } };
    const res = makeRes();

    await POST(req, res);

    expect(res.statusCode).toBe(401);
  });
});
