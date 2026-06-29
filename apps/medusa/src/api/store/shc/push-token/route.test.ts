import { describe, expect, it } from "vitest";
import { POST } from "./route";
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

describe("POST /store/shc/push-token", () => {
  it("persists web push subscriptions for authenticated customers", async () => {
    const token = signShcToken({ actor_type: "customer", actor_id: "cust_1", shc: true });
    let savedMetadata: Record<string, unknown> | undefined;
    const subscription = {
      endpoint: "https://push.example/web/abc",
      keys: { p256dh: "key", auth: "auth" },
    };
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      body: { web_push_subscription: subscription, role: "customer" },
      scope: {
        resolve(name: string) {
          if (name === "customer") {
            return {
              updateCustomers: async (rows: any[]) => {
                savedMetadata = rows[0]?.metadata;
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

    expect(res.body.success).toBe(true);
    expect(res.body.web_push).toBe(true);
    expect(savedMetadata?.web_push_subscription).toEqual(subscription);
  });

  it("rejects cook registration without expo token", async () => {
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      body: { web_push_subscription: { endpoint: "https://push.example/web/abc" } },
      scope: { resolve: () => ({}) },
    };
    const res = makeRes();

    await POST(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error?.message).toMatch(/expo_push_token required/i);
  });
});
