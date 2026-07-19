import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../lib/shc-compliance-preview", () => ({
  buildCompliancePreviewUrl: vi.fn(async (fileKey: string) => ({
    preview_url: `https://minio.test/${fileKey}?sig=1`,
    bucket: "shc-images",
    expires_in: 900,
    content_type: "application/pdf",
  })),
}));

import { GET } from "./route";
import { buildCompliancePreviewUrl } from "../../../../../../lib/shc-compliance-preview";

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

describe("GET /admin/shc/compliance/:id/preview-url", () => {
  it("returns a signed preview URL for an existing doc", async () => {
    vi.mocked(buildCompliancePreviewUrl).mockClear();
    const req: any = {
      params: { id: "comp_1" },
      scope: {
        resolve(name: string) {
          if (name === "shcComplianceDoc") {
            return {
              listAndCountComplianceDocs: async () => [
                [{ id: "comp_1", cook_id: "cook_rose", type: "sfa", file_key: "compliance/cook_rose/sfa.pdf" }],
              ],
            };
          }
          if (name === "logger") return console;
          throw new Error(`Unknown ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.preview_url).toContain("compliance/cook_rose/sfa.pdf");
    expect(res.body.expires_in).toBe(900);
    expect(buildCompliancePreviewUrl).toHaveBeenCalledWith("compliance/cook_rose/sfa.pdf");
  });

  it("404 when doc missing", async () => {
    const req: any = {
      params: { id: "missing" },
      scope: {
        resolve(name: string) {
          if (name === "shcComplianceDoc") {
            return { listAndCountComplianceDocs: async () => [[]] };
          }
          throw new Error(`Unknown ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.statusCode).toBe(404);
  });
});
