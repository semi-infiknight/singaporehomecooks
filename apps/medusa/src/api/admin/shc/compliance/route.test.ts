import { describe, expect, it } from "vitest";
import { GET } from "./route";

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

describe("GET /admin/shc/compliance", () => {
  it("returns pending docs enriched with cook display name", async () => {
    const req: any = {
      query: { status: "pending", limit: "20" },
      scope: {
        resolve(name: string) {
          if (name === "shcComplianceDoc") {
            return {
              listAndCountComplianceDocs: async () => [
                [
                  {
                    id: "comp_1",
                    cook_id: "cook_rose",
                    type: "sfa",
                    file_key: "compliance/cook_rose/sfa.pdf",
                    verified_at: null,
                    created_at: "2026-07-01T00:00:00.000Z",
                  },
                  {
                    id: "comp_2",
                    cook_id: "cook_rose",
                    type: "wsq",
                    file_key: "compliance/cook_rose/wsq.pdf",
                    verified_at: new Date().toISOString(),
                    created_at: "2026-07-01T00:00:00.000Z",
                  },
                ],
              ],
            };
          }
          if (name === "shcCook") {
            return {
              listAndCountCooks: async (filters: any) =>
                filters.id === "cook_rose"
                  ? [[{ id: "cook_rose", display_name: "Rose Kitchen", area: "Tampines", slug: "rose" }]]
                  : [[]],
            };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.docs).toHaveLength(1);
    expect(res.body.docs[0].type).toBe("sfa");
    expect(res.body.docs[0].cook_display_name).toBe("Rose Kitchen");
    expect(res.body.pending_count).toBe(1);
  });
});
