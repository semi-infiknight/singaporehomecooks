import { describe, expect, it } from "vitest";
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

describe("POST /admin/shc/disputes/:id", () => {
  it("updates dispute status and resolution", async () => {
    let updatePayload: any;
    let metaUpdate: any;
    const req: any = {
      params: { id: "disp_1" },
      body: { status: "resolved", resolution: "Refunded manually" },
      scope: {
        resolve(name: string) {
          if (name === "shcDispute") {
            return {
              updateDisputes: async (payload: any) => {
                updatePayload = payload;
                return [{ id: payload.selector.id, order_id: "SHC-1", ...payload.data }];
              },
            };
          }
          if (name === "shcOrderMeta") {
            return {
              createOrUpdateMeta: async (payload: any) => {
                metaUpdate = payload;
                return payload;
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

    expect(updatePayload.selector.id).toBe("disp_1");
    expect(metaUpdate).toEqual({ order_id: "SHC-1", shc_status: "resolved" });
    expect(res.body.dispute.status).toBe("resolved");
    expect(res.body.dispute.resolution).toMatch(/Refunded/);
  });
});
