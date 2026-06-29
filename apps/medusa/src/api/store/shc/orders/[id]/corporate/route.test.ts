import { describe, expect, it } from "vitest";
import { POST } from "./route";
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

describe("POST /store/shc/orders/:id/corporate", () => {
  it("flags an order as corporate with a customer note", async () => {
    const token = signShcToken({ actor_type: "customer", actor_id: "cust_1", shc: true });
    let saved: any;
    const req: any = {
      params: { id: "SHC-12345678" },
      headers: { authorization: `Bearer ${token}` },
      body: { note: "Group lunch for 12 pax — invoice to ACME Pte Ltd" },
      scope: {
        resolve(name: string) {
          if (name === "shcFeatureFlag") {
            return { isEnabled: async () => true };
          }
          if (name === "shcOrderMeta") {
            return {
              getOrderMetaWithMessages: async () => ({
                meta: { order_id: "SHC-12345678", customer_id: "cust_1" },
              }),
              createOrUpdateMeta: async (meta: any) => {
                saved = meta;
                return meta;
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

    expect(res.body.ok).toBe(true);
    expect(saved.is_corporate).toBe(true);
    expect(saved.corporate_note).toMatch(/ACME/);
  });
});
