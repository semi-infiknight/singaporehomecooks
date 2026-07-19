import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/shc-compliance-ops-notify", () => ({
  notifyOpsComplianceDocSubmitted: vi.fn(async () => ({ pagerduty: false, in_app: false })),
}));

import { GET, POST } from "./route";
import { signShcToken } from "../../../../lib/shc-auth";
import { notifyOpsComplianceDocSubmitted } from "../../../../lib/shc-compliance-ops-notify";

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

describe("POST /store/shc/compliance", () => {
  it("creates a compliance document for the authenticated cook", async () => {
    vi.mocked(notifyOpsComplianceDocSubmitted).mockClear();
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    let createdPayload: any;
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      body: { type: "sfa", file_key: "compliance/cook_1/sfa.pdf" },
      scope: {
        resolve(name: string) {
          if (name === "shcComplianceDoc") {
            return {
              createComplianceDocs: async (payloads: any[]) => {
                createdPayload = payloads[0];
                return payloads;
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
    expect(createdPayload.cook_id).toBe("cook_1");
    expect(createdPayload.type).toBe("sfa");
    expect(res.body.doc.file_key).toBe("compliance/cook_1/sfa.pdf");
    expect(notifyOpsComplianceDocSubmitted).toHaveBeenCalledWith(
      req.scope,
      expect.objectContaining({
        cook_id: "cook_1",
        type: "sfa",
        file_key: "compliance/cook_1/sfa.pdf",
      })
    );
  });
});

describe("GET /store/shc/compliance", () => {
  it("lists compliance documents for the authenticated cook", async () => {
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      scope: {
        resolve(name: string) {
          if (name === "shcComplianceDoc") {
            return {
              listAndCountComplianceDocs: async () => [[{ id: "comp_1", cook_id: "cook_1", type: "sfa", file_key: "compliance/cook_1/sfa.pdf" }]],
            };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.body.docs).toHaveLength(1);
    expect(res.body.docs[0].type).toBe("sfa");
  });
});
